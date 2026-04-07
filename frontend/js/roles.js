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
    'catalogs', 'master-crop', 'master-location', 'master-livestock',
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

  // Master Data: Crop / Livestock / Location master pages (admin/super). Upgrade legacy "Catalogs" link.
  (function ensureMasterDataNavItems() {
    var navUl = document.querySelector('.sidebar-nav ul');
    if (!navUl) return;
    if (document.querySelector('.sidebar-nav a[href="master-crop.html"]')) return;

    var insertBeforeRef = null;
    var oldCatalogs = document.querySelector('.sidebar-nav a[href="catalogs.html"]');
    if (oldCatalogs && oldCatalogs.closest) {
      var oldLi = oldCatalogs.closest('li');
      if (oldLi && oldLi.parentNode) {
        insertBeforeRef = oldLi.nextSibling;
        oldLi.parentNode.removeChild(oldLi);
      }
    }
    var insertAfterLi = null;
    if (!insertBeforeRef) {
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
    }

    var subIcon = '<span class="nav-icon" style="opacity:0.85"><svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg></span>';

    var labelLi = document.createElement('li');
    labelLi.setAttribute('data-roles', 'admin super');
    labelLi.innerHTML =
      '<span style="display:block;padding:10px 20px 4px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--text-muted,#64748b);">Master Data</span>';

    function subLink(href, text) {
      var li = document.createElement('li');
      li.setAttribute('data-roles', 'admin super');
      li.innerHTML =
        '<a href="' +
        href +
        '" style="padding-left:2.5rem;font-size:0.9rem">' +
        subIcon +
        text +
        '</a>';
      return li;
    }

    var frag = document.createDocumentFragment();
    frag.appendChild(labelLi);
    frag.appendChild(subLink('master-crop.html', 'Crop Master'));
    frag.appendChild(subLink('master-livestock.html', 'Livestock Master'));
    frag.appendChild(subLink('master-location.html', 'Location Master'));

    if (insertBeforeRef && insertBeforeRef.parentNode === navUl) {
      navUl.insertBefore(frag, insertBeforeRef);
    } else if (insertAfterLi && insertAfterLi.parentNode === navUl && insertAfterLi.after) {
      insertAfterLi.after(frag);
    } else {
      navUl.appendChild(frag);
    }
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

  /* Logout
   * Always go to index.html (same directory, absolute URL). Do NOT use logout.html as the only
   * target: many dev servers / SPA fallbacks serve dashboard.html for unknown paths, so /logout.html
   * can look like "nothing happened". index.html is the real login shell; keycloak-login.js ends SSO.
   */
  var logoutEl = document.getElementById('sidebar-logout');
  if (logoutEl) {
    logoutEl.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem(STORAGE_ROLE);
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem('oan-token');
      localStorage.removeItem('oan-app-jwt');
      localStorage.removeItem('oan-email');
      localStorage.removeItem('oan-mobile');
      sessionStorage.removeItem('oan-intended-role');
      sessionStorage.setItem('oan-want-fresh-login', '1');
      sessionStorage.setItem('oan-app-logged-out', '1');
      var loginUrl = new URL('index.html', window.location.href);
      loginUrl.searchParams.set('oan_logout', '1');
      window.location.replace(loginUrl.href);
    });
  }

  /* Expose for action filtering (e.g. hide "New Farmer" for farmer role) */
  window.OAN_ROLE = role;
  window.OAN_USER = user;
})();
