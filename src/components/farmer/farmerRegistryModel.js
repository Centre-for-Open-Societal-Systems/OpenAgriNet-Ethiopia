/** Farmer Registry domain helpers (UI + local mock “database”). */

export const REGISTRY_STATUSES = [
  'Draft',
  'Pending Validation',
  'Verified',
  'Active',
  'Inactive',
  'Pending',
  'Rejected',
  'Flagged Conflict',
  'Suspended',
  'Merged',
];

export const STATUS_ORDER = {
  Draft: 0,
  'Pending Validation': 1,
  Pending: 2,
  Rejected: 3,
  Verified: 4,
  Active: 5,
  Inactive: 6,
  'Flagged Conflict': 7,
  Suspended: 8,
  Merged: 9,
};

/** Simplified transition map for UI (full SRS has more edges). */
export const ALLOWED_STATUS_TRANSITIONS = {
  Draft: ['Pending Validation', 'Merged'],
  'Pending Validation': ['Verified', 'Rejected', 'Flagged Conflict', 'Merged'],
  Pending: ['Verified', 'Rejected', 'Flagged Conflict', 'Active', 'Merged'],
  Rejected: ['Pending Validation', 'Draft', 'Merged'],
  Verified: ['Active', 'Inactive', 'Flagged Conflict', 'Suspended', 'Merged'],
  Active: ['Inactive', 'Flagged Conflict', 'Suspended', 'Merged'],
  Inactive: ['Active', 'Suspended', 'Merged'],
  'Flagged Conflict': ['Verified', 'Active', 'Merged'],
  Suspended: ['Active', 'Inactive', 'Merged'],
  Merged: [],
};

export function allowedNextStatuses(current) {
  return ALLOWED_STATUS_TRANSITIONS[current] || REGISTRY_STATUSES.filter((s) => s !== current);
}

export function statusRequiresReason(from, to) {
  if (from === to) return false;
  return ['Flagged Conflict', 'Suspended', 'Merged', 'Rejected', 'Inactive'].includes(to);
}

export function statusCssClass(status) {
  const s = String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '-');
  return `registry-status-${s}`;
}

export function validateFaydaFormat(value) {
  if (!value || !String(value).trim()) return { ok: true, message: '' };
  const v = String(value).trim();
  // Illustrative: alphanumeric, min length (Fayda / national id style)
  if (v.length < 5) return { ok: false, message: 'ID must be at least 5 characters.' };
  if (!/^[A-Za-z0-9\-]+$/.test(v)) return { ok: false, message: 'Use letters, numbers, and hyphens only.' };
  return { ok: true, message: '' };
}

/** “Database” check: another farmer already holds this Fayda ID (excluding current). */
export function findFarmerWithFaydaId(farmers, faydaId, excludeFarmerId) {
  if (!faydaId || !String(faydaId).trim()) return null;
  const norm = String(faydaId).trim().toLowerCase();
  return farmers.find(
    (f) =>
      f.id !== excludeFarmerId &&
      !f.deleted &&
      String(f.faydaId || f.nationalId || '')
        .trim()
        .toLowerCase() === norm
  );
}

