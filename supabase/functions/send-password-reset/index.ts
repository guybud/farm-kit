import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ResetRequest = {
  farmId?: string;
  email?: string;
};

type JsonBody = Record<string, unknown>;

function json(status: number, body: JsonBody) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: 'Reset service is not configured.' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json(401, { error: 'Missing authorization header.' });
  }

  let body: ResetRequest;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const farmId = body.farmId?.trim();
  const email = body.email?.trim().toLowerCase() ?? '';

  if (!farmId || !email) {
    return json(400, { error: 'Farm and email are required.' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json(401, { error: 'Invalid session.' });
  }

  const { data: isAdmin, error: adminError } = await userClient.rpc(
    'farmkit_has_farm_role',
    {
      target_farm_id: farmId,
      role_keys: ['admin'],
    },
  );

  if (adminError) {
    return json(500, { error: adminError.message });
  }

  if (!isAdmin) {
    return json(403, { error: 'Only farm admins can send password resets.' });
  }

  const { data: targetAuthUserId, error: lookupError } = await serviceClient.rpc(
    'farmkit_auth_user_id_by_email',
    { target_email: email },
  );

  if (lookupError) {
    return json(500, { error: lookupError.message });
  }

  if (!targetAuthUserId) {
    return json(404, { error: 'No account exists for that email.' });
  }

  const { data: membership } = await serviceClient
    .from('farm_memberships')
    .select('id')
    .eq('farm_id', farmId)
    .eq('auth_user_id', targetAuthUserId)
    .maybeSingle();

  if (!membership) {
    return json(403, { error: 'That account is not a member of this farm.' });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  const [{ count: senderCount }, { data: recentReset }] = await Promise.all([
    serviceClient
      .from('farm_team_invites')
      .select('id', { count: 'exact', head: true })
      .eq('created_by_auth_user_id', user.id)
      .gte('created_at', oneHourAgo),
    serviceClient
      .from('farm_team_invites')
      .select('id, last_sent_at')
      .eq('farm_id', farmId)
      .eq('email', email)
      .eq('status', 'reset_sent')
      .gte('last_sent_at', tenMinutesAgo)
      .order('last_sent_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if ((senderCount ?? 0) >= 20) {
    return json(429, { error: 'Email limit reached. Try again later.' });
  }

  if (recentReset) {
    return json(429, { error: 'A reset was sent to that email recently. Try again in a few minutes.' });
  }

  const recordOutcome = async (status: string, errorMessage?: string) => {
    await serviceClient.from('farm_team_invites').insert({
      farm_id: farmId,
      email,
      auth_user_id: targetAuthUserId,
      status,
      created_by_auth_user_id: user.id,
      last_sent_at: status === 'reset_sent' ? now.toISOString() : null,
      error_message: errorMessage ?? null,
    });
  };

  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({ type: 'recovery', email });

  if (linkError) {
    await recordOutcome('reset_failed', linkError.message);
    return json(400, { error: linkError.message });
  }

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) {
    await recordOutcome('reset_failed', 'Reset link was not generated.');
    return json(500, { error: 'Reset link was not generated.' });
  }

  const { data: resendKey, error: keyError } = await serviceClient.rpc(
    'farmkit_service_secret',
    { secret_name: 'resend_api_key' },
  );

  if (keyError || !resendKey) {
    await recordOutcome('reset_failed', 'Email service is not configured.');
    return json(500, { error: 'Email service is not configured.' });
  }

  const { data: farm } = await serviceClient
    .from('farms')
    .select('name')
    .eq('id', farmId)
    .maybeSingle();
  const farmName = farm?.name ?? 'your farm';

  const origin = req.headers.get('Origin');
  const appUrl = Deno.env.get('FARMKIT_APP_URL') ?? origin ?? 'https://farmkit.app';
  const resetUrl = `${appUrl}/welcome?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&intent=reset`;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('FARMKIT_INVITE_FROM') ?? 'Farmkit <invites@send.njmit.net>',
      to: [email],
      subject: `Reset your Farmkit password (${farmName})`,
      text: [
        'Hi,',
        '',
        `A farm admin for ${farmName} sent you a password reset for Farmkit.`,
        '',
        'Open this link to choose a new password:',
        resetUrl,
        '',
        'This link expires after 24 hours. If it has expired, ask your farm admin to send a new one.',
        '',
        "If you didn't expect this, you can ignore it. Your current password keeps working until you set a new one.",
        '',
        'The Farmkit team',
      ].join('\n'),
      html: [
        '<p>Hi,</p>',
        `<p>A farm admin for <strong>${farmName}</strong> sent you a password reset for Farmkit.</p>`,
        `<p><a href="${resetUrl}">Choose a new password</a></p>`,
        `<p style="color:#555;font-size:13px">Or copy this link into your browser:<br>${resetUrl}</p>`,
        `<p style="color:#555;font-size:13px">This link expires after 24 hours. If it has expired, ask your farm admin to send a new one.</p>`,
        `<p style="color:#555;font-size:13px">If you didn't expect this, you can ignore it. Your current password keeps working until you set a new one.</p>`,
        '<p>The Farmkit team</p>',
      ].join('\n'),
    }),
  });

  if (!emailResponse.ok) {
    const detail = await emailResponse.text().catch(() => '');
    await recordOutcome('reset_failed', `Email send failed (${emailResponse.status}): ${detail.slice(0, 300)}`);
    return json(502, { error: 'The reset email could not be sent. Try again later.' });
  }

  await recordOutcome('reset_sent');

  return json(200, { ok: true, message: 'Password reset email sent.' });
});
