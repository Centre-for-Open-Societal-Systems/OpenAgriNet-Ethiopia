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
    'reports', 'settings', 'farmer-registration', 'livestock-registration', 'livestock-dashboard',
    'crop-registration', 'finance-loan-applications', 'finance-partner-banks', 'customize-bank-names'];

  function getRole() {
    return localStorage.getItem(STORAGE_ROLE) || '';
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
