/**
 * FormationSetupPanel.js — Formation configuration panel
 *
 * C++ reference: src/gui/spacecraft/FormationSetupPanel.cpp
 */

export function createFormationPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  let _fmtSelf = false;

  function buildPanel() {
    if (_fmtSelf) return;
    const obj = store.getObject(name);
    const p = obj.properties;
    const scNames = store.getAllByType('Spacecraft').map(o => o.name);
    const selected = p.Add || [];
    el.innerHTML = `
      <div class="panel-section"><h3>Formation — ${name}</h3>
        <div class="dual-list">
          <div>
            <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Available Spacecraft</div>
            <div class="dual-list-box" id="fmt-avail">
              ${scNames.filter(n => !selected.includes(n)).map(n => `<div class="list-item" data-val="${n}">${n}</div>`).join('')}
            </div>
          </div>
          <div class="dual-list-btns">
            <button id="fmt-add" title="Add Selected">&rarr;</button>
            <button id="fmt-remove" title="Remove Selected">&larr;</button>
            <button id="fmt-clear" title="Clear All">&lArr;</button>
          </div>
          <div>
            <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Selected Spacecraft</div>
            <div class="dual-list-box" id="fmt-selected">
              ${selected.map(n => `<div class="list-item" data-val="${n}">${n}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;

    const availBox = el.querySelector('#fmt-avail');
    const selBox = el.querySelector('#fmt-selected');

    // Click to select, Ctrl/Cmd+click to toggle additional
    function handleListClick(box, e) {
      const item = e.target.closest('.list-item');
      if (!item) return;
      if (e.ctrlKey || e.metaKey) {
        item.classList.toggle('selected');
      } else {
        box.querySelectorAll('.list-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      }
    }
    availBox.addEventListener('click', e => handleListClick(availBox, e));
    selBox.addEventListener('click', e => handleListClick(selBox, e));

    // Double-click to add (available) or remove (selected)
    availBox.addEventListener('dblclick', e => {
      const item = e.target.closest('.list-item');
      if (!item) return;
      const cur = store.getObject(name).properties.Add || [];
      cur.push(item.dataset.val);
      item.classList.remove('selected');
      selBox.appendChild(item);
      _fmtSelf = true;
      store.setProperty(name, 'Add', cur);
      _fmtSelf = false;
    });
    selBox.addEventListener('dblclick', e => {
      const item = e.target.closest('.list-item');
      if (!item) return;
      const cur = store.getObject(name).properties.Add || [];
      const idx = cur.indexOf(item.dataset.val);
      if (idx >= 0) cur.splice(idx, 1);
      item.classList.remove('selected');
      availBox.appendChild(item);
      _fmtSelf = true;
      store.setProperty(name, 'Add', cur);
      _fmtSelf = false;
    });

    // Add button
    el.querySelector('#fmt-add').addEventListener('click', () => {
      const items = availBox.querySelectorAll('.list-item.selected');
      if (!items.length) return;
      const cur = store.getObject(name).properties.Add || [];
      items.forEach(item => {
        cur.push(item.dataset.val);
        item.classList.remove('selected');
        selBox.appendChild(item);
      });
      _fmtSelf = true;
      store.setProperty(name, 'Add', cur);
      _fmtSelf = false;
    });

    // Remove button
    el.querySelector('#fmt-remove').addEventListener('click', () => {
      const items = selBox.querySelectorAll('.list-item.selected');
      if (!items.length) return;
      const cur = store.getObject(name).properties.Add || [];
      items.forEach(item => {
        const idx = cur.indexOf(item.dataset.val);
        if (idx >= 0) cur.splice(idx, 1);
        item.classList.remove('selected');
        availBox.appendChild(item);
      });
      _fmtSelf = true;
      store.setProperty(name, 'Add', cur);
      _fmtSelf = false;
    });

    // Clear All button
    el.querySelector('#fmt-clear').addEventListener('click', () => {
      const items = selBox.querySelectorAll('.list-item');
      if (!items.length) return;
      items.forEach(item => {
        item.classList.remove('selected');
        availBox.appendChild(item);
      });
      _fmtSelf = true;
      store.setProperty(name, 'Add', []);
      _fmtSelf = false;
    });
  }

  buildPanel();
  store.onChange(() => { if (el.isConnected) buildPanel(); });
  return el;
}
