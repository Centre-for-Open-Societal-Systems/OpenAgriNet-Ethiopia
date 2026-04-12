/** Sample rows aligned with ART-2 static HTML workflows */

export const SAMPLE_FARMERS = [
  { id: 'OAN-FR-001', name: 'Abebe Kebede', kebele: 'Kebele 01', woreda: 'Bishoftu', region: 'Oromia', gender: 'Male', age: 42, regDate: '2024-01-15', status: 'verified' },
  { id: 'OAN-FR-002', name: 'Tigist Hailu', kebele: 'Kebele 03', woreda: 'Debre Berhan', region: 'Amhara', gender: 'Female', age: 35, regDate: '2024-02-20', status: 'active' },
  { id: 'OAN-FR-003', name: 'Dawit Mekonnen', kebele: 'Kebele 02', woreda: 'Hawassa', region: 'SNNPR', gender: 'Male', age: 28, regDate: '2024-03-10', status: 'pending' },
  { id: 'OAN-FR-004', name: 'Hanna Solomon', kebele: 'Kebele 05', woreda: 'Mekelle', region: 'Tigray', gender: 'Female', age: 51, regDate: '2023-11-08', status: 'flagged' },
  { id: 'OAN-FR-005', name: 'Getachew Alemu', kebele: 'Kebele 01', woreda: 'Bishoftu', region: 'Oromia', gender: 'Male', age: 39, regDate: '2024-01-22', status: 'inactive' },
];

export const SAMPLE_LIVESTOCK = [
  { tag: 'ET-2024-001', species: 'Cattle', breed: 'Borana', owner: 'Abebe Kebede', woreda: 'Bishoftu', health: 'healthy', vacc: 'up', age: '4 yrs' },
  { tag: 'ET-2024-002', species: 'Goat', breed: 'Boer', owner: 'Tigist Hailu', woreda: 'Debre Berhan', health: 'healthy', vacc: 'overdue', age: '2 yrs' },
  { tag: 'ET-2024-003', species: 'Sheep', breed: 'Afar', owner: 'Dawit Mekonnen', woreda: 'Hawassa', health: 'sick', vacc: 'none', age: '1 yr' },
  { tag: 'ET-2024-004', species: 'Poultry', breed: 'Local', owner: 'Hanna Solomon', woreda: 'Mekelle', health: 'quarantine', vacc: 'up', age: '6 mo' },
];

export const SAMPLE_CROPS = [
  { plot: 'PL-001', farmerId: 'OAN-FR-001', crop: 'Teff', season: '2024 Meher', area: '0.5', harvest: 'Planted', yield: '—' },
  { plot: 'PL-002', farmerId: 'OAN-FR-002', crop: 'Maize', season: '2024 Meher', area: '1.2', harvest: 'Harvested', yield: '3.2 t' },
  { plot: 'PL-003', farmerId: 'OAN-FR-003', crop: 'Wheat', season: '2024 Belg', area: '0.8', harvest: 'Harvested', yield: '2.1 t' },
  { plot: 'PL-004', farmerId: 'OAN-FR-004', crop: 'Teff', season: '2024 Meher', area: '1.0', harvest: 'Planted', yield: '—' },
];

export const SAMPLE_LAND = [
  { parcel: 'PRC-Oromia-001', farmerId: 'OAN-FR-001', region: 'Oromia', woreda: 'Bishoftu', kebele: 'Kebele 01', area: '1.70', use: 'Rain-fed', status: 'verified' },
  { parcel: 'PRC-Oromia-002', farmerId: 'OAN-FR-002', region: 'Oromia', woreda: 'Bishoftu', kebele: 'Kebele 03', area: '0.85', use: 'Irrigated', status: 'verified' },
  { parcel: 'PRC-Amhara-001', farmerId: 'OAN-FR-004', region: 'Amhara', woreda: 'Mekelle', kebele: 'Kebele 05', area: '2.10', use: 'Rain-fed', status: 'pending' },
];

export const SAMPLE_SOIL = [
  { sample: 'SR-2042', plot: 'PL-001', farmerId: 'OAN-FR-001', ph: '6.2', organic: 'Medium', tested: '2024-02-01', status: 'Complete' },
  { sample: 'SR-2043', plot: 'PL-002', farmerId: 'OAN-FR-002', ph: '7.1', organic: 'High', tested: '2024-02-15', status: 'Complete' },
];

export const SAMPLE_SEED = [
  { lot: 'SD-402', variety: 'Teff Quncho', crop: 'Teff', source: 'EIAR', qty: '120 kg', woreda: 'Bishoftu', status: 'Distributed' },
  { lot: 'SD-403', variety: 'BH-660', crop: 'Maize', source: 'MoA', qty: '80 kg', woreda: 'Debre Berhan', status: 'In stock' },
];

