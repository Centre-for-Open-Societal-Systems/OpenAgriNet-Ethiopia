import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Info, Link2, X } from 'lucide-react';
import { apiFetch, ensureSessionForApi, getApiBase } from '../../api/client';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

/** Rich copy for the “data source” info modal per catalogue. */
const DATA_SOURCE_INFO = {
  crop_catalogue: {
    title: 'Where crop & seed data comes from',
    sections: [
      {
        heading: 'Upstream system',
        body:
          'Variety and crop rows are loaded from the Ministry of Agriculture EthioSeed platform (official crop and registered seed variety catalogues).',
      },
      {
        heading: 'APIs used during sync',
        body: 'OpenAgriNet calls the public JSON catalogues on the configured EthioSeed base URL, typically:',
        list: ['/api/crops-catalog', '/api/varieties-catalog'],
      },
      {
        heading: 'What gets stored',
        body:
          'Each row links a seed variety to its crop where the upstream data allows it. Raw upstream fields are kept in the attributes JSON. Rows are matched by source_system and source_record_key so sync updates existing rows instead of deleting your catalogue.',
      },
      {
        heading: 'Local-only rows',
        body:
          'Rows you add with “Add local row” use local.openagri.net as the source system. Sync does not remove rows that are missing from the upstream API.',
      },
    ],
  },
  location_catalogue: {
    title: 'Where administrative boundary data comes from',
    sections: [
      {
        heading: 'Discovery order',
        body:
          'Sync tries, in order: the MOA open data portal (CKAN, default data.moa.gov.et) to find a GeoJSON resource on the Ethiopian administrative boundary package, then the National Agricultural Data Hub CKAN (datahub.moa.gov.et) if needed, then a direct NSDI GeoServer WFS fallback.',
      },
      {
        heading: 'WFS layer',
        body:
          'The national woreda layer used in code is geonode:eth_woreda_2013 (the older eth_adm2 layer is rewritten to this name when encountered in stored URLs). Output is requested as GeoJSON (EPSG:4326).',
      },
      {
        heading: 'What gets stored',
        body:
          'Each feature becomes a row with level, codes, name, parent code, geometry, and properties in attributes. Identity is stable via source_record_key (typically the administrative P-code where available).',
      },
      {
        heading: 'Local-only rows',
        body: 'Manually added rows use local.openagri.net and are preserved across syncs like other catalogues.',
      },
    ],
  },
  livestock_catalogue: {
    title: 'Where livestock catalogue data comes from',
    sections: [
      {
        heading: 'Upstream discovery',
        body:
          'Sync searches MOA CKAN instances (data.moa.gov.et first, then datahub.moa.gov.et) for datasets tagged or named around livestock or commercialization. It opens candidate datasets and downloads JSON resources only (response limits and timeouts keep sync responsive).',
      },
      {
        heading: 'Built-in seed list',
        body:
          'If no suitable JSON catalogue is found in time, OpenAgriNet loads a short built-in list of common Ethiopian livestock species so administrators always have a working baseline. Those rows are stored with source_system openagrinet.masterdata.seed.',
      },
      {
        heading: 'What gets stored',
        body:
          'Rows map species names, optional program fields, and full upstream rows in attributes. Matching uses source_system and source_record_key for upsert on each sync.',
      },
      {
        heading: 'Local-only rows',
        body: 'Rows you add manually use local.openagri.net and are not removed when upstream discovery returns nothing.',
      },
    ],
  },
};

const DISPLAY_KEYS = {
  crop_catalogue: [
    'variety_name',
    'crop_name',
    'producer_name',
    'seed_supply_notes',
    'source_system',
    'source_record_key',
    'updated_at',
  ],
  location_catalogue: ['level', 'p_code', 'name', 'parent_p_code', 'source_system', 'source_record_key', 'updated_at'],
  livestock_catalogue: [
    'species_common_name',
    'species_scientific_name',
    'production_program',
    'animal_health_program',
    'commercialization_program',
    'source_system',
    'source_record_key',
    'updated_at',
  ],
};

