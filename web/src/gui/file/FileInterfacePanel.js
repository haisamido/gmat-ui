/**
 * FileInterfacePanel.js — File Interface configuration panel
 *
 * C++ reference: src/gui/file/FileInterfacePanel.cpp
 */

import { bindInputsToStore } from '../widgets/PanelHelpers.js';

export function createFileInterfacePanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  el.innerHTML = `
    <div class="panel-section"><h3>File Interface — ${name}</h3>
      <div class="form-grid">
        <label>Filename</label><input type="text" data-p="Filename" value="${p.Filename || ''}">
        <label>Format</label>
        <select data-p="Format">
          ${['TextFile','TVHF_ASCII'].map(v => `<option${v===p.Format?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}
