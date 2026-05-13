/**
 * Propagator.js — Propagator configuration panel
 *
 * C++ reference: src/base/propagator/Propagator.cpp
 */

/**
 * Create a propagator configuration panel
 */
export function createPropagatorPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const prop = store.getObject(name);
  const p = prop.properties;
  const fm = store.getObject(p.FM);
  const fp = fm ? fm.properties : {};

  el.innerHTML = `
    <div class="panel-section"><h3>Integrator</h3>
      <div class="form-grid">
        <label>Type</label>
        <select data-obj="${name}" data-p="Type">
          ${['RungeKutta89','RungeKutta68','RungeKutta56','PrinceDormand45','PrinceDormand78','AdamsBashforthMoulton'].map(v => `<option${v===p.Type?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Initial Step (s)</label><input type="number" data-obj="${name}" data-p="InitialStepSize" value="${p.InitialStepSize}">
        <label>Accuracy</label><input type="text" data-obj="${name}" data-p="Accuracy" value="${p.Accuracy}">
        <label>Min Step (s)</label><input type="number" step="any" data-obj="${name}" data-p="MinStep" value="${p.MinStep}">
        <label>Max Step (s)</label><input type="number" data-obj="${name}" data-p="MaxStep" value="${p.MaxStep}">
        <label>Max Attempts</label><input type="number" data-obj="${name}" data-p="MaxStepAttempts" value="${p.MaxStepAttempts}">
      </div>
    </div>
    <div class="panel-section"><h3>Force Model${fm ? ' — ' + fm.name : ''}</h3>
      <div class="form-grid">
        <label>Central Body</label>
        <select data-obj="${p.FM}" data-p="CentralBody">
          ${['Earth','Luna','Mars','Sun','Jupiter','Venus','Mercury','Saturn'].map(v => `<option${v===fp.CentralBody?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Primary Bodies</label>
        <input type="text" data-obj="${p.FM}" data-p="PrimaryBodies" value="${(fp.PrimaryBodies||[]).join(', ')}" placeholder="e.g. Earth">
        <label>Point Masses</label>
        <input type="text" data-obj="${p.FM}" data-p="PointMasses" value="${(fp.PointMasses||[]).join(', ')}" placeholder="e.g. Luna, Sun">
        <label>Gravity Degree</label>
        <input type="number" data-obj="${p.FM}" data-p="GravityField.Earth.Degree" value="${fp['GravityField.Earth.Degree']||4}">
        <label>Gravity Order</label>
        <input type="number" data-obj="${p.FM}" data-p="GravityField.Earth.Order" value="${fp['GravityField.Earth.Order']||4}">
        <label>SRP</label>
        <select data-obj="${p.FM}" data-p="SRP">
          ${['Off','On'].map(v => `<option${v===fp.SRP?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>`;

  el.querySelectorAll('[data-obj][data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      const obj = inp.dataset.obj;
      const prop = inp.dataset.p;
      let v = inp.value;
      if (prop === 'PrimaryBodies' || prop === 'PointMasses') {
        v = v.split(',').map(s => s.trim()).filter(s => s);
      } else if (inp.type === 'number') {
        v = parseFloat(v);
      }
      store.setProperty(obj, prop, v);
    });
  });
  return el;
}
