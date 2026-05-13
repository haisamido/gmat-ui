/**
 * TankConfigPanel.js — Chemical and Electric Tank configuration panels
 *
 * C++ reference: src/gui/hardware/TankConfigPanel.cpp
 */

import { bindInputsToStore } from '../widgets/PanelHelpers.js';

export function createChemicalTankPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  el.innerHTML = `
    <div class="panel-section"><h3>Chemical Tank — ${name}</h3>
      <div class="form-grid">
        <label>Fuel Mass (kg)</label><input type="number" step="any" data-p="FuelMass" value="${p.FuelMass}">
        <label>Pressure (kPa)</label><input type="number" step="any" data-p="Pressure" value="${p.Pressure}">
        <label>Temperature (C)</label><input type="number" step="any" data-p="Temperature" value="${p.Temperature}">
        <label>Ref Temperature (C)</label><input type="number" step="any" data-p="RefTemperature" value="${p.RefTemperature}">
        <label>Volume (m^3)</label><input type="number" step="any" data-p="Volume" value="${p.Volume}">
        <label>Fuel Density (kg/m^3)</label><input type="number" step="any" data-p="FuelDensity" value="${p.FuelDensity}">
        <label>Pressure Model</label>
        <select data-p="PressureModel">
          ${['PressureRegulated','BlowDown'].map(v => `<option${v===p.PressureModel?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Allow Negative Fuel</label>
        <select data-p="AllowNegativeFuelMass">
          <option value="false"${!p.AllowNegativeFuelMass?' selected':''}>false</option>
          <option value="true"${p.AllowNegativeFuelMass?' selected':''}>true</option>
        </select>
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}

export function createElectricTankPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  el.innerHTML = `
    <div class="panel-section"><h3>Electric Tank — ${name}</h3>
      <div class="form-grid">
        <label>Fuel Mass (kg)</label><input type="number" step="any" data-p="FuelMass" value="${p.FuelMass}">
        <label>Allow Negative Fuel</label>
        <select data-p="AllowNegativeFuelMass">
          <option value="false"${!p.AllowNegativeFuelMass?' selected':''}>false</option>
          <option value="true"${p.AllowNegativeFuelMass?' selected':''}>true</option>
        </select>
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}
