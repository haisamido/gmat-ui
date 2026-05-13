/**
 * ReportFilePanel.js — Report file configuration panel
 *
 * C++ reference: src/gui/output/ReportFilePanel.cpp
 */

export function createReportFilePanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;

  // Available parameters (common ones)
  const scNames = store.getAllByType('Spacecraft').map(s => s.name);
  const available = [];
  for (const sc of scNames) {
    for (const param of [
      'UTCGregorian', 'TAIModJulian', 'ElapsedDays', 'ElapsedSecs',
      'EarthMJ2000Eq.X', 'EarthMJ2000Eq.Y', 'EarthMJ2000Eq.Z',
      'EarthMJ2000Eq.VX', 'EarthMJ2000Eq.VY', 'EarthMJ2000Eq.VZ',
      'SMA', 'ECC', 'INC', 'RAAN', 'AOP', 'TA',
      'Earth.Altitude', 'Earth.RMAG', 'RadPer', 'RadApo',
    ]) {
      available.push(sc + '.' + param);
    }
  }
  const selected = p.Add || [];

  el.innerHTML = `
    <div class="panel-section"><h3>File Settings</h3>
      <div class="form-grid">
        <label>Filename</label><input type="text" data-p="Filename" value="${p.Filename}" style="font-family:monospace;font-size:11px">
        <label>Delimiter</label>
        <select data-p="Delimiter">
          ${[' ',',','\\t'].map(v => `<option value="${v}"${v===p.Delimiter?' selected':''}>${v===' '?'Space':v===','?'Comma':'Tab'}</option>`).join('')}
        </select>
        <label>Column Width</label><input type="number" data-p="ColumnWidth" value="${p.ColumnWidth}">
        <label>Write Headers</label>
        <select data-p="WriteHeaders">
          <option value="true"${p.WriteHeaders?' selected':''}>true</option>
          <option value="false"${!p.WriteHeaders?' selected':''}>false</option>
        </select>
      </div>
    </div>
    <div class="panel-section"><h3>Parameters to Report</h3>
      <div class="dual-list">
        <div>
          <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Available</div>
          <div class="dual-list-box" id="rpt-avail">
            ${available.filter(a => !selected.includes(a)).map(a => `<div class="list-item" data-val="${a}">${a}</div>`).join('')}
          </div>
        </div>
        <div class="dual-list-btns">
          <button id="rpt-add">&rarr;</button>
          <button id="rpt-remove">&larr;</button>
        </div>
        <div>
          <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Selected</div>
          <div class="dual-list-box" id="rpt-selected">
            ${selected.map(s => `<div class="list-item" data-val="${s}">${s}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  // Dual list selection logic
  let availSel = null, selSel = null;
  el.querySelector('#rpt-avail').addEventListener('click', e => {
    const item = e.target.closest('.list-item');
    if (!item) return;
    el.querySelectorAll('#rpt-avail .list-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    availSel = item.dataset.val;
  });
  el.querySelector('#rpt-selected').addEventListener('click', e => {
    const item = e.target.closest('.list-item');
    if (!item) return;
    el.querySelectorAll('#rpt-selected .list-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
    selSel = item.dataset.val;
  });
  el.querySelector('#rpt-add').addEventListener('click', () => {
    if (!availSel) return;
    const cur = store.getObject(name).properties.Add || [];
    cur.push(availSel);
    store.setProperty(name, 'Add', cur);
    const item = el.querySelector(`#rpt-avail .list-item[data-val="${availSel}"]`);
    if (item) { item.remove(); el.querySelector('#rpt-selected').appendChild(item); item.classList.remove('selected'); }
    availSel = null;
  });
  el.querySelector('#rpt-remove').addEventListener('click', () => {
    if (!selSel) return;
    const cur = store.getObject(name).properties.Add || [];
    const idx = cur.indexOf(selSel);
    if (idx >= 0) cur.splice(idx, 1);
    store.setProperty(name, 'Add', cur);
    const item = el.querySelector(`#rpt-selected .list-item[data-val="${selSel}"]`);
    if (item) { item.remove(); el.querySelector('#rpt-avail').appendChild(item); item.classList.remove('selected'); }
    selSel = null;
  });

  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      let v = inp.value;
      if (inp.type === 'number') v = parseFloat(v);
      else if (v === 'true') v = true;
      else if (v === 'false') v = false;
      store.setProperty(name, inp.dataset.p, v);
    });
  });
  return el;
}
