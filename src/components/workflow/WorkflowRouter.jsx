import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import RegistryWorkflowShell from './RegistryWorkflowShell';
import CatalogsView from './CatalogsView';
import {
  SAMPLE_FARMERS,
  SAMPLE_LIVESTOCK,
  SAMPLE_CROPS,
  SAMPLE_LAND,
  SAMPLE_SOIL,
  SAMPLE_SEED,
  SAMPLE_LOANS,
  SAMPLE_PARTNER_BANKS_DISPLAY,
  SAMPLE_INTEGRATIONS,
  SAMPLE_REPAYMENTS,
  SAMPLE_RISK,
  badgeClass,
  formatStatus,
} from './sampleRegistryData';

const SEARCH_SVG = (
  <span className="search-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  </span>
);

function Tabs({ pathname, tab, items }) {
  return (
    <div className="tabs">
      {items.map(({ id, label }) => (
        <Link key={id} to={{ pathname, search: `?tab=${id}` }} className={tab === id ? 'active' : ''}>
          {label}
        </Link>
      ))}
    </div>
  );
}

function Breadcrumb({ overviewPath, items }) {
  return (
    <nav className="breadcrumb">
      <Link to={overviewPath}>Home</Link>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          <span className="breadcrumb-sep">›</span>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

function LoanApplicationsTable({ showCheckboxes }) {
  return (
    <>
      <div className="toolbar">
        <div className="search-wrap">
          {SEARCH_SVG}
          <input
            type="search"
            className="search-input"
            placeholder="Search by Application ID, farmer name, or bank"
            aria-label="Search applications"
          />
        </div>
        <select className="filter-select" aria-label="Status" defaultValue="">
          <option value="">All statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Disbursed</option>
        </select>
        <select className="filter-select" aria-label="Bank" defaultValue="">
          <option value="">All banks</option>
          <option>Commercial Bank of Ethiopia</option>
          <option>Abay Bank</option>
          <option>Bank of Abyssinia</option>
        </select>
        <button type="button" className="btn btn-primary">
          New application
        </button>
        <button type="button" className="btn btn-secondary btn-sm">
          Export
        </button>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              {showCheckboxes ? (
                <th className="col-check">
                  <input type="checkbox" aria-label="Select all" />
                </th>
              ) : null}
              <th>Application ID</th>
              <th>Applicant</th>
              <th>Farmer ID</th>
              <th>Bank</th>
              <th>Amount (ETB)</th>
              <th>Product</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_LOANS.map((r) => (
              <tr key={r.appId}>
                {showCheckboxes ? (
                  <td>
                    <input type="checkbox" aria-label="Select row" />
                  </td>
                ) : null}
                <td>{r.appId}</td>
                <td>{r.applicant}</td>
                <td>{r.farmerId}</td>
                <td>{r.bank}</td>
                <td>{r.amount}</td>
                <td>{r.product}</td>
                <td>
                  <span className={`badge ${badgeClass(r.status)}`}>{formatStatus(r.status)}</span>
                </td>
                <td>{r.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FinancePortalBody({ portalRole, pathname, tab, overviewPath }) {
  const canCustomize = portalRole === 'Bank User' || portalRole === 'Admin' || portalRole === 'Super User';
  const tabs = useMemo(() => {
    const base = [
      { id: 'summary', label: 'Dashboard' },
      { id: 'applications', label: 'Loan Applications' },
      { id: 'partner-banks', label: 'Partner Banks' },
    ];
    if (canCustomize) base.push({ id: 'customize-banks', label: 'Customize Bank Names' });
    return base;
  }, [canCustomize]);

  const effective = tab && tabs.some((x) => x.id === tab) ? tab : 'summary';

  if (effective === 'applications') {
    return (
      <>
        <Breadcrumb
          overviewPath={overviewPath}
          items={[{ to: `${pathname}?tab=summary`, label: 'Finance Portal' }, { label: 'Loan Applications' }]}
        />
        <h1 className="page-title">Loan Applications</h1>
        <Tabs pathname={pathname} tab={effective} items={tabs} />
        <div className="tabs" style={{ marginBottom: 16 }}>
          <span className="active" style={{ cursor: 'default' }}>
            All applications
          </span>
          <span style={{ color: 'var(--text-muted)', cursor: 'default' }}>Pending</span>
          <span style={{ color: 'var(--text-muted)', cursor: 'default' }}>Approved</span>
          <span style={{ color: 'var(--text-muted)', cursor: 'default' }}>Disbursed</span>
        </div>
        <LoanApplicationsTable showCheckboxes />
      </>
    );
  }

  if (effective === 'partner-banks') {
    return (
      <>
        <Breadcrumb
          overviewPath={overviewPath}
          items={[{ to: `${pathname}?tab=summary`, label: 'Finance Portal' }, { label: 'Partner Banks' }]}
        />
        <h1 className="page-title">Partner Banks</h1>
        <Tabs pathname={pathname} tab={effective} items={tabs} />
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Banks participating in the Agricultural Finance Portal. Manage display names in{' '}
          <Link to={`${pathname}?tab=customize-banks`}>Customize Bank Names</Link>.
        </p>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Display Name</th>
                <th>Status</th>
                <th>Loan products</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_PARTNER_BANKS_DISPLAY.map((b) => (
                <tr key={b.code}>
                  <td>{b.code}</td>
                  <td>{b.name}</td>
                  <td>
                    <span className={`badge ${badgeClass(b.status)}`}>Active</span>
                  </td>
                  <td>{b.products}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (effective === 'customize-banks' && canCustomize) {
    return <CustomizeBanksView pathname={pathname} overviewPath={overviewPath} tabs={tabs} />;
  }

  return (
    <>
      <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Finance Portal' }]} />
      <h1 className="page-title">Finance Tracking</h1>
      <Tabs pathname={pathname} tab={effective} items={tabs} />
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Track loan applications, manage partner banks, and view finance analytics. Use the tabs to navigate.
      </p>
      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Loan Applications (Pending)</h3>
          <p className="value accent">12</p>
        </div>
        <div className="stat-card">
          <h3>Approved This Month</h3>
          <p className="value">8</p>
        </div>
        <div className="stat-card">
          <h3>Partner Banks</h3>
          <p className="value">3</p>
        </div>
        <div className="stat-card">
          <h3>Disbursements (YTD)</h3>
          <p className="value">2.4M ETB</p>
        </div>
      </div>
      <div className="table-card" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: '1.125rem', margin: '0 0 16px 0' }}>Recent loan applications</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Farmer / Applicant</th>
              <th>Bank</th>
              <th>Amount (ETB)</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_LOANS.slice(0, 3).map((r) => (
              <tr key={r.appId}>
                <td>{r.appId}</td>
                <td>{r.applicant}</td>
                <td>{r.bank}</td>
                <td>{r.amount}</td>
                <td>
                  <span className={`badge ${badgeClass(r.status)}`}>{formatStatus(r.status)}</span>
                </td>
                <td>{r.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Showing 1–3 (sample data)</span>
          <div className="pagination-buttons">
            <button type="button" disabled>
              Previous
            </button>
            <Link to={`${pathname}?tab=applications`} className="btn btn-secondary btn-sm">
              View all
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function CustomizeBanksView({ pathname, overviewPath, tabs }) {
  const [rows, setRows] = useState(() =>
    SAMPLE_PARTNER_BANKS_DISPLAY.map((r) => ({ ...r, editName: r.name }))
  );
  return (
    <>
      <Breadcrumb
        overviewPath={overviewPath}
        items={[{ to: `${pathname}?tab=summary`, label: 'Finance Portal' }, { label: 'Customize Bank Names' }]}
      />
      <h1 className="page-title">Customize Bank Names</h1>
      <Tabs pathname={pathname} tab="customize-banks" items={tabs} />
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Adjust how bank names appear in loan workflows. Changes are local to this demo session.
      </p>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Display name</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b, i) => (
              <tr key={b.code}>
                <td>{b.code}</td>
                <td>
                  <input
                    type="text"
                    className="search-input"
                    style={{ maxWidth: 320 }}
                    value={b.editName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRows((prev) => prev.map((x, j) => (j === i ? { ...x, editName: v } : x)));
                    }}
                    aria-label={`Display name for ${b.code}`}
                  />
                </td>
                <td>
                  <button type="button" className="btn btn-secondary btn-sm">
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function pickBody({ portalRole, section, pathname, tab, overviewPath }) {
  const t = tab || '';

  if (section === 'farmer-registry') {
    const effective = t === 'register' ? 'register' : 'list';
    const farmerTabs = [
      { id: 'list', label: 'Farmer List' },
      { id: 'register', label: 'New Registration' },
    ];
    if (effective === 'list') {
      return (
        <>
          <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Farmer Registry' }]} />
          <h1 className="page-title">Farmer Registry</h1>
          <Tabs pathname={pathname} tab={effective} items={farmerTabs} />
          <div className="toolbar">
              <div className="search-wrap">
                {SEARCH_SVG}
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search by Farmer ID or Full Name"
                  aria-label="Search farmers"
                />
              </div>
              <select className="filter-select" aria-label="Filter by region" defaultValue="">
                <option value="">All Regions</option>
                <option>Addis Ababa</option>
                <option>Oromia</option>
                <option>Amhara</option>
                <option>Tigray</option>
              </select>
              <select className="filter-select" aria-label="Filter by woreda" defaultValue="">
                <option value="">All Woredas</option>
              </select>
              <select className="filter-select" aria-label="Filter by status" defaultValue="">
                <option value="">All Statuses</option>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
                <option>Verified</option>
                <option>Flagged Conflict</option>
              </select>
              <button type="button" className="btn btn-secondary btn-sm">
                Export
              </button>
              <Link to={`${pathname}?tab=register`} className="btn btn-primary">
                New Farmer
              </Link>
            </div>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-check">
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th>Farmer ID</th>
                    <th>Full Name (EN)</th>
                    <th>Kebele</th>
                    <th>Woreda</th>
                    <th>Region</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_FARMERS.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <input type="checkbox" aria-label="Select row" />
                      </td>
                      <td>{f.id}</td>
                      <td>{f.name}</td>
                      <td>{f.kebele}</td>
                      <td>{f.woreda}</td>
                      <td>{f.region}</td>
                      <td>{f.gender}</td>
                      <td>{f.age}</td>
                      <td>{f.regDate}</td>
                      <td>
                        <span className={`badge ${badgeClass(f.status)}`}>{formatStatus(f.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </>
      );
    }
    return (
      <>
        <Breadcrumb
          overviewPath={overviewPath}
          items={[{ to: `${pathname}?tab=list`, label: 'Farmer Registry' }, { label: 'New Registration' }]}
        />
        <h1 className="page-title">New Farmer Registration</h1>
        <Tabs pathname={pathname} tab={effective} items={farmerTabs} />
        <div className="form-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  window.alert('Demo: registration would be submitted to the API.');
                }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="full_name_en">Full Name (English) *</label>
                    <input id="full_name_en" name="full_name_en" required placeholder="e.g. Abebe Kebede" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="full_name_local">Full Name (Local)</label>
                    <input id="full_name_local" name="full_name_local" placeholder="Optional" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select id="gender" name="gender" required defaultValue="">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="region">Region *</label>
                    <select id="region" name="region" required defaultValue="">
                      <option value="">Select region</option>
                      <option>Oromia</option>
                      <option>Amhara</option>
                      <option>Tigray</option>
                      <option>SNNPR</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="woreda">Woreda *</label>
                    <input id="woreda" name="woreda" required placeholder="Woreda" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="kebele">Kebele *</label>
                    <input id="kebele" name="kebele" required placeholder="Kebele" />
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary">
                    Submit registration
                  </button>
                  <Link to={`${pathname}?tab=list`} className="btn btn-secondary" style={{ marginLeft: 8 }}>
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
      </>
    );
  }

  if (section === 'livestock-registry') {
    const effective = t === 'register' ? 'register' : t === 'dashboard' ? 'dashboard' : 'list';
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Livestock Registry' }]} />
        <h1 className="page-title">Livestock Registry</h1>
        <Tabs
          pathname={pathname}
          tab={effective}
          items={[
            { id: 'list', label: 'Inventory List' },
            { id: 'register', label: 'New Registration' },
            { id: 'dashboard', label: 'Herd/Flock Dashboard' },
          ]}
        />
        {effective === 'dashboard' ? (
          <div className="dashboard-grid">
            <div className="stat-card">
              <h3>Total tagged</h3>
              <p className="value accent">4</p>
            </div>
            <div className="stat-card">
              <h3>Healthy</h3>
              <p className="value">3</p>
            </div>
            <div className="stat-card">
              <h3>Vaccination overdue</h3>
              <p className="value">1</p>
            </div>
            <div className="stat-card">
              <h3>Quarantine</h3>
              <p className="value">1</p>
            </div>
          </div>
        ) : effective === 'register' ? (
          <div className="form-card">
            <h2 style={{ fontSize: '1.125rem', marginBottom: 16 }}>Register animal</h2>
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                window.alert('Demo: animal registration captured.');
              }}
            >
              <div className="form-group">
                <label htmlFor="species">Species *</label>
                <select id="species" required defaultValue="">
                  <option value="">Select</option>
                  <option>Cattle</option>
                  <option>Goat</option>
                  <option>Sheep</option>
                  <option>Poultry</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="breed">Breed</label>
                <input id="breed" placeholder="e.g. Borana" />
              </div>
              <div className="form-group">
                <label htmlFor="owner">Owner name *</label>
                <input id="owner" required placeholder="Linked farmer" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <Link to={`${pathname}?tab=list`} className="btn btn-secondary" style={{ marginLeft: 8 }}>
                  Back to list
                </Link>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <div className="search-wrap">
                {SEARCH_SVG}
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search by Tag ID, Owner Name, or Animal ID"
                  aria-label="Search livestock"
                />
              </div>
              <select className="filter-select" defaultValue="">
                <option value="">All Species</option>
                <option>Cattle</option>
                <option>Goat</option>
                <option>Sheep</option>
                <option>Poultry</option>
              </select>
              <select className="filter-select" defaultValue="">
                <option value="">All Health</option>
                <option>Healthy</option>
                <option>Sick</option>
                <option>Quarantined</option>
              </select>
              <button type="button" className="btn btn-secondary btn-sm">
                Export
              </button>
              <Link to={`${pathname}?tab=register`} className="btn btn-primary">
                Register Animal
              </Link>
            </div>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-check">
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th>Tag ID</th>
                    <th>Species</th>
                    <th>Breed</th>
                    <th>Owner</th>
                    <th>Woreda</th>
                    <th>Health Status</th>
                    <th>Vaccination Status</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_LIVESTOCK.map((r) => (
                    <tr key={r.tag}>
                      <td>
                        <input type="checkbox" aria-label="Select row" />
                      </td>
                      <td>{r.tag}</td>
                      <td>{r.species}</td>
                      <td>{r.breed}</td>
                      <td>{r.owner}</td>
                      <td>{r.woreda}</td>
                      <td>
                        <span className={`badge ${badgeClass(r.health)}`}>{formatStatus(r.health)}</span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass(r.vacc)}`}>
                          {r.vacc === 'up' ? 'Up-to-date' : r.vacc === 'overdue' ? 'Overdue' : 'None'}
                        </span>
                      </td>
                      <td>{r.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    );
  }

  if (section === 'crop-registry') {
    const effective = t === 'register' ? 'register' : 'list';
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Crop Registry' }]} />
        <h1 className="page-title">Crop Registry</h1>
        <Tabs
          pathname={pathname}
          tab={effective}
          items={[
            { id: 'list', label: 'Production List' },
            { id: 'register', label: 'New Registration' },
          ]}
        />
        {effective === 'register' ? (
          <div className="form-card">
            <h2 style={{ fontSize: '1.125rem', marginBottom: 16 }}>New production record</h2>
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                window.alert('Demo: production record saved.');
              }}
            >
              <div className="form-group">
                <label htmlFor="plot">Plot ID *</label>
                <input id="plot" required placeholder="PL-…" />
              </div>
              <div className="form-group">
                <label htmlFor="farmerId">Farmer ID *</label>
                <input id="farmerId" required placeholder="OAN-FR-…" />
              </div>
              <div className="form-group">
                <label htmlFor="crop">Crop type *</label>
                <input id="crop" required placeholder="Teff, Maize…" />
              </div>
              <div className="form-group">
                <label htmlFor="season">Season / year *</label>
                <input id="season" required placeholder="2024 Meher" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn btn-primary">
                  Save record
                </button>
                <Link to={`${pathname}?tab=list`} className="btn btn-secondary" style={{ marginLeft: 8 }}>
                  Back
                </Link>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="toolbar">
              <div className="search-wrap">
                {SEARCH_SVG}
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search by Plot ID, Farmer ID, or Crop"
                  aria-label="Search crop production"
                />
              </div>
              <select className="filter-select" aria-label="Season/Year" defaultValue="">
                <option value="">All Seasons</option>
                <option>2024 Meher</option>
                <option>2024 Belg</option>
                <option>2023 Meher</option>
              </select>
              <select className="filter-select" aria-label="Region" defaultValue="">
                <option value="">All Regions</option>
              </select>
              <button type="button" className="btn btn-secondary btn-sm">
                Export
              </button>
              <Link to={`${pathname}?tab=register`} className="btn btn-primary">
                New Production Record
              </Link>
            </div>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="col-check">
                      <input type="checkbox" aria-label="Select all" />
                    </th>
                    <th>Plot ID</th>
                    <th>Farmer ID</th>
                    <th>Crop Type</th>
                    <th>Season / Year</th>
                    <th>Area (ha)</th>
                    <th>Harvest Status</th>
                    <th>Yield (est.)</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_CROPS.map((r) => (
                    <tr key={r.plot}>
                      <td>
                        <input type="checkbox" aria-label="Select row" />
                      </td>
                      <td>{r.plot}</td>
                      <td>{r.farmerId}</td>
                      <td>{r.crop}</td>
                      <td>{r.season}</td>
                      <td>{r.area}</td>
                      <td>{r.harvest}</td>
                      <td>{r.yield}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    );
  }

  if (section === 'land-registry') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Land Registry' }]} />
        <h1 className="page-title">Land Registry</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Verified land parcels linked to farmers and crop production. Data can be pulled from DOVAR and other sources.
        </p>
        <div className="toolbar">
          <div className="search-wrap">
            {SEARCH_SVG}
            <input
              type="search"
              className="search-input"
              placeholder="Search by Parcel ID or Farmer ID"
              aria-label="Search parcels"
            />
          </div>
          <select className="filter-select" defaultValue="">
            <option value="">All Regions</option>
            <option>Oromia</option>
            <option>Amhara</option>
            <option>Tigray</option>
            <option>SNNPR</option>
          </select>
          <select className="filter-select" defaultValue="">
            <option value="">All land use</option>
            <option>Irrigated</option>
            <option>Rain-fed</option>
          </select>
          <button type="button" className="btn btn-secondary btn-sm">
            Export
          </button>
        </div>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parcel ID</th>
                <th>Farmer ID</th>
                <th>Region</th>
                <th>Woreda</th>
                <th>Kebele</th>
                <th>Area (ha)</th>
                <th>Land use</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_LAND.map((r) => (
                <tr key={r.parcel}>
                  <td>{r.parcel}</td>
                  <td>{r.farmerId}</td>
                  <td>{r.region}</td>
                  <td>{r.woreda}</td>
                  <td>{r.kebele}</td>
                  <td>{r.area}</td>
                  <td>{r.use}</td>
                  <td>
                    <span className={`badge ${badgeClass(r.status)}`}>{formatStatus(r.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'soil-registry') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Soil Registry' }]} />
        <h1 className="page-title">Soil Registry</h1>
        <div className="toolbar">
          <div className="search-wrap">
            {SEARCH_SVG}
            <input type="search" className="search-input" placeholder="Search samples" aria-label="Search soil" />
          </div>
          <button type="button" className="btn btn-secondary btn-sm">
            Export
          </button>
        </div>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Plot</th>
                <th>Farmer ID</th>
                <th>pH</th>
                <th>Organic matter</th>
                <th>Tested</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_SOIL.map((r) => (
                <tr key={r.sample}>
                  <td>{r.sample}</td>
                  <td>{r.plot}</td>
                  <td>{r.farmerId}</td>
                  <td>{r.ph}</td>
                  <td>{r.organic}</td>
                  <td>{r.tested}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'seed-registry') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Seed Registry' }]} />
        <h1 className="page-title">Seed Registry</h1>
        <div className="toolbar">
          <div className="search-wrap">
            {SEARCH_SVG}
            <input type="search" className="search-input" placeholder="Search lots" aria-label="Search seed" />
          </div>
          <button type="button" className="btn btn-secondary btn-sm">
            Export
          </button>
        </div>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Variety</th>
                <th>Crop</th>
                <th>Source</th>
                <th>Quantity</th>
                <th>Woreda</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_SEED.map((r) => (
                <tr key={r.lot}>
                  <td>{r.lot}</td>
                  <td>{r.variety}</td>
                  <td>{r.crop}</td>
                  <td>{r.source}</td>
                  <td>{r.qty}</td>
                  <td>{r.woreda}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'finance-portal') {
    return <FinancePortalBody portalRole={portalRole} pathname={pathname} tab={t} overviewPath={overviewPath} />;
  }

  if (section === 'loan-applications') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Loan Applications' }]} />
        <h1 className="page-title">Loan Applications</h1>
        <LoanApplicationsTable showCheckboxes />
      </>
    );
  }

  if (section === 'borrower-directory') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Borrower Directory' }]} />
        <h1 className="page-title">Borrower Directory</h1>
        <div className="toolbar">
          <div className="search-wrap">
            {SEARCH_SVG}
            <input type="search" className="search-input" placeholder="Search by Farmer ID or name" aria-label="Search borrowers" />
          </div>
          <button type="button" className="btn btn-secondary btn-sm">
            Export
          </button>
        </div>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Farmer ID</th>
                <th>Name</th>
                <th>Region</th>
                <th>Woreda</th>
                <th>Status</th>
                <th>Linked loans</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_FARMERS.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>{f.name}</td>
                  <td>{f.region}</td>
                  <td>{f.woreda}</td>
                  <td>
                    <span className={`badge ${badgeClass(f.status)}`}>{formatStatus(f.status)}</span>
                  </td>
                  <td>{SAMPLE_LOANS.filter((l) => l.farmerId === f.id).length || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'risk-assessment') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Risk Assessment' }]} />
        <h1 className="page-title">Risk Assessment</h1>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Farmer ID</th>
                <th>Name</th>
                <th>Score</th>
                <th>Band</th>
                <th>Exposure (ETB)</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_RISK.map((r) => (
                <tr key={r.farmerId}>
                  <td>{r.farmerId}</td>
                  <td>{r.name}</td>
                  <td>{r.score}</td>
                  <td>{r.band}</td>
                  <td>{r.exposure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'repayment-reports') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Repayment Reports' }]} />
        <h1 className="page-title">Repayment Reports</h1>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Farmer</th>
                <th>Due date</th>
                <th>Due (ETB)</th>
                <th>Paid (ETB)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_REPAYMENTS.map((r) => (
                <tr key={r.loanId}>
                  <td>{r.loanId}</td>
                  <td>{r.farmer}</td>
                  <td>{r.due}</td>
                  <td>{r.amount}</td>
                  <td>{r.paid}</td>
                  <td>
                    <span className={`badge ${badgeClass(r.status)}`}>{formatStatus(r.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'financial-reports') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Financial Reports' }]} />
        <h1 className="page-title">Financial Reports</h1>
        <div className="dashboard-grid">
          <div className="stat-card">
            <h3>Disbursed (YTD)</h3>
            <p className="value accent">2.4M ETB</p>
          </div>
          <div className="stat-card">
            <h3>Portfolio at risk</h3>
            <p className="value">4.2%</p>
          </div>
          <div className="stat-card">
            <h3>Active borrowers</h3>
            <p className="value">128</p>
          </div>
        </div>
        <div className="table-card" style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: '1.125rem', margin: '0 0 16px 0' }}>Summary by product</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Accounts</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Seasonal loan</td>
                <td>54</td>
                <td>1.1M ETB</td>
              </tr>
              <tr>
                <td>Input finance</td>
                <td>41</td>
                <td>890K ETB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'bank-settings') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Settings' }]} />
        <h1 className="page-title">Bank workspace settings</h1>
        <div className="form-card">
          <div className="form-group">
            <label>
              <input type="checkbox" defaultChecked /> Email alerts for new applications
            </label>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" defaultChecked /> Daily digest
            </label>
          </div>
          <button type="button" className="btn btn-primary">
            Save preferences
          </button>
        </div>
      </>
    );
  }

  if (section === 'data-integration-hub') {
    return (
      <>
        <Breadcrumb overviewPath={overviewPath} items={[{ label: 'Data Integration Hub' }]} />
        <h1 className="page-title">Data Integration Hub</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          External system connections and sync status. Data is pulled from these systems into OpenAgriNet registries.
        </p>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>System</th>
                <th>Description</th>
                <th>Status</th>
                <th>Last sync</th>
                <th>Records (last run)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_INTEGRATIONS.map((r) => (
                <tr key={r.system}>
                  <td>{r.system}</td>
                  <td>{r.desc}</td>
                  <td>
                    <span className={`badge ${badgeClass(r.status)}`}>
                      {r.status === 'active' ? 'Connected' : 'Pending'}
                    </span>
                  </td>
                  <td>{r.last}</td>
                  <td>{r.records}</td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm">
                      Sync now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (section === 'catalogs') {
    if (portalRole !== 'Admin' && portalRole !== 'Super User') return null;
    return <CatalogsView overviewPath={overviewPath} />;
  }

  return null;
}

export function workflowHandlesSection(portalRole, section) {
  if (!portalRole || !section) return false;
  const adminOnly = new Set(['land-registry', 'soil-registry', 'seed-registry', 'catalogs']);
  if (adminOnly.has(section)) {
    return portalRole === 'Admin' || portalRole === 'Super User';
  }
  const bank = new Set([
    'loan-applications',
    'borrower-directory',
    'risk-assessment',
    'repayment-reports',
    'financial-reports',
    'bank-settings',
  ]);
  if (bank.has(section)) {
    return portalRole === 'Bank User';
  }
  const shared = new Set([
    'farmer-registry',
    'livestock-registry',
    'crop-registry',
    'finance-portal',
    'data-integration-hub',
  ]);
  if (shared.has(section)) {
    if (section === 'data-integration-hub') return portalRole === 'Super User';
    return ['Farmer', 'Admin', 'Super User'].includes(portalRole);
  }
  return false;
}

function sectionFromPathname(pathname) {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

/**
 * @param {object} props
 * @param {'Farmer'|'Bank User'|'Admin'|'Super User'} props.portalRole — workflow tier for this dashboard shell (hardcode per layout).
 * @param {string} [props.section] — from useParams; falls back to last URL segment if missing.
 */
export default function WorkflowRouter({ portalRole, section: sectionProp, theme, fallback, overviewPath = '/dashboard/overview' }) {
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get('tab') || '';
  const sectionRaw = (sectionProp != null && String(sectionProp).trim()) || sectionFromPathname(location.pathname);

  if (!workflowHandlesSection(portalRole, sectionRaw)) {
    return fallback;
  }

  const body = pickBody({
    portalRole,
    section: sectionRaw,
    pathname: location.pathname,
    tab,
    overviewPath,
  });

  if (!body) return fallback;

  return (
    <div className="content-area">
      <RegistryWorkflowShell theme={theme}>{body}</RegistryWorkflowShell>
    </div>
  );
}
