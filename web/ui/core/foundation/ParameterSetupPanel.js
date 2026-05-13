/**
 * ParameterSetupPanel.js — Variable/Array/String configuration panel
 *
 * C++ reference: src/gui/foundation/ParameterSetupPanel.cpp
 */

export function createVariablePanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const typeLabel = obj.type === 'Array' ? 'Array' : obj.type === 'String' ? 'String' : 'Variable';
  let formHtml = '';
  if (obj.type === 'Array') {
    formHtml = `
      <label>Rows</label><input type="number" data-p="RowCount" value="${p.RowCount || 1}" min="1">
      <label>Columns</label><input type="number" data-p="ColCount" value="${p.ColCount || 1}" min="1">`;
  } else if (obj.type === 'String') {
    formHtml = `<label>Value</label><input type="text" data-p="Value" value="${p.Value || ''}">`;
  } else {
    formHtml = `<label>Value</label><input type="number" step="any" data-p="Value" value="${p.Value || 0}">`;
  }
  el.innerHTML = `
    <div class="panel-section"><h3>${typeLabel}: ${name}</h3>
      <div class="form-grid">
        ${formHtml}
      </div>
    </div>`;
  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      let v = inp.value;
      if (inp.type === 'number') v = parseFloat(v);
      store.setProperty(name, inp.dataset.p, v);
    });
  });
  return el;
}
