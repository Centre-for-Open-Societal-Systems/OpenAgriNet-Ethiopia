(function () {
  var stored = localStorage.getItem('oan-theme') || 'dark';
  var resolved = stored === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : stored;
  document.documentElement.setAttribute('data-theme', resolved);
})();
