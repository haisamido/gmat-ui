/**
 * SQPSetupPanel.js — VF13ad (SQP) Optimizer configuration panel
 *
 * C++ reference: src/gui/solver/SQPSetupPanel.cpp
 */

export function createVF13adPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  el.innerHTML = `
    <div class="panel-section"><h3>VF13ad Optimizer Settings</h3>
      <div class="form-grid">
        <label>Max Iterations</label><input type="number" data-p="MaximumIterations" value="${p.MaximumIterations}">
        <label>Tolerance</label><input type="number" data-p="Tolerance" value="${p.Tolerance}" step="1e-6">
        <label>Use Central Differences</label>
        <select data-p="UseCentralDifferences">
          <option value="true"${p.UseCentralDifferences?' selected':''}>true</option>
          <option value="false"${!p.UseCentralDifferences?' selected':''}>false</option>
        </select>
        <label>Report Style</label>
        <select data-p="ReportStyle">
          ${['Normal','Concise','Verbose','Debug'].map(v => `<option${v===p.ReportStyle?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Show Progress</label>
        <select data-p="ShowProgress">
          <option value="true"${p.ShowProgress?' selected':''}>true</option>
          <option value="false"${!p.ShowProgress?' selected':''}>false</option>
        </select>
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
