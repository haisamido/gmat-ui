/**
 * ImpulsiveBurn.js — Impulsive burn configuration panel
 *
 * C++ reference: src/base/burn/ImpulsiveBurn.cpp
 */

/**
 * Create an impulsive burn configuration panel
 */
export function createBurnPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;

  el.innerHTML = `
    <div class="panel-section"><h3>Coordinate System</h3>
      <div class="form-grid">
        <label>Coord. System</label>
        <select data-p="CoordinateSystem">
          ${['Local','EarthMJ2000Eq','EarthFixed'].map(v => `<option${v===p.CoordinateSystem?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Origin</label>
        <select data-p="Origin">
          ${['Earth','Luna','Mars','Sun'].map(v => `<option${v===p.Origin?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Axes</label>
        <select data-p="Axes">
          ${['VNB','LVLH','MJ2000Eq','SpacecraftBody'].map(v => `<option${v===p.Axes?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="panel-section"><h3>Delta-V Components</h3>
      <div class="form-grid">
        <label>Element 1 (km/s)</label><input type="number" step="any" data-p="Element1" value="${p.Element1}">
        <label>Element 2 (km/s)</label><input type="number" step="any" data-p="Element2" value="${p.Element2}">
        <label>Element 3 (km/s)</label><input type="number" step="any" data-p="Element3" value="${p.Element3}">
      </div>
    </div>
    <div class="panel-section"><h3>Mass Depletion</h3>
      <div class="form-grid">
        <label>Decrement Mass</label>
        <select data-p="DecrementMass">
          <option value="false"${!p.DecrementMass?' selected':''}>false</option>
          <option value="true"${p.DecrementMass?' selected':''}>true</option>
        </select>
        <label>Isp (s)</label><input type="number" step="any" data-p="Isp" value="${p.Isp}">
        <label>g (m/s2)</label><input type="number" step="any" data-p="GravitationalAccel" value="${p.GravitationalAccel}">
      </div>
    </div>`;

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
