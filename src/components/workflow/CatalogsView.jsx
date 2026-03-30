import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client';

const CATALOGUES = [
  { value: 'crop_catalogue', label: 'Crop/Seed' },
  { value: 'location_catalogue', label: 'Location' },
  { value: 'livestock_catalogue', label: 'Livestock' },
];

export default function CatalogsView({ overviewPath = '/dashboard/overview' }) {
  const [catalogue, setCatalogue] = useState('crop_catalogue');
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [status, setStatus] = useState('');
  const [meta, setMeta] = useState('—');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await apiFetch(`/api/masterdata/${catalogue}?limit=100&offset=0`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows([]);
        setColumns([]);
        setMeta('—');
        setStatus(json.error || `Load failed (${res.status}). Ensure you are logged in as an admin and the API is running.`);
        return;
      }
      const data = Array.isArray(json.data) ? json.data : [];
      setRows(data);
      const keys = data.length ? Object.keys(data[0]) : [];
      setColumns(keys);
      setMeta(`Loaded ${data.length} row(s)${json.count != null ? ` (count: ${json.count})` : ''}.`);
    } catch (e) {
      setRows([]);
      setColumns([]);
      setMeta('—');
      setStatus(e && e.message ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [catalogue]);

  const sync = useCallback(async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await apiFetch('/api/masterdata/sync', {
        method: 'POST',
        body: JSON.stringify({ catalogue }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || `Sync failed (${res.status}).`);
        return;
      }
      setStatus(
        json.success
          ? `Sync started or completed. Job ${json.jobId != null ? `#${json.jobId} ` : ''}${json.elapsed_ms != null ? `(${json.elapsed_ms} ms)` : ''}`
          : 'Sync response received.'
      );
    } catch (e) {
      setStatus(e && e.message ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [catalogue]);

  const thead = useMemo(
    () =>
      columns.map((c) => (
        <th key={c}>{c}</th>
      )),
    [columns]
  );

  return (
    <>
      <nav className="breadcrumb">
        <Link to={overviewPath}>Home</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Catalogs</span>
      </nav>
      <h1 className="page-title">Catalogs</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Admin master data catalogues synced from external systems (crop/seed, location boundaries, livestock).
      </p>

      <div className="toolbar">
        <div className="search-wrap" style={{ gap: 12 }}>
          <label style={{ color: 'var(--text-secondary)' }} htmlFor="catalogue-select-react">
            Catalogue
          </label>
          <select
            id="catalogue-select-react"
            className="filter-select"
            aria-label="Catalogue"
            value={catalogue}
            onChange={(e) => setCatalogue(e.target.value)}
          >
            {CATALOGUES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={sync}>
          Sync now
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={load}>
          {loading ? 'Loading…' : 'Load'}
        </button>
      </div>

      <p style={{ margin: '16px 0', color: 'var(--text-muted)', minHeight: '1.25rem' }}>{status}</p>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>{thead}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} style={{ color: 'var(--text-muted)' }}>
                  No rows. Choose a catalogue and click Load (requires admin JWT).
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col}>{row[col] != null ? String(row[col]) : '—'}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="pagination" style={{ marginTop: 12 }}>
          <span style={{ color: 'var(--text-secondary)' }}>{meta}</span>
        </div>
      </div>
    </>
  );
}
