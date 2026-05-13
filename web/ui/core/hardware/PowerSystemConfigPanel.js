/**
 * PowerSystemConfigPanel.js — Solar and Nuclear Power System configuration panels
 *
 * C++ reference: src/gui/hardware/PowerSystemConfigPanel.cpp
 */

import { bindInputsToStore } from '../widgets/PanelHelpers.js';

export function createPowerSystemPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const isSolar = obj.type === 'SolarPowerSystem';
  el.innerHTML = `
    <div class="panel-section"><h3>${isSolar ? 'Solar' : 'Nuclear'} Power System — ${name}</h3>
      <div class="form-grid">
        <label>Epoch Format</label>
        <select data-p="EpochFormat">
          ${['UTCGregorian','UTCModJulian','TAIModJulian'].map(v => `<option${v===p.EpochFormat?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Initial Epoch</label><input type="text" data-p="InitialEpoch" value="${p.InitialEpoch}">
        <label>Initial Max Power (kW)</label><input type="number" step="any" data-p="InitialMaxPower" value="${p.InitialMaxPower}">
        <label>Annual Decay Rate (%)</label><input type="number" step="any" data-p="AnnualDecayRate" value="${p.AnnualDecayRate}">
        <label>Margin (%)</label><input type="number" step="any" data-p="Margin" value="${p.Margin}">
        <label>Bus Coeff 1</label><input type="number" step="any" data-p="BusCoeff1" value="${p.BusCoeff1}">
        <label>Bus Coeff 2</label><input type="number" step="any" data-p="BusCoeff2" value="${p.BusCoeff2}">
        <label>Bus Coeff 3</label><input type="number" step="any" data-p="BusCoeff3" value="${p.BusCoeff3}">
        ${isSolar ? `
        <label>Shadow Model</label>
        <select data-p="ShadowModel">
          ${['DualCone','Cylindrical'].map(v => `<option${v===p.ShadowModel?' selected':''}>${v}</option>`).join('')}
        </select>
        ` : ''}
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}
