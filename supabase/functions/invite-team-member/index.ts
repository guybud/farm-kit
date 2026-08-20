import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type InviteRequest = {
  farmId?: string;
  email?: string;
  roleId?: string;
  accountMode?: 'personal' | 'shared';
  displayName?: string;
};

type JsonBody = Record<string, unknown>;

function json(status: number, body: JsonBody) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
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
    return json(500, { error: 'Invite service is not configured.' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json(401, { error: 'Missing authorization header.' });
  }

  let body: InviteRequest;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const farmId = body.farmId?.trim();
  const email = body.email ? cleanEmail(body.email) : '';
  const roleId = body.roleId?.trim();
  const accountMode = body.accountMode ?? 'personal';
  const displayName = body.displayName?.trim() || null;

  if (!farmId || !email || !roleId) {
    return json(400, { error: 'Farm, email, and role are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: 'Enter a valid email address.' });
  }

  if (accountMode !== 'personal' && accountMode !== 'shared') {
    return json(400, { error: 'Invalid account mode.' });
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
    return json(403, { error: 'Only farm admins can invite team members.' });
  }

  const { data: role, error: roleError } = await serviceClient
    .from('roles')
    .select('id')
    .eq('id', roleId)
    .maybeSingle();

  if (roleError) {
    return json(500, { error: roleError.message });
  }

  if (!role) {
    return json(400, { error: 'Selected role no longer exists.' });
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  const [{ count: inviterCount }, { data: recentInvite }] = await Promise.all([
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
      .gte('last_sent_at', tenMinutesAgo)
      .order('last_sent_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if ((inviterCount ?? 0) >= 20) {
    return json(429, { error: 'Invite limit reached. Try again later.' });
  }

  if (recentInvite) {
    return json(429, { error: 'That email was invited recently. Try again in a few minutes.' });
  }

  const { data: existingAuthUserId, error: lookupError } = await serviceClient.rpc(
    'farmkit_auth_user_id_by_email',
    { target_email: email },
  );

  if (lookupError) {
    return json(500, { error: lookupError.message });
  }

  let authUserId = existingAuthUserId as string | null;
  let inviteSent = false;

  if (!authUserId) {
    const origin = req.headers.get('Origin');
    const appUrl =
      Deno.env.get('FARMKIT_APP_URL') ?? origin ?? 'https://farmkit.app';

    const recordFailure = async (errorMessage: string) => {
      await serviceClient.from('farm_team_invites').insert({
        farm_id: farmId,
        email,
        role_id: roleId,
        account_mode: accountMode,
        display_name: displayName,
        status: 'failed',
        created_by_auth_user_id: user.id,
        error_message: errorMessage,
      });
    };

    // Closed beta: the farmkit_block_self_signup trigger rejects every
    // auth.users insert unless the email was pre-authorized here (0009).
    const allowlistExpiry = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const { error: allowError } = await serviceClient
      .from('farmkit_signup_allowlist')
      .upsert({ email, expires_at: allowlistExpiry });

    if (allowError) {
      await recordFailure(allowError.message);
      return json(500, { error: 'Could not authorize the invite.' });
    }

    // Create the account confirmed (the admin vouches for the address), then
    // hand out a recovery link for the set-password step.
    const { data: created, error: createError } =
      await serviceClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: displayName ? { display_name: displayName } : undefined,
      });

    await serviceClient
      .from('farmkit_signup_allowlist')
      .delete()
      .lte('expires_at', new Date().toISOString());
    await serviceClient.from('farmkit_signup_allowlist').delete().eq('email', email);

    if (createError) {
      await recordFailure(createError.message);
      return json(400, { error: createError.message });
    }

    authUserId = created.user?.id ?? null;

    const { data: linkData, error: linkError } =
      await serviceClient.auth.admin.generateLink({ type: 'recovery', email });

    if (linkError) {
      await recordFailure(linkError.message);
      return json(400, { error: linkError.message });
    }

    const tokenHash = linkData.properties?.hashed_token;

    if (!tokenHash) {
      await recordFailure('Invite link was not generated.');
      return json(500, { error: 'Invite link was not generated.' });
    }

    const { data: resendKey, error: keyError } = await serviceClient.rpc(
      'farmkit_service_secret',
      { secret_name: 'resend_api_key' },
    );

    if (keyError || !resendKey) {
      await recordFailure('Email service is not configured.');
      return json(500, { error: 'Email service is not configured.' });
    }

    const { data: farm } = await serviceClient
      .from('farms')
      .select('name')
      .eq('id', farmId)
      .maybeSingle();
    const farmName = farm?.name ?? 'your farm';

    const inviteUrl = `${appUrl}/welcome?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&intent=invite`;
    const greeting = displayName ? `Hi ${displayName},` : 'Hi,';

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FARMKIT_INVITE_FROM') ?? 'Farmkit <invites@send.njmit.net>',
        to: [email],
        subject: `You're invited to join ${farmName} on Farmkit`,
        text: [
          greeting,
          '',
          `You've been invited to join ${farmName} on Farmkit, the farm maintenance tracker.`,
          '',
          'Open this link to set your password and get started:',
          inviteUrl,
          '',
          'This link expires after 24 hours. If it has expired, ask your farm admin to send a new invite.',
          '',
          'The Farmkit team',
        ].join('\n'),
        html: [
          `<p>${greeting}</p>`,
          `<p>You've been invited to join <strong>${farmName}</strong> on Farmkit, the farm maintenance tracker.</p>`,
          `<p><a href="${inviteUrl}">Set your password and get started</a></p>`,
          `<p style="color:#555;font-size:13px">Or copy this link into your browser:<br>${inviteUrl}</p>`,
          `<p style="color:#555;font-size:13px">This link expires after 24 hours. If it has expired, ask your farm admin to send a new invite.</p>`,
          '<p>The Farmkit team</p>',
        ].join('\n'),
      }),
    });

    if (!emailResponse.ok) {
      const detail = await emailResponse.text().catch(() => '');
      await recordFailure(`Email send failed (${emailResponse.status}): ${detail.slice(0, 300)}`);
      return json(502, { error: 'The invite email could not be sent. Try again later.' });
    }

    inviteSent = true;
  }

  if (!authUserId) {
    return json(500, { error: 'Invite did not return a user id.' });
  }

  const profilePayload: Record<string, string> = {
    auth_user_id: authUserId,
    email,
    default_farm_id: farmId,
    updated_at: now.toISOString(),
  };
  if (displayName) {
    profilePayload.display_name = displayName;
  }

  const membershipPayload: Record<string, string> = {
    farm_id: farmId,
    auth_user_id: authUserId,
    role_id: roleId,
    status: inviteSent ? 'invited' : 'active',
    account_mode: accountMode,
    invited_email: email,
    created_by_auth_user_id: user.id,
  };
  if (displayName) {
    membershipPayload.display_name_override = displayName;
  }

  const [{ error: profileError }, { error: membershipError }] = await Promise.all([
    serviceClient
      .from('user_profiles')
      .upsert(profilePayload, { onConflict: 'auth_user_id' }),
    serviceClient
      .from('farm_memberships')
      .upsert(membershipPayload, { onConflict: 'farm_id,auth_user_id' }),
  ]);

  if (profileError) {
    return json(500, { error: profileError.message });
  }

  if (membershipError) {
    return json(500, { error: membershipError.message });
  }

  const { error: auditError } = await serviceClient.from('farm_team_invites').insert({
    farm_id: farmId,
    email,
    auth_user_id: authUserId,
    role_id: roleId,
    account_mode: accountMode,
    display_name: displayName,
    status: inviteSent ? 'sent' : 'accepted',
    created_by_auth_user_id: user.id,
    last_sent_at: inviteSent ? now.toISOString() : null,
    accepted_at: inviteSent ? null : now.toISOString(),
  });

  if (auditError) {
    return json(500, { error: auditError.message });
  }

  return json(200, {
    ok: true,
    inviteSent,
    authUserId,
    message: inviteSent
      ? 'Invite sent.'
      : 'Access granted to an existing Farmkit user.',
  });
});
