/**
 * DCSetupPanel.js — Differential Corrector configuration panel
 *
 * C++ reference: src/gui/solver/DCSetupPanel.cpp
 */

export function createDiffCorrectorPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  el.innerHTML = `
    <div class="panel-section"><h3>Differential Corrector Settings</h3>
      <div class="form-grid">
        <label>Algorithm</label>
        <select data-p="Algorithm">
          ${['NewtonRaphson','Broyden','ModifiedBroyden'].map(v => `<option${v===p.Algorithm?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Max Iterations</label><input type="number" data-p="MaximumIterations" value="${p.MaximumIterations}">
        <label>Derivative Method</label>
        <select data-p="DerivativeMethod">
          ${['ForwardDifference','CentralDifference','BackwardDifference'].map(v => `<option${v===p.DerivativeMethod?' selected':''}>${v}</option>`).join('')}
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
