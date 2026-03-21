/**
 * OpenAgriNet role-based UI
 * Roles: farmer | bank | admin | super
 * - Redirect to login if no role (app pages only)
 * - Filter sidebar nav by data-roles
 * - Role switcher and logout
 */
(function () {
  var STORAGE_ROLE = 'oan-role';
  var STORAGE_USER = 'oan-user';
  var APP_PAGES = ['dashboard', 'farmer-registry', 'land-registry', 'livestock-registry', 'crop-registry',
    'soil-registry', 'seed-registry', 'finance-portal', 'data-integration-hub', 'administration',
    'catalogs',
    'reports', 'settings', 'farmer-registration', 'livestock-registration', 'livestock-dashboard',
    'crop-registration', 'finance-loan-applications', 'finance-partner-banks', 'customize-bank-names'];

  var VALID_ROLES = ['farmer', 'bank', 'admin', 'super'];

  function getRole() {
    var r = (localStorage.getItem(STORAGE_ROLE) || '').trim().toLowerCase();
    if (VALID_ROLES.indexOf(r) === -1) return '';
    return r;
  }

  function setRole(role) {
    localStorage.setItem(STORAGE_ROLE, role);
  }

  function isAppPage() {
    var path = window.location.pathname || '';
    var name = path.split('/').pop() || path;
    name = name.replace('.html', '');
    return APP_PAGES.indexOf(name) !== -1 || name === '';
  }

  function isLoginPage() {
    var path = window.location.pathname || '';
    return path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('index.html');
  }

  /* Redirect to login if on app page and not logged in */
  if (isAppPage() && !isLoginPage()) {
    if (!getRole()) {
      window.location.replace('index.html');
      return;
    }
  }

  var role = getRole();
  var user = localStorage.getItem(STORAGE_USER) || 'User';

  // Ensure "Catalogs" exists in every sidebar (admin/super only).
  (function ensureCatalogsNavItem() {
    var existing = document.querySelector('.sidebar-nav a[href="catalogs.html"]');
    if (existing) return;

    var navUl = document.querySelector('.sidebar-nav ul');
    if (!navUl) return;

    var insertAfterLi = null;
    var di = document.querySelector('.sidebar-nav a[href="data-integration-hub.html"]');
    if (di && di.closest) insertAfterLi = di.closest('li');
    if (!insertAfterLi) {
      var fp = document.querySelector('.sidebar-nav a[href="finance-partner-banks.html"]');
      if (fp && fp.closest) insertAfterLi = fp.closest('li');
    }
    if (!insertAfterLi) {
      var fp2 = document.querySelector('.sidebar-nav a[href="finance-portal.html"]');
      if (fp2 && fp2.closest) insertAfterLi = fp2.closest('li');
    }

    var li = document.createElement('li');
    li.setAttribute('data-roles', 'admin super');
    li.innerHTML =
      '<a href="catalogs.html"><span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg></span>Catalogs<span class="nav-chevron"><svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg></span></a>';

    if (insertAfterLi && insertAfterLi.after) insertAfterLi.after(li);
    else navUl.appendChild(li);
  })();

  /* Filter sidebar: show only items whose data-roles includes current role */
  document.querySelectorAll('.sidebar-nav li[data-roles]').forEach(function (li) {
    var roles = (li.getAttribute('data-roles') || '').trim().split(/\s+/);
    if (roles.indexOf(role) !== -1) {
      li.style.display = '';
    } else {
      li.style.display = 'none';
    }
  });

  /* Role switcher dropdown */
  var switcher = document.getElementById('role-switcher');
  if (switcher) {
    switcher.value = role;
    switcher.addEventListener('change', function () {
      setRole(this.value);
      window.location.reload();
    });
  }

  /* User label */
  var userEl = document.getElementById('sidebar-user');
  if (userEl) {
    userEl.textContent = user + ' · ' + (role === 'farmer' ? 'Farmer' : role === 'bank' ? 'Bank User' : role === 'admin' ? 'Admin User' : 'Super User');
  }

  /* Logout */
  var logoutEl = document.getElementById('sidebar-logout');
  if (logoutEl) {
    logoutEl.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem(STORAGE_ROLE);
      localStorage.removeItem(STORAGE_USER);
      window.location.href = 'index.html';
    });
  }

  /* Expose for action filtering (e.g. hide "New Farmer" for farmer role) */
  window.OAN_ROLE = role;
  window.OAN_USER = user;
})();
