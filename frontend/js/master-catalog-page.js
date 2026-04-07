/**
 * Static HTML shell for one master catalogue (Crop / Livestock / Location).
 * Expects <body data-catalogue="crop_catalogue" data-page-title="Crop Master" data-source-label="...">
 */
(function () {
  var body = document.body;
  var catalogue = body.getAttribute('data-catalogue');
  var pageTitle = body.getAttribute('data-page-title') || 'Master';
  var sourceLabel = body.getAttribute('data-source-label') || '';

  var DISPLAY_KEYS = {
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

  var apiBase = window.OAN_API_BASE || 'http://localhost:5001';
  // React (Vite) stores JWT in oan-app-jwt; static Keycloak shell uses oan-token.
  var token = localStorage.getItem('oan-app-jwt') || localStorage.getItem('oan-token') || '';

  var btnSync = document.getElementById('btn-sync');
  var btnLoad = document.getElementById('btn-load');
  var btnAdd = document.getElementById('btn-add');
  var statusEl = document.getElementById('catalog-status');
  var metaEl = document.getElementById('catalog-meta');
  var modal = document.getElementById('master-modal');
  var modalTitle = document.getElementById('modal-title');
  var formEl = document.getElementById('master-form');
  var editingIdInput = document.getElementById('editing-id');

  if (!catalogue || !modal || !formEl || !editingIdInput || !modalTitle) {
    return;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function authHeaders() {
    var h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  function setStatus(msg) {
    statusEl.textContent = msg || '';
  }

  var columns = DISPLAY_KEYS[catalogue] || [];

  function renderTable(rows) {
    var thead = document.getElementById('catalog-table-head');
    var tbody = document.getElementById('catalog-table-body');
    thead.innerHTML = '';
    tbody.innerHTML = '';
    metaEl.textContent = '—';

    if (!rows || !rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="' +
        (columns.length + 1) +
        '" style="color:var(--text-secondary)">No rows</td></tr>';
      return;
    }

    var trHead = document.createElement('tr');
    columns.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c;
      trHead.appendChild(th);
    });
    var thAct = document.createElement('th');
    thAct.textContent = 'Actions';
    trHead.appendChild(thAct);
    thead.appendChild(trHead);

    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      columns.forEach(function (c) {
        var v = r[c];
        if (v && typeof v === 'object') v = JSON.stringify(v).slice(0, 80);
        if (v === null || v === undefined) v = '—';
        var td = document.createElement('td');
        td.innerHTML = escapeHtml(String(v));
        tr.appendChild(td);
      });
      var tdAct = document.createElement('td');
      tdAct.innerHTML =
        '<button type="button" class="btn btn-secondary btn-sm mc-edit" data-id="' +
        escapeHtml(r._id) +
        '">Edit</button> <button type="button" class="btn btn-secondary btn-sm mc-del" data-id="' +
        escapeHtml(r._id) +
        '">Delete</button>';
      tr.appendChild(tdAct);
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.mc-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEdit(rows.find(function (x) {
          return String(x._id) === btn.getAttribute('data-id');
        }));
      });
    });
    tbody.querySelectorAll('.mc-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        delRow(btn.getAttribute('data-id'));
      });
    });
  }

  async function loadCatalogue() {
    setStatus('Loading...');
    try {
      var res = await fetch(apiBase + '/api/masterdata/' + catalogue + '/records?limit=200&offset=0', {
        method: 'GET',
        headers: authHeaders(),
      });
      var json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Unable to load');
      }
      renderTable(json.data || []);
      metaEl.textContent =
        'Showing ' + (json.data || []).length + ' of ' + (json.total != null ? json.total : (json.data || []).length) + ' row(s)';
      setStatus('');
    } catch (e) {
      setStatus('Error: ' + (e && e.message ? e.message : String(e)));
    }
  }

  async function syncNow() {
    setStatus('Syncing...');
    try {
      var res = await fetch(apiBase + '/api/masterdata/sync', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ catalogue: catalogue }),
      });
      var json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Sync failed');
      }
      setStatus('Sync completed.');
      await loadCatalogue();
    } catch (e) {
      setStatus('Error: ' + (e && e.message ? e.message : String(e)));
    }
  }

  function showModal(edit) {
    modalTitle.textContent = edit ? 'Edit row' : 'New row';
    formEl.reset();
    editingIdInput.value = edit ? edit._id : '';
    if (catalogue === 'crop_catalogue') {
      var v = document.getElementById('f-variety');
      if (v) v.value = edit ? edit.variety_name || '' : '';
      var c = document.getElementById('f-crop');
      if (c) c.value = edit ? edit.crop_name || '' : '';
      var p = document.getElementById('f-producer');
      if (p) p.value = edit ? edit.producer_name || '' : '';
      var n = document.getElementById('f-notes');
      if (n) n.value = edit ? edit.seed_supply_notes || '' : '';
    } else if (catalogue === 'location_catalogue') {
      var lv = document.getElementById('f-level');
      if (lv) lv.value = edit ? edit.level || 'woreda' : 'woreda';
      var pc = document.getElementById('f-pcode');
      if (pc) pc.value = edit ? edit.p_code || '' : '';
      var nm = document.getElementById('f-name');
      if (nm) nm.value = edit ? edit.name || '' : '';
      var par = document.getElementById('f-parent');
      if (par) par.value = edit ? edit.parent_p_code || '' : '';
      var gm = document.getElementById('f-geom');
      if (gm) {
        gm.value = edit && edit.geometry_geojson ? JSON.stringify(edit.geometry_geojson, null, 2) : '';
      }
    } else {
      var co = document.getElementById('f-common');
      if (co) co.value = edit ? edit.species_common_name || '' : '';
      var sc = document.getElementById('f-sci');
      if (sc) sc.value = edit ? edit.species_scientific_name || '' : '';
      var pr = document.getElementById('f-prod');
      if (pr) pr.value = edit ? edit.production_program || '' : '';
      var hl = document.getElementById('f-health');
      if (hl) hl.value = edit ? edit.animal_health_program || '' : '';
      var cm = document.getElementById('f-comm');
      if (cm) cm.value = edit ? edit.commercialization_program || '' : '';
    }
    var at = document.getElementById('f-attrs');
    if (at) {
      at.value = edit
      ? JSON.stringify((edit.attributes && typeof edit.attributes === 'object' ? edit.attributes : {}), null, 2)
      : '{}';
    }
    var sk = document.getElementById('f-srckey');
    if (sk) sk.value = '';
    var skw = document.getElementById('f-srckey-wrap');
    if (skw) skw.style.display = edit ? 'none' : 'block';
    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  function buildPayload(edit) {
    var attrsEl = document.getElementById('f-attrs');
    var attrsText = (attrsEl && attrsEl.value.trim()) || '';
    var attributes = attrsText ? JSON.parse(attrsText) : {};
    if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
      throw new Error('Attributes must be a JSON object');
    }
    var body;
    if (catalogue === 'crop_catalogue') {
      body = {
        variety_name: (document.getElementById('f-variety') || {}).value || null,
        crop_name: (document.getElementById('f-crop') || {}).value || null,
        producer_name: (document.getElementById('f-producer') || {}).value || null,
        seed_supply_notes: (document.getElementById('f-notes') || {}).value || null,
        attributes: attributes,
      };
    } else if (catalogue === 'location_catalogue') {
      var gtxt = ((document.getElementById('f-geom') || {}).value || '').trim();
      var geometry_geojson = null;
      if (gtxt) geometry_geojson = JSON.parse(gtxt);
      body = {
        level: (document.getElementById('f-level') || {}).value || 'woreda',
        p_code: (document.getElementById('f-pcode') || {}).value || null,
        name: (document.getElementById('f-name') || {}).value || null,
        parent_p_code: (document.getElementById('f-parent') || {}).value || null,
        geometry_geojson: geometry_geojson,
        attributes: attributes,
      };
    } else {
      body = {
        species_common_name: (document.getElementById('f-common') || {}).value || null,
        species_scientific_name: (document.getElementById('f-sci') || {}).value || null,
        production_program: (document.getElementById('f-prod') || {}).value || null,
        animal_health_program: (document.getElementById('f-health') || {}).value || null,
        commercialization_program: (document.getElementById('f-comm') || {}).value || null,
        attributes: attributes,
      };
    }
    if (!edit) {
      var sk = ((document.getElementById('f-srckey') || {}).value || '').trim();
      if (sk) body.source_record_key = sk;
    }
    return body;
  }

  async function saveForm() {
    var edit = editingIdInput.value;
    var payload;
    try {
      payload = buildPayload(edit);
    } catch (e) {
      setStatus(e.message || 'Invalid form');
      return;
    }
    try {
      var url =
        apiBase + '/api/masterdata/' + catalogue + '/records' + (edit ? '/' + encodeURIComponent(edit) : '');
      var res = await fetch(url, {
        method: edit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      var json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Save failed');
      }
      closeModal();
      await loadCatalogue();
    } catch (e) {
      setStatus('Error: ' + (e && e.message ? e.message : String(e)));
    }
  }

  async function delRow(id) {
    if (!confirm('Delete this row?')) return;
    try {
      var res = await fetch(apiBase + '/api/masterdata/' + catalogue + '/records/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      var json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Delete failed');
      }
      await loadCatalogue();
    } catch (e) {
      setStatus('Error: ' + (e && e.message ? e.message : String(e)));
    }
  }

  function openEdit(row) {
    showModal(row);
  }

  if (!token) {
    if (btnSync) btnSync.disabled = true;
    if (btnLoad) btnLoad.disabled = true;
    if (btnAdd) btnAdd.disabled = true;
    setStatus('Login required (admin/super) for master data API.');
    return;
  }

  if (btnLoad) btnLoad.addEventListener('click', loadCatalogue);
  if (btnSync) btnSync.addEventListener('click', syncNow);
  if (btnAdd) btnAdd.addEventListener('click', function () { showModal(null); });
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveForm);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  loadCatalogue();
})();
