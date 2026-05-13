/**
 * FunctionSetupPanel.js — GMAT Function configuration panel
 *
 * C++ reference: src/gui/function/FunctionSetupPanel.cpp
 */

import { bindInputsToStore } from '../widgets/PanelHelpers.js';

export function createGmatFunctionPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  el.innerHTML = `
    <div class="panel-section"><h3>GMAT Function — ${name}</h3>
      <div class="form-grid">
        <label>Function Path</label><input type="text" data-p="FunctionPath" value="${p.FunctionPath || ''}" style="width:100%">
      </div>
      <p style="color:var(--overlay0);font-size:11px;margin-top:8px;">
        Path to the .gmf function file. Functions are defined in separate script files.
      </p>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}
