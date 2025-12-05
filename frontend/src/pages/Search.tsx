import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';

type Props = {
  session: Session;
};

type SearchResult = {
  id: string;
  type: 'equipment' | 'maintenance';
  title: string;
  subtitle: string;
};

function SearchPage({ session }: Props) {
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'equipment' | 'maintenance'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(results.map((r) => r.type === 'equipment' ? r.subtitle.split(' • ')[0] : null).filter(Boolean) as string[])),
    [results],
  );

  useEffect(() => {
    let active = true;
    const runSearch = async () => {
      if (!term.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);

      const queries: Promise<any>[] = [];

      if (typeFilter === 'all' || typeFilter === 'equipment') {
        queries.push(
          supabase
            .from('equipment')
            .select('id, nickname, unit_number, category, make, model')
            .or(
              `nickname.ilike.%${term}%,unit_number.ilike.%${term}%,category.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%`,
            )
            .limit(20),
        );
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      if (typeFilter === 'all' || typeFilter === 'maintenance') {
        queries.push(
          supabase
            .from('maintenance_logs')
            .select('id, title, description, equipment:equipment_id(nickname, unit_number)')
            .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
            .limit(20),
        );
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      const [equipRes, maintRes] = await Promise.all(queries);
      if (!active) return;

      if (equipRes.error) {
        setError(equipRes.error.message);
        setLoading(false);
        return;
      }
      if (maintRes.error) {
        setError(maintRes.error.message);
        setLoading(false);
        return;
      }

      const equipResults: SearchResult[] = (equipRes.data ?? [])
        .filter((row: any) => (!category ? true : row.category === category))
        .map((row: any) => ({
          id: row.id,
          type: 'equipment',
          title: row.nickname || row.model || 'Equipment',
          subtitle: [row.category, row.make, row.model, row.unit_number ? `Unit ${row.unit_number}` : null]
            .filter(Boolean)
            .join(' • '),
        }));

      const maintResults: SearchResult[] = (maintRes.data ?? []).map((row: any) => ({
        id: row.id,
        type: 'maintenance',
        title: row.title,
        subtitle: row.equipment?.unit_number
          ? `Unit ${row.equipment.unit_number}`
          : row.equipment?.nickname || 'Maintenance',
      }));

      setResults([...equipResults, ...maintResults]);
      setLoading(false);
    };

    runSearch();
    return () => {
      active = false;
    };
  }, [term, category, typeFilter]);

  return (
    <>
      <Nav session={session} email={session.user.email} pageTitle="Search" />
      <div className="app">
        <div className="card stack">
          <h1>Search</h1>
          <div
            style={{
              display: 'grid',
              gap: '0.75rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <label className="stack">
              <span>Keyword</span>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search equipment and maintenance logs"
              />
            </label>
            <label className="stack">
              <span>Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="equipment">Equipment</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>
            <label className="stack">
              <span>Category (equipment)</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="card stack">
          <h2>Results</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="status">{error}</p>}
          {!loading && !error && results.length === 0 && (
            <p>Type a keyword to search equipment and maintenance.</p>
          )}
          {!loading && !error && results.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>{r.type}</td>
                    <td>{r.title}</td>
                    <td>{r.subtitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default SearchPage;
