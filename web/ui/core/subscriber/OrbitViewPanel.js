/**
 * OrbitViewPanel.js — OrbitView subscriber configuration panel
 *
 * C++ reference: src/gui/subscriber/OrbitViewPanel.cpp
 */

export function createOrbitViewPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const scNames = store.getAllByType('Spacecraft').map(s => s.name);
  const selected = p.Add || [];
  el.innerHTML = `
    <div class="panel-section"><h3>Orbit View Settings</h3>
      <div class="form-grid">
        <label>Coordinate System</label>
        <select data-p="CoordinateSystem">
          ${['EarthMJ2000Eq','EarthMJ2000Ec','EarthFixed','EarthICRF'].map(v => `<option${v===p.CoordinateSystem?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>View Point Ref</label>
        <select data-p="ViewPointReference">
          ${['Earth','Luna','Mars','Sun'].map(v => `<option${v===p.ViewPointReference?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Show Plot</label>
        <select data-p="ShowPlot">
          <option value="true"${p.ShowPlot?' selected':''}>true</option>
          <option value="false"${!p.ShowPlot?' selected':''}>false</option>
        </select>
        <label>Axes</label>
        <select data-p="Axes">
          ${['On','Off'].map(v => `<option${v===p.Axes?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Sun Line</label>
        <select data-p="SunLine">
          ${['On','Off'].map(v => `<option${v===p.SunLine?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Enable Stars</label>
        <select data-p="EnableStars">
          ${['On','Off'].map(v => `<option${v===p.EnableStars?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="panel-section"><h3>Spacecraft to Display</h3>
      <div class="form-grid">
        ${scNames.map(sc => `
          <label>${sc}</label>
          <select data-sc="${sc}">
            <option value="on"${selected.includes(sc)?' selected':''}>Show</option>
            <option value="off"${!selected.includes(sc)?' selected':''}>Hide</option>
          </select>
        `).join('')}
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
  el.querySelectorAll('[data-sc]').forEach(sel => {
    sel.addEventListener('change', () => {
      const cur = new Set(store.getObject(name).properties.Add || []);
      if (sel.value === 'on') cur.add(sel.dataset.sc);
      else cur.delete(sel.dataset.sc);
      store.setProperty(name, 'Add', [...cur]);
    });
  });
  return el;
}
