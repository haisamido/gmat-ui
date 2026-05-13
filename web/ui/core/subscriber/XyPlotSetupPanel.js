/**
 * XyPlotSetupPanel.js — XY Plot configuration panel
 *
 * C++ reference: src/gui/subscriber/XyPlotSetupPanel.cpp
 */

export function createXYPlotPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const scNames = store.getAllByType('Spacecraft').map(s => s.name);
  const params = [];
  for (const sc of scNames) {
    for (const pr of ['ElapsedDays','ElapsedSecs','SMA','ECC','INC','RAAN','AOP','TA','Earth.Altitude','Earth.RMAG',
      'EarthMJ2000Eq.X','EarthMJ2000Eq.Y','EarthMJ2000Eq.Z','EarthMJ2000Eq.VX','EarthMJ2000Eq.VY','EarthMJ2000Eq.VZ']) {
      params.push(sc + '.' + pr);
    }
  }
  el.innerHTML = `
    <div class="panel-section"><h3>XY Plot Settings</h3>
      <div class="form-grid">
        <label>X Variable</label>
        <select data-p="XVariable">
          <option value="">-- Select --</option>
          ${params.map(v => `<option${v===p.XVariable?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Show Grid</label>
        <select data-p="ShowGrid">
          <option value="true"${p.ShowGrid?' selected':''}>true</option>
          <option value="false"${!p.ShowGrid?' selected':''}>false</option>
        </select>
        <label>Show Plot</label>
        <select data-p="ShowPlot">
          <option value="true"${p.ShowPlot?' selected':''}>true</option>
          <option value="false"${!p.ShowPlot?' selected':''}>false</option>
        </select>
      </div>
    </div>
    <div class="panel-section"><h3>Y Variables</h3>
      <div class="dual-list">
        <div>
          <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Available</div>
          <div class="dual-list-box" id="xyp-avail">
            ${params.filter(a => !(p.YVariables||[]).includes(a)).map(a => `<div class="list-item" data-val="${a}">${a}</div>`).join('')}
          </div>
        </div>
        <div class="dual-list-btns">
          <button id="xyp-add">&rarr;</button>
          <button id="xyp-remove">&larr;</button>
        </div>
        <div>
          <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Selected</div>
          <div class="dual-list-box" id="xyp-selected">
            ${(p.YVariables||[]).map(s => `<div class="list-item" data-val="${s}">${s}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      let v = inp.value;
      if (v === 'true') v = true;
      else if (v === 'false') v = false;
      store.setProperty(name, inp.dataset.p, v);
    });
  });
  // Dual list logic
  let availSel = null, selSel = null;
  el.querySelector('#xyp-avail').addEventListener('click', e => {
    const item = e.target.closest('.list-item'); if (!item) return;
    el.querySelectorAll('#xyp-avail .list-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected'); availSel = item.dataset.val;
  });
  el.querySelector('#xyp-selected').addEventListener('click', e => {
    const item = e.target.closest('.list-item'); if (!item) return;
    el.querySelectorAll('#xyp-selected .list-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected'); selSel = item.dataset.val;
  });
  el.querySelector('#xyp-add').addEventListener('click', () => {
    if (!availSel) return;
    const cur = store.getObject(name).properties.YVariables || [];
    cur.push(availSel);
    store.setProperty(name, 'YVariables', cur);
    const item = el.querySelector(`#xyp-avail .list-item[data-val="${availSel}"]`);
    if (item) { item.remove(); el.querySelector('#xyp-selected').appendChild(item); item.classList.remove('selected'); }
    availSel = null;
  });
  el.querySelector('#xyp-remove').addEventListener('click', () => {
    if (!selSel) return;
    const cur = store.getObject(name).properties.YVariables || [];
    const idx = cur.indexOf(selSel); if (idx >= 0) cur.splice(idx, 1);
    store.setProperty(name, 'YVariables', cur);
    const item = el.querySelector(`#xyp-selected .list-item[data-val="${selSel}"]`);
    if (item) { item.remove(); el.querySelector('#xyp-avail').appendChild(item); item.classList.remove('selected'); }
    selSel = null;
  });
  return el;
}