/** Public GET API — modal copy + repo doc filename under docs/OpenAPI/. */
const PUBLIC_API_DOC = {
  crop_catalogue: {
    title: 'Public API — Crop & seed catalogue',
    docFile: 'PublicCropCatalogueAPI.md',
    intro:
      'Integrators can read active crop and seed variety rows without a login. Responses are JSON; only GET is supported on this path.',
  },
  location_catalogue: {
    title: 'Public API — Location catalogue',
    docFile: 'PublicLocationCatalogueAPI.md',
    intro:
      'Integrators can read active administrative boundary rows (levels, codes, names, geometry) without authentication.',
  },
  livestock_catalogue: {
    title: 'Public API — Livestock catalogue',
    docFile: 'PublicLivestockCatalogueAPI.md',
    intro:
      'Integrators can read active livestock species / programme reference rows without authentication. Some rows may come from MOA CKAN or from the built-in seed list.',
  },
};

function emptyForm(catalogue) {
  if (catalogue === 'crop_catalogue') {
    return {
      variety_name: '',
      crop_name: '',
      producer_name: '',
      seed_supply_notes: '',
      attributesText: '{}',
    };
  }
  if (catalogue === 'location_catalogue') {
    return {
      level: 'woreda',
      p_code: '',
      name: '',
      parent_p_code: '',
      geometryText: '',
      attributesText: '{}',
    };
  }
  return {
    species_common_name: '',
    species_scientific_name: '',
    production_program: '',
    animal_health_program: '',
    commercialization_program: '',
    attributesText: '{}',
  };
}

function rowToForm(catalogue, row) {
  if (catalogue === 'crop_catalogue') {
    return {
      variety_name: row.variety_name ?? '',
      crop_name: row.crop_name ?? '',
      producer_name: row.producer_name ?? '',
      seed_supply_notes: row.seed_supply_notes ?? '',
      attributesText: JSON.stringify(row.attributes && typeof row.attributes === 'object' ? row.attributes : {}, null, 2),
    };
  }
  if (catalogue === 'location_catalogue') {
    return {
      level: row.level ?? 'woreda',
      p_code: row.p_code ?? '',
      name: row.name ?? '',
      parent_p_code: row.parent_p_code ?? '',
      geometryText:
        row.geometry_geojson != null ? JSON.stringify(row.geometry_geojson, null, 2) : '',
      attributesText: JSON.stringify(row.attributes && typeof row.attributes === 'object' ? row.attributes : {}, null, 2),
    };
  }
  return {
    species_common_name: row.species_common_name ?? '',
    species_scientific_name: row.species_scientific_name ?? '',
    production_program: row.production_program ?? '',
    animal_health_program: row.animal_health_program ?? '',
    commercialization_program: row.commercialization_program ?? '',
    attributesText: JSON.stringify(row.attributes && typeof row.attributes === 'object' ? row.attributes : {}, null, 2),
  };
}

function buildPayload(catalogue, form, isEdit) {
  let attributes;
  try {
    attributes = form.attributesText.trim() ? JSON.parse(form.attributesText) : {};
    if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
      throw new Error('attributes must be a JSON object');
    }
  } catch (e) {
    throw new Error(e.message || 'Invalid attributes JSON');
  }

  if (catalogue === 'crop_catalogue') {
    const body = {
      variety_name: form.variety_name || null,
      crop_name: form.crop_name || null,
      producer_name: form.producer_name || null,
      seed_supply_notes: form.seed_supply_notes || null,
      attributes,
    };
    if (!isEdit && form.source_record_key) body.source_record_key = form.source_record_key;
    return body;
  }
  if (catalogue === 'location_catalogue') {
    let geometry_geojson = null;
    if (form.geometryText && form.geometryText.trim()) {
      try {
        geometry_geojson = JSON.parse(form.geometryText);
      } catch {
        throw new Error('Invalid geometry GeoJSON');
      }
    }
    const body = {
      level: form.level || 'woreda',
      p_code: form.p_code || null,
      name: form.name || null,
      parent_p_code: form.parent_p_code || null,
      geometry_geojson,
      attributes,
    };
    if (!isEdit && form.source_record_key) body.source_record_key = form.source_record_key;
    return body;
  }
  const body = {
    species_common_name: form.species_common_name || null,
    species_scientific_name: form.species_scientific_name || null,
    production_program: form.production_program || null,
    animal_health_program: form.animal_health_program || null,
    commercialization_program: form.commercialization_program || null,
    attributes,
  };
  if (!isEdit && form.source_record_key) body.source_record_key = form.source_record_key;
  return body;
}