export function maskFaydaId(id, privileged) {
  if (!id) return '—';
  if (privileged) return id;
  const s = String(id);
  if (s.length <= 4) return '****';
  return `${s.slice(0, 2)}****${s.slice(-2)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createAuditEntry({
  type,
  farmerId,
  userId = 'current-user',
  role = 'Registry Officer',
  message,
  before = null,
  after = null,
  justification = '',
}) {
  return {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: nowIso(),
    type,
    farmerId,
    userId,
    role,
    message,
    before,
    after,
    justification,
    ip: '192.0.2.1',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '—',
    sessionId: 'sess-mock',
  };
}

export function seedAuditForFarmer(farmer) {
  const id = farmer.id;
  return [
    createAuditEntry({
      type: 'Profile Created',
      farmerId: id,
      message: 'Profile created in OpenAgriNet registry.',
      after: { id },
    }),
    createAuditEntry({
      type: 'Profile Updated',
      farmerId: id,
      message: 'Location fields reviewed.',
      before: { region: '—' },
      after: { region: farmer.region },
    }),
  ];
}

/** Normalize legacy / generated row to full registry shape. */
export function normalizeFarmer(f, index = 0) {
  const nameEn = f.fullNameLatin || f.name || 'Unknown';
  const nameLocal = f.fullNameAmharic || f.fullNameLocal || '';
  const registryStatus =
    f.registryStatus ||
    (f.status === 'Verified'
      ? 'Verified'
      : f.status === 'Pending'
        ? 'Pending'
        : f.status === 'Rejected'
          ? 'Rejected'
          : 'Active');
  const ageYears =
    typeof f.ageYears === 'number'
      ? f.ageYears
      : parseInt(String(f.age || '').replace(/\D/g, ''), 10) || 30 + (index % 35);
  const dob = f.dob || f.dateOfBirth || '';
  return {
    ...f,
    name: nameEn,
    fullNameLatin: f.fullNameLatin || nameEn,
    fullNameAmharic: nameLocal || f.fullNameAmharic,
    fullNameLocal: nameLocal,
    registryStatus,
    status: registryStatus,
    ageYears,
    age: f.age || (dob ? `${new Date().getFullYear() - new Date(dob).getFullYear()} Yrs` : `${ageYears} Yrs`),
    dob: dob || '',
    faydaId: f.faydaId || f.nationalId || '',
    nationalId: f.nationalId || f.faydaId || '',
    livelihood: f.livelihood || f.primaryActivity || f.primaryLivelihood || 'Mixed',
    verificationStatus:
      f.verificationStatus != null && String(f.verificationStatus).trim() !== ''
        ? f.verificationStatus
        : f.faydaId
          ? 'Verified'
          : 'Unverified',
    verificationDate: f.verificationDate != null && f.verificationDate !== '' ? f.verificationDate : '',
    verifiedBy: f.verifiedBy != null && f.verifiedBy !== '' ? f.verifiedBy : '',
    sourceSystem: f.sourceSystem || 'OAN Manual',
    sourceId: f.sourceId || '',
    createdBy: f.createdBy || 'system-seed',
    createdAt: f.createdAt || f.registeredDate || nowIso(),
    lastUpdatedBy: f.lastUpdatedBy || 'system-seed',
    lastUpdatedAt: f.lastUpdatedAt || nowIso(),
    statusHistory: f.statusHistory || [
      { at: f.registeredDate || nowIso(), from: 'Draft', to: registryStatus, reason: 'Initial load', by: 'system-seed' },
    ],
    auditLog: Array.isArray(f.auditLog) && f.auditLog.length ? f.auditLog : seedAuditForFarmer({ ...f, id: f.id, region: f.region }),
    deleted: Boolean(f.deleted),
    deletedAt: f.deletedAt || null,
    deletedBy: f.deletedBy || null,
    deleteReason: f.deleteReason || null,
    notes: f.notes || '',
    registrationDateField: f.registrationDateField || f.registeredDate,
    householdSize: f.householdSize || 6,
    village: f.village || '',
    livestockCount: f.livestockCount ?? 6,
    landParcelsCount: f.landParcelsCount ?? 2,
    benefitsCount: f.benefitsCount ?? 1,
    kisanCard: f.kisanCard || 'Active',
    crops: f.crops || [],
  };
}

export function migrateFarmers(list) {
  if (!Array.isArray(list)) return [];
  return list.map((f, i) => normalizeFarmer(f, i));
}

export function duplicateFarmerWarning(farmers, { fullNameLatin, fullNameAmharic, kebele, ageYears }, excludeId) {
  const name = (fullNameLatin || fullNameAmharic || '').trim().toLowerCase();
  const keb = (kebele || '').trim().toLowerCase();
  if (!name || !keb) return null;
  const match = farmers.find((f) => {
    if (f.id === excludeId || f.deleted) return false;
    const fn = (f.fullNameLatin || f.name || '').trim().toLowerCase();
    const age = f.ageYears || parseInt(String(f.age || '').replace(/\D/g, ''), 10);
    return fn === name && (f.kebele || '').trim().toLowerCase() === keb && Math.abs(age - ageYears) <= 1;
  });
  return match || null;
}

export function distinctWoredas(farmers) {
  const s = new Set();
  farmers.forEach((f) => {
    if (!f.deleted && f.woreda) s.add(f.woreda);
  });
  return [...s].sort();
}
