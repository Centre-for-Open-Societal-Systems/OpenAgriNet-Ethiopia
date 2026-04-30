import React, { useEffect, useMemo, useState } from 'react';
import { X, ShieldCheck, FileText, Download, AlertTriangle } from 'lucide-react';
import {
  allowedNextStatuses,
  statusRequiresReason,
  validateFaydaFormat,
  findFarmerWithFaydaId,
} from './farmerRegistryModel';

export function StatusUpdateModal({ farmer, onClose, onSubmit }) {
  const options = useMemo(() => {
    const cur = farmer.registryStatus || farmer.status;
    const next = allowedNextStatuses(cur);
    return next.length ? next : [cur];
  }, [farmer]);
  const [to, setTo] = useState(options[0] || '');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const from = farmer.registryStatus || farmer.status;

  useEffect(() => {
    setTo(options[0] || '');
    setReason('');
    setNotes('');
  }, [farmer.id, farmer.registryStatus, farmer.status, options]);

  const needsReason = statusRequiresReason(from, to);

  const submit = () => {
    if (needsReason && !reason.trim()) return;
    onSubmit({ to, reason: reason.trim(), notes: notes.trim() });
  };

  return (
    <div className="registry-modal-overlay" onClick={onClose}>
      <div className="registry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="registry-modal-header">
          <h3>Update status</h3>
          <button type="button" className="registry-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="registry-modal-body">
          <p className="registry-muted">
            Current: <strong>{from}</strong> → Farmer <strong>{farmer.id}</strong>
          </p>
          <label className="registry-field-label">New status</label>
          <select className="registry-input" value={to} onChange={(e) => setTo(e.target.value)}>
            {options.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="registry-field-label">Reason / justification {needsReason ? '(required)' : '(optional)'}</label>
          <textarea className="registry-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <label className="registry-field-label">Supporting notes (optional)</label>
          <textarea className="registry-textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="registry-modal-footer">
          <button type="button" className="registry-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="registry-btn primary" onClick={submit} disabled={needsReason && !reason.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function FaydaVerifyModal({ farmer, allFarmers, onClose, onComplete }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const id = (farmer.faydaId || farmer.nationalId || '').trim();
  const format = validateFaydaFormat(id);

  const run = () => {
    if (!format.ok) {
      setResult({ ok: false, text: format.message });
      return;
    }
    if (!id) {
      setResult({ ok: false, text: 'Enter a Fayda / national ID on the profile before verifying.' });
      return;
    }
    setBusy(true);
    setResult(null);
    setTimeout(() => {
      const conflict = findFarmerWithFaydaId(allFarmers, id, farmer.id);
      setBusy(false);
      if (conflict) {
        setResult({
          ok: false,
          text: `ID already registered to farmer ${conflict.id} (${conflict.name}).`,
          queued: true,
        });
      } else {
        setResult({ ok: true, text: 'ID is unique in the integrated registry (mock check). Marking as verified.' });
      }
    }, 900);
  };

  const apply = () => {
    if (!result?.ok) return;
    const currentReg = farmer.registryStatus || farmer.status;
    const shouldPromoteRegistry = ['Pending Validation', 'Pending', 'Draft'].includes(currentReg);
    const nextRegistry = shouldPromoteRegistry ? 'Verified' : currentReg;
    onComplete(
      {
        verificationStatus: 'Verified',
        verificationDate: new Date().toISOString(),
        verifiedBy: 'current-user',
        registryStatus: nextRegistry,
        status: nextRegistry,
      },
      farmer.id
    );
  };

  return (
    <div className="registry-modal-overlay" onClick={onClose}>
      <div className="registry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="registry-modal-header">
          <h3>
            <ShieldCheck size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Fayda verification (mock)
          </h3>
          <button type="button" className="registry-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="registry-modal-body">
          <p className="registry-muted">
            No live Fayda API — we only confirm the ID is <strong>not</strong> already used by another farmer in the
            database we will integrate with.
          </p>
          <p>
            <strong>Farmer:</strong> {farmer.id} — <strong>ID:</strong> {id || '—'}
          </p>
          {!format.ok && <p className="registry-error-text">{format.message}</p>}
          {result && (
            <p className={result.ok ? 'registry-success-text' : 'registry-error-text'}>
              {result.text}
              {result.queued && (
                <span className="registry-muted"> (Illustrative: could queue for retry when the real service is wired.)</span>
              )}
            </p>
          )}
        </div>
        <div className="registry-modal-footer">
          <button type="button" className="registry-btn secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="registry-btn secondary" onClick={run} disabled={busy}>
            {busy ? 'Checking…' : 'Run registry check'}
          </button>
          <button type="button" className="registry-btn primary" onClick={apply} disabled={!result?.ok}>
            Apply verified state
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuditLogModal({ farmer, onClose, onExport }) {
  const [typeFilter, setTypeFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const logs = farmer.auditLog || [];
  const types = useMemo(() => [...new Set(logs.map((l) => l.type))], [logs]);

  const filtered = logs.filter((l) => {
    if (typeFilter && l.type !== typeFilter) return false;
    const t = new Date(l.ts).getTime();
    if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
    if (to && t > new Date(to).setHours(23, 59, 59, 999)) return false;
    return true;
  });

  return (
    <div className="registry-modal-overlay" onClick={onClose}>
      <div className="registry-modal registry-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="registry-modal-header">
          <h3>
            <FileText size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Audit log — {farmer.id}
          </h3>
          <button type="button" className="registry-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="registry-modal-body">
          <div className="registry-audit-filters">
            <select className="registry-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All event types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input type="date" className="registry-input" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="registry-input" value={to} onChange={(e) => setTo(e.target.value)} />
            <button type="button" className="registry-btn secondary" onClick={() => onExport('csv', filtered)}>
              <Download size={16} /> CSV
            </button>
            <button type="button" className="registry-btn secondary" onClick={() => onExport('json', filtered)}>
              <Download size={16} /> JSON
            </button>
          </div>
          <div className="registry-audit-list">
            {filtered.length === 0 && <p className="registry-muted">No entries match filters.</p>}
            {filtered.map((l) => (
              <div key={l.id} className="registry-audit-row">
                <div className="registry-audit-meta">
                  <span className="registry-audit-ts">{new Date(l.ts).toLocaleString()}</span>
                  <span className="registry-audit-type">{l.type}</span>
                </div>
                <div className="registry-audit-msg">{l.message}</div>
                <div className="registry-audit-sub">
                  {l.userId} ({l.role}) · IP {l.ip}
                </div>
                {(l.before || l.after) && (
                  <pre className="registry-audit-json">
                    {JSON.stringify({ before: l.before, after: l.after }, null, 0)}
                  </pre>
                )}
              </div>
            ))}
          </div>
          <p className="registry-muted registry-audit-immutable">Audit entries are read-only (immutable).</p>
        </div>
        <div className="registry-modal-footer">
          <button type="button" className="registry-btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function SoftDeleteModal({ farmer, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <div className="registry-modal-overlay" onClick={onClose}>
      <div className="registry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="registry-modal-header">
          <h3>
            <AlertTriangle size={20} color="#b45309" style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Delete farmer (soft delete)
          </h3>
          <button type="button" className="registry-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="registry-modal-body">
          <p>
            This will <strong>soft-delete</strong> {farmer.id} — {farmer.name}. Audit history and links are preserved.
          </p>
          <label className="registry-field-label">Reason (required)</label>
          <textarea className="registry-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="registry-modal-footer">
          <button type="button" className="registry-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="registry-btn danger" onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim()}>
            Confirm delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function SelectAllPagesModal({ count, onClose, onConfirm }) {
  return (
    <div className="registry-modal-overlay" onClick={onClose}>
      <div className="registry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="registry-modal-header">
          <h3>Select all matching farmers</h3>
          <button type="button" className="registry-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="registry-modal-body">
          <p>
            Select all <strong>{count}</strong> farmers that match the current filters (across all pages)? Large bulk
            operations should show a confirmation — this dialog illustrates that requirement.
          </p>
        </div>
        <div className="registry-modal-footer">
          <button type="button" className="registry-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="registry-btn primary" onClick={onConfirm}>
            Select all {count}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulkActionModal({ action, selectedCount, onClose, onSubmit }) {
  const [status, setStatus] = useState('Active');
  const [region, setRegion] = useState('');
  const [woreda, setWoreda] = useState('');
  const [reason, setReason] = useState('');

  const submit = () => {
    if (action === 'assign' && !region.trim()) return;
    if (action === 'delete' && !reason.trim()) return;
    onSubmit({
      action,
      status,
      region,
      woreda,
      reason: reason.trim(),
    });
  };

  return (
    <div className="registry-modal-overlay" onClick={onClose}>
      <div className="registry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="registry-modal-header">
          <h3>Bulk: {action}</h3>
          <button type="button" className="registry-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="registry-modal-body">
          <p className="registry-muted">
            {selectedCount} record(s) selected. Results summary will be shown after the operation.
          </p>
          {action === 'status' && (
            <>
              <label className="registry-field-label">Set registry status to</label>
              <select className="registry-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {['Active', 'Inactive', 'Pending', 'Verified', 'Flagged Conflict'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </>
          )}
          {action === 'assign' && (
            <>
              <label className="registry-field-label">Region</label>
              <input className="registry-input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Oromia" />
              <label className="registry-field-label">Woreda</label>
              <input className="registry-input" value={woreda} onChange={(e) => setWoreda(e.target.value)} placeholder="e.g. Woreda 3" />
            </>
          )}
          {action === 'assign' && (
            <>
              <label className="registry-field-label">Notes (optional)</label>
              <textarea className="registry-textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </>
          )}
          {action === 'verify' && (
            <>
              <label className="registry-field-label">Notes (optional)</label>
              <textarea className="registry-textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </>
          )}
          {action === 'delete' && (
            <>
              <label className="registry-field-label">Deletion reason (required)</label>
              <textarea className="registry-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </>
          )}
        </div>
        <div className="registry-modal-footer">
          <button type="button" className="registry-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="registry-btn primary" onClick={submit}>
            Run bulk {action}
          </button>
        </div>
      </div>
    </div>
  );
}
