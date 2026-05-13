/**
 * EventLocatorPanel.js — Eclipse and Contact Locator configuration panels
 *
 * C++ reference: src/gui/event/EventLocatorPanel.cpp
 */

import { bindInputsToStore } from '../widgets/PanelHelpers.js';

export function createEclipseLocatorPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const scNames = store.getAllByType('Spacecraft').map(o => o.name);
  el.innerHTML = `
    <div class="panel-section"><h3>Eclipse Locator — ${name}</h3>
      <div class="form-grid">
        <label>Spacecraft</label>
        <select data-p="Spacecraft">
          <option value="">-- Select --</option>
          ${scNames.map(n => `<option value="${n}"${n===p.Spacecraft?' selected':''}>${n}</option>`).join('')}
        </select>
        <label>Occulting Bodies</label><input type="text" data-p="OccultingBodies" value="${(p.OccultingBodies||[]).join(', ')}">
        <label>Input Epoch Format</label>
        <select data-p="InputEpochFormat">
          ${['UTCGregorian','UTCModJulian','TAIModJulian'].map(v => `<option${v===p.InputEpochFormat?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Initial Epoch</label><input type="text" data-p="InitialEpoch" value="${p.InitialEpoch}">
        <label>Final Epoch</label><input type="text" data-p="FinalEpoch" value="${p.FinalEpoch}">
        <label>Step Size (s)</label><input type="number" step="any" data-p="StepSize" value="${p.StepSize}">
        <label>Eclipse Types</label><input type="text" data-p="EclipseTypes" value="${(p.EclipseTypes||[]).join(', ')}">
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}

export function createContactLocatorPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const scNames = store.getAllByType('Spacecraft').map(o => o.name);
  const gsNames = store.getAllByType('GroundStation').map(o => o.name);
  el.innerHTML = `
    <div class="panel-section"><h3>Contact Locator — ${name}</h3>
      <div class="form-grid">
        <label>Target (Spacecraft)</label>
        <select data-p="Target">
          <option value="">-- Select --</option>
          ${scNames.map(n => `<option value="${n}"${n===p.Target?' selected':''}>${n}</option>`).join('')}
        </select>
        <label>Observer (Ground Stn)</label>
        <select data-p="Observer">
          <option value="">-- Select --</option>
          ${gsNames.map(n => `<option value="${n}"${n===p.Observer?' selected':''}>${n}</option>`).join('')}
        </select>
        <label>Light Time Direction</label>
        <select data-p="LightTimeDirection">
          ${['Transmit','Receive'].map(v => `<option${v===p.LightTimeDirection?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Input Epoch Format</label>
        <select data-p="InputEpochFormat">
          ${['UTCGregorian','UTCModJulian','TAIModJulian'].map(v => `<option${v===p.InputEpochFormat?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Initial Epoch</label><input type="text" data-p="InitialEpoch" value="${p.InitialEpoch}">
        <label>Final Epoch</label><input type="text" data-p="FinalEpoch" value="${p.FinalEpoch}">
        <label>Step Size (s)</label><input type="number" step="any" data-p="StepSize" value="${p.StepSize}">
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}