export const SAMPLE_LOANS = [
  { appId: 'AFP-2024-001', applicant: 'Abebe Kebede', farmerId: 'OAN-FR-001', bank: 'Commercial Bank of Ethiopia', amount: '50,000', product: 'Seasonal loan', status: 'pending', submitted: '2024-03-01' },
  { appId: 'AFP-2024-002', applicant: 'Tigist Hailu', farmerId: 'OAN-FR-002', bank: 'Abay Bank', amount: '75,000', product: 'Input finance', status: 'approved', submitted: '2024-02-28' },
  { appId: 'AFP-2024-003', applicant: 'Dawit Mekonnen', farmerId: 'OAN-FR-003', bank: 'Bank of Abyssinia', amount: '30,000', product: 'Seasonal loan', status: 'review', submitted: '2024-03-05' },
  { appId: 'AFP-2024-004', applicant: 'Hanna Solomon', farmerId: 'OAN-FR-004', bank: 'Commercial Bank of Ethiopia', amount: '45,000', product: 'Input finance', status: 'disbursed', submitted: '2024-01-20' },
];

export const SAMPLE_PARTNER_BANKS = [
  { code: 'CBE', name: 'Commercial Bank of Ethiopia', products: 'Seasonal, asset', active: 'Yes', updated: '2024-03-01' },
  { code: 'ABAY', name: 'Abay Bank', products: 'Input finance', active: 'Yes', updated: '2024-02-20' },
  { code: 'BOA', name: 'Bank of Abyssinia', products: 'Seasonal', active: 'Yes', updated: '2024-02-10' },
];

/** Partner banks list (finance-partner-banks.html) */
export const SAMPLE_PARTNER_BANKS_DISPLAY = [
  { code: 'CBEE', name: 'Commercial Bank of Ethiopia', status: 'active', products: 'Seasonal, Input finance' },
  { code: 'ABE', name: 'Abay Bank', status: 'active', products: 'Seasonal, Input finance' },
  { code: 'BOA', name: 'Bank of Abyssinia', status: 'active', products: 'Seasonal loan' },
  { code: 'AWASH', name: 'Awash Bank', status: 'active', products: '—' },
  { code: 'WEGAGEN', name: 'Wegagen Bank', status: 'active', products: '—' },
];

export const SAMPLE_INTEGRATIONS = [
  { system: 'DOVAR', desc: 'National land / parcel registry', status: 'active', last: 'Mar 9, 2024 06:00', records: '1,204' },
  { system: 'LITS', desc: 'Livestock identification & traceability', status: 'active', last: 'Mar 9, 2024 05:30', records: '3,892' },
  { system: 'ePhyto', desc: 'Digital plant health certification', status: 'active', last: 'Mar 8, 2024 22:15', records: '234' },
  { system: 'ECTMS', desc: 'Crop trade & movement', status: 'pending', last: '—', records: '—' },
];

export const SAMPLE_REPAYMENTS = [
  { loanId: 'LN-2023-882', farmer: 'Abebe Kebede', due: '2024-04-01', amount: '4,200', paid: '4,200', status: 'paid' },
  { loanId: 'LN-2023-901', farmer: 'Tigist Hailu', due: '2024-04-15', amount: '6,250', paid: '—', status: 'due' },
  { loanId: 'LN-2024-012', farmer: 'Dawit Mekonnen', due: '2024-05-01', amount: '2,500', paid: '1,000', status: 'partial' },
];

export const SAMPLE_RISK = [
  { farmerId: 'OAN-FR-001', name: 'Abebe Kebede', score: '72', band: 'Medium', exposure: '50,000' },
  { farmerId: 'OAN-FR-002', name: 'Tigist Hailu', score: '84', band: 'Low', exposure: '75,000' },
  { farmerId: 'OAN-FR-003', name: 'Dawit Mekonnen', score: '58', band: 'High', exposure: '30,000' },
];

export function badgeClass(status) {
  const m = {
    verified: 'badge-verified',
    active: 'badge-active',
    pending: 'badge-pending',
    flagged: 'badge-flagged',
    inactive: 'badge-inactive',
    healthy: 'badge-healthy',
    sick: 'badge-sick',
    quarantine: 'badge-quarantined',
    up: 'badge-vacc-up',
    overdue: 'badge-vacc-overdue',
    none: 'badge-vacc-none',
    approved: 'badge-active',
    review: 'badge-pending',
    disbursed: 'badge-verified',
    paid: 'badge-verified',
    due: 'badge-pending',
    partial: 'badge-flagged',
  };
  return m[status] || 'badge-pending';
}

export function formatStatus(s) {
  if (s === 'review') return 'Under review';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