export default function MasterCatalogView({
  catalogue,
  title,
  description,
  sourceLabel,
  overviewPath = '/dashboard/overview',
  breadcrumbParent = { label: 'Master Data' },
}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [meta, setMeta] = useState('—');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [apiDocModalOpen, setApiDocModalOpen] = useState(false);
  const [syncSuccessOpen, setSyncSuccessOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => emptyForm(catalogue));
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [searchDraft, setSearchDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const displayKeys = DISPLAY_KEYS[catalogue] || [];

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchDraft.trim()), 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    setPageIndex(0);
    setSearchDraft('');
    setSearchQuery('');
  }, [catalogue]);

  useEffect(() => {
    if (total <= 0) return;
    const maxIdx = Math.max(0, Math.ceil(total / pageSize) - 1);
    setPageIndex((p) => (p > maxIdx ? maxIdx : p));
  }, [total, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus('');
    try {
      await ensureSessionForApi();
      const limit = pageSize;
      const offset = pageIndex * pageSize;
      const qParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
      const res = await apiFetch(
        `/api/masterdata/${catalogue}/records?limit=${limit}&offset=${offset}${qParam}`
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows([]);
        setTotal(0);
        setMeta('—');
        setStatus(json.error || `Load failed (${res.status}).`);
        return;
      }
      const data = Array.isArray(json.data) ? json.data : [];
      const totalCount = typeof json.total === 'number' ? json.total : data.length;
      setRows(data);
      setTotal(totalCount);
      const from = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
      const to = Math.min((pageIndex + 1) * pageSize, totalCount);
      const filterNote = searchQuery ? ` (filtered by search)` : '';
      setMeta(
        totalCount === 0
          ? 'No matching rows.'
          : `Showing ${from}–${to} of ${totalCount} active row(s)${filterNote}.`
      );
    } catch (e) {
      setRows([]);
      setMeta('—');
      setStatus(e && e.message ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [catalogue, pageIndex, pageSize, searchQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const sync = useCallback(async () => {
    setLoading(true);
    setStatus('');
    try {
      await ensureSessionForApi();
      const res = await apiFetch('/api/masterdata/sync', {
        method: 'POST',
        body: JSON.stringify({ catalogue }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(json.error || `Sync failed (${res.status}).`);
        return;
      }
      let ins;
      let upd;
      if (json.result && typeof json.result === 'object') {
        if (catalogue === 'all' && json.result.crop) {
          ins =
            (json.result.crop.insertedCount || 0) +
            (json.result.loc?.insertedCount || 0) +
            (json.result.livestock?.insertedCount || 0);
          upd =
            (json.result.crop.updatedCount || 0) +
            (json.result.loc?.updatedCount || 0) +
            (json.result.livestock?.updatedCount || 0);
        } else {
          ins = json.result.insertedCount;
          upd = json.result.updatedCount;
        }
      }
      const livestockSeed =
        catalogue === 'livestock_catalogue'
          ? json.result?.seedFallback
          : catalogue === 'all'
            ? json.result?.livestock?.seedFallback
            : false;
      const livestockNote = livestockSeed
        ? ' Livestock: used built-in species seed (MOA CKAN had no usable JSON within limits). '
        : '';
      setStatus(
        json.success
          ? `Sync completed.${livestockNote} ${ins != null ? `Inserted: ${ins}. ` : ''}${upd != null ? `Updated: ${upd}. ` : ''}(Upstream rows are merged; local-only keys are preserved.)`
          : 'Sync response received.'
      );
      await load();
      if (json.success) setSyncSuccessOpen(true);
    } catch (e) {
      setStatus(e && e.message ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [catalogue, load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(catalogue), source_record_key: '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({ ...rowToForm(catalogue, row), source_record_key: row.source_record_key || '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const saveRecord = async () => {
    setStatus('');
    let payload;
    try {
      payload = buildPayload(catalogue, form, Boolean(editingId));
    } catch (e) {
      setStatus(e.message || 'Invalid form');
      return;
    }
    setLoading(true);
    try {
      await ensureSessionForApi();
      if (editingId) {
        const res = await apiFetch(`/api/masterdata/${catalogue}/records/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Update failed');
      } else {
        const res = await apiFetch(`/api/masterdata/${catalogue}/records`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Create failed');
      }
      closeModal();
      await load();
    } catch (e) {
      setStatus(e && e.message ? e.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (row) => {
    if (!window.confirm('Delete this row from the master catalogue? Sync may re-import it from the upstream source if it still exists there.')) {
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await ensureSessionForApi();
      const res = await apiFetch(`/api/masterdata/${catalogue}/records/${row._id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      await load();
    } catch (e) {
      setStatus(e && e.message ? e.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const cellValue = (row, key) => {
    const v = row[key];
    if (v == null) return '—';
    if (typeof v === 'object') return JSON.stringify(v).slice(0, 80) + (JSON.stringify(v).length > 80 ? '…' : '');
    return String(v);
  };

  const infoContent = DATA_SOURCE_INFO[catalogue];
  const apiDocContent = PUBLIC_API_DOC[catalogue];
  const apiBase = getApiBase().replace(/\/$/, '');
  const publicRecordsUrl = `${apiBase}/api/public/catalogues/${catalogue}/records`;
  const curlExample = `curl -sS "${publicRecordsUrl}?limit=50&offset=0"`;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;

  return (
    <>
      <nav className="breadcrumb">
        <Link to={overviewPath}>Home</Link>
        <span className="breadcrumb-sep">›</span>
        {breadcrumbParent.to ? (
          <Link to={breadcrumbParent.to}>{breadcrumbParent.label}</Link>
        ) : (
          <span>{breadcrumbParent.label}</span>
        )}
        <span className="breadcrumb-sep">›</span>
        <span>{title}</span>
      </nav>

      <div className="master-page-title-row">
        <h1 className="page-title">{title}</h1>
        <div className="master-page-title-actions">
          <button
            type="button"
            className="master-source-info-btn"
            aria-label="Data source information"
            title="Where this data comes from"
            onClick={() => setInfoModalOpen(true)}
          >
            <Info size={22} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="master-source-info-btn"
            aria-label="Public API documentation"
            title="Public API URL and documentation"
            onClick={() => setApiDocModalOpen(true)}
          >
            <Link2 size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{description}</p>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
        Authoritative sync source: <strong>{sourceLabel}</strong>. Sync merges upstream rows into this database (insert/update by upstream key); rows that are not returned by the API are kept as-is.
      </p>

      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 12 }}>
        <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={sync}>
          Sync from source
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={load}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={openCreate}>
          Add local row
        </button>
      </div>

      <div className="master-toolbar-filters">
        <div className="master-search-field">
          <label htmlFor={`master-search-${catalogue}`}>Search table</label>
          <input
            id={`master-search-${catalogue}`}
            type="search"
            className="master-search-input"
            placeholder="Filter by any column text…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="master-page-size">
          <label htmlFor={`master-page-size-${catalogue}`}>Rows per page</label>
          <select
            id={`master-page-size-${catalogue}`}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPageIndex(0);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p style={{ margin: '8px 0 16px', color: 'var(--text-muted)', minHeight: '1.25rem' }}>{status}</p>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              {displayKeys.map((k) => (
                <th key={k}>{k}</th>
              ))}
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={displayKeys.length + 1} style={{ color: 'var(--text-muted)' }}>
                  No rows. Run sync or add a local row (admin JWT required).
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id}>
                  {displayKeys.map((k) => (
                    <td key={k}>{cellValue(row, k)}</td>
                  ))}
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => openEdit(row)}>
                      Edit
                    </button>{' '}
                    <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => deleteRow(row)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="master-pagination-bar">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{meta}</span>
          <div className="master-pagination-controls">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading || !canPrev}
              onClick={() => setPageIndex(0)}
            >
              First
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading || !canPrev}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 4px' }}>
              Page {total === 0 ? 0 : pageIndex + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading || !canNext}
              onClick={() => setPageIndex((p) => p + 1)}
            >
              Next
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading || !canNext}
              onClick={() => setPageIndex(totalPages - 1)}
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {infoModalOpen && infoContent ? (
        <div className="master-modal-backdrop" role="presentation" onClick={() => setInfoModalOpen(false)}>
          <div
            className="master-modal master-modal--source-info"
            role="dialog"
            aria-modal="true"
            aria-labelledby="master-source-info-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h2 id="master-source-info-title" className="page-title" style={{ fontSize: '1.2rem', marginBottom: 0 }}>
                {infoContent.title}
              </h2>
              <button
                type="button"
                className="master-source-info-btn"
                aria-label="Close"
                onClick={() => setInfoModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="master-source-info-body" style={{ marginTop: 16 }}>
              {infoContent.sections.map((section) => (
                <section key={section.heading}>
                  <h3>{section.heading}</h3>
                  <p>{section.body}</p>
                  {section.list && section.list.length > 0 ? (
                    <ul>
                      {section.list.map((item) => (
                        <li key={item}>
                          <code style={{ fontSize: '0.85em' }}>{item}</code>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setInfoModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {apiDocModalOpen && apiDocContent ? (
        <div className="master-modal-backdrop" role="presentation" onClick={() => setApiDocModalOpen(false)}>
          <div
            className="master-modal master-modal--api-doc"
            role="dialog"
            aria-modal="true"
            aria-labelledby="master-api-doc-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h2 id="master-api-doc-title" className="page-title" style={{ fontSize: '1.15rem', marginBottom: 0 }}>
                {apiDocContent.title}
              </h2>
              <button
                type="button"
                className="master-source-info-btn"
                aria-label="Close"
                onClick={() => setApiDocModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ marginTop: 14, marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
              {apiDocContent.intro}
            </p>
            <h3 className="master-api-doc-subheading">Endpoint</h3>
            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <code className="master-api-doc-inline">GET</code> — no <code className="master-api-doc-inline">Authorization</code>{' '}
              header required.
            </p>
            <pre className="master-api-doc-code">{publicRecordsUrl}</pre>
            <h3 className="master-api-doc-subheading">Query parameters</h3>
            <ul className="master-api-doc-list">
              <li>
                <code>limit</code> — page size, default <code>50</code>, maximum <code>100</code> (public API).
              </li>
              <li>
                <code>offset</code> — pagination offset, default <code>0</code>.
              </li>
              <li>
                <code>q</code> — optional search string (case-insensitive, matches main text fields and attributes).
              </li>
            </ul>
            <h3 className="master-api-doc-subheading">Response</h3>
            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              JSON object with <code>success</code>, <code>catalogue</code>, <code>count</code>, <code>total</code>,{' '}
              <code>data</code> (array of rows), <code>limit</code>, <code>offset</code>, and <code>q</code> (echo of applied
              search).
            </p>
            <h3 className="master-api-doc-subheading">Example (cURL)</h3>
            <pre className="master-api-doc-code">{curlExample}</pre>
            <h3 className="master-api-doc-subheading">Repository documentation</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Full specification (errors, field notes, JavaScript examples):{' '}
              <code className="master-api-doc-inline">docs/OpenAPI/{apiDocContent.docFile}</code>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setApiDocModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {syncSuccessOpen ? (
        <div className="master-modal-backdrop" role="presentation" onClick={() => setSyncSuccessOpen(false)}>
          <div
            className="master-modal master-modal--sync-success"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sync-success-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <CheckCircle2 size={28} className="master-sync-success-icon" aria-hidden />
              <h2 id="sync-success-title" className="page-title" style={{ fontSize: '1.15rem', margin: 0, lineHeight: 1.3 }}>
                Sync has completed successfully.
              </h2>
            </div>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              The table has been refreshed with the latest data.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setSyncSuccessOpen(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="master-modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="master-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="master-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="master-modal-title" className="page-title" style={{ fontSize: '1.25rem', marginBottom: 16 }}>
              {editingId ? 'Edit row' : 'New row'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!editingId ? (
                <label className="master-form-label">
                  Source record key (optional; default auto)
                  <input
                    className="filter-select"
                    style={{ width: '100%', marginTop: 6 }}
                    value={form.source_record_key || ''}
                    onChange={(e) => setForm((f) => ({ ...f, source_record_key: e.target.value }))}
                    placeholder="Leave blank to auto-generate"
                  />
                </label>
              ) : null}
              {catalogue === 'crop_catalogue' ? (
                <>
                  <label className="master-form-label">
                    Variety name
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.variety_name}
                      onChange={(e) => setForm((f) => ({ ...f, variety_name: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Crop name
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.crop_name}
                      onChange={(e) => setForm((f) => ({ ...f, crop_name: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Producer
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.producer_name}
                      onChange={(e) => setForm((f) => ({ ...f, producer_name: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Notes
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.seed_supply_notes}
                      onChange={(e) => setForm((f) => ({ ...f, seed_supply_notes: e.target.value }))}
                    />
                  </label>
                </>
              ) : catalogue === 'location_catalogue' ? (
                <>
                  <label className="master-form-label">
                    Level
                    <select
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.level}
                      onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    >
                      <option value="region">region</option>
                      <option value="zone">zone</option>
                      <option value="woreda">woreda</option>
                    </select>
                  </label>
                  <label className="master-form-label">
                    P-code
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.p_code}
                      onChange={(e) => setForm((f) => ({ ...f, p_code: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Name
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Parent P-code
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.parent_p_code}
                      onChange={(e) => setForm((f) => ({ ...f, parent_p_code: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Geometry (GeoJSON)
                    <textarea
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6, minHeight: 100, fontFamily: 'monospace' }}
                      value={form.geometryText}
                      onChange={(e) => setForm((f) => ({ ...f, geometryText: e.target.value }))}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="master-form-label">
                    Common name
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.species_common_name}
                      onChange={(e) => setForm((f) => ({ ...f, species_common_name: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Scientific name
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.species_scientific_name}
                      onChange={(e) => setForm((f) => ({ ...f, species_scientific_name: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Production program
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.production_program}
                      onChange={(e) => setForm((f) => ({ ...f, production_program: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Animal health program
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.animal_health_program}
                      onChange={(e) => setForm((f) => ({ ...f, animal_health_program: e.target.value }))}
                    />
                  </label>
                  <label className="master-form-label">
                    Commercialization program
                    <input
                      className="filter-select"
                      style={{ width: '100%', marginTop: 6 }}
                      value={form.commercialization_program}
                      onChange={(e) => setForm((f) => ({ ...f, commercialization_program: e.target.value }))}
                    />
                  </label>
                </>
              )}
              <label className="master-form-label">
                Attributes (JSON object)
                <textarea
                  className="filter-select"
                  style={{ width: '100%', marginTop: 6, minHeight: 100, fontFamily: 'monospace' }}
                  value={form.attributesText}
                  onChange={(e) => setForm((f) => ({ ...f, attributesText: e.target.value }))}
                />
              </label>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled={loading} onClick={saveRecord}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
