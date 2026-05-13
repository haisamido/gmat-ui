/**
 * FiniteBurnSetupPanel.js — Finite burn configuration panel
 *
 * C++ reference: src/gui/burn/FiniteBurnSetupPanel.cpp
 */

export function createFiniteBurnPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;

  // Get available thrusters for selection
  const thrusters = [...store.getAllByType('ChemicalThruster'), ...store.getAllByType('ElectricThruster')];
  const thrusterNames = thrusters.map(t => t.name);
  const selectedThrusters = p.Thrusters || [];

  el.innerHTML = `
    <div class="panel-section"><h3>Thrusters</h3>
      <div class="dual-list-container">
        <div class="dual-list-col">
          <label>Available</label>
          <select multiple class="dual-list" data-available>
            ${thrusterNames.filter(n => !selectedThrusters.includes(n)).map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <div class="dual-list-btns">
          <button data-add-thruster title="Add selected">&rarr;</button>
          <button data-remove-thruster title="Remove selected">&larr;</button>
        </div>
        <div class="dual-list-col">
          <label>Selected</label>
          <select multiple class="dual-list" data-selected>
            ${selectedThrusters.map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="panel-section"><h3>Throttle Logic</h3>
      <div class="form-grid">
        <label>Algorithm</label>
        <select data-p="ThrottleLogicAlgorithm">
          ${['MaxNumberOfThrusters','MinNumberOfThrusters'].map(v => `<option${v===p.ThrottleLogicAlgorithm?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>`;

  const availList = el.querySelector('[data-available]');
  const selList = el.querySelector('[data-selected]');

  const syncThrusters = () => {
    const sel = [...selList.options].map(o => o.value);
    store.setProperty(name, 'Thrusters', sel);
  };

  el.querySelector('[data-add-thruster]').addEventListener('click', () => {
    [...availList.selectedOptions].forEach(opt => {
      selList.appendChild(opt);
    });
    syncThrusters();
  });

  el.querySelector('[data-remove-thruster]').addEventListener('click', () => {
    [...selList.selectedOptions].forEach(opt => {
      availList.appendChild(opt);
    });
    syncThrusters();
  });

  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      store.setProperty(name, inp.dataset.p, inp.value);
    });
  });

  // React to new thrusters being created
  store.onChange((action, obj) => {
    if (action === 'create' && (obj.type === 'ChemicalThruster' || obj.type === 'ElectricThruster')) {
      const selected = [...selList.options].map(o => o.value);
      if (!selected.includes(obj.name)) {
        const opt = document.createElement('option');
        opt.value = obj.name;
        opt.textContent = obj.name;
        availList.appendChild(opt);
      }
    }
    if (action === 'delete' && (obj.type === 'ChemicalThruster' || obj.type === 'ElectricThruster')) {
      [...availList.options, ...selList.options].forEach(opt => {
        if (opt.value === obj.name) opt.remove();
      });
    }
  });

  return el;
}
