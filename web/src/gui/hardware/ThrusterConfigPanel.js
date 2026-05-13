/**
 * ThrusterConfigPanel.js — Chemical and Electric Thruster configuration panels
 *
 * C++ reference: src/gui/hardware/ThrusterConfigPanel.cpp
 */

import { bindInputsToStore } from '../widgets/PanelHelpers.js';

export function createChemicalThrusterPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const tanks = store.getAllByType('ChemicalTank').map(o => o.name);
  el.innerHTML = `
    <div class="panel-section"><h3>Chemical Thruster — ${name}</h3>
      <div class="form-grid">
        <label>Coordinate System</label>
        <select data-p="CoordinateSystem">
          ${['Local','EarthMJ2000Eq','EarthFixed'].map(v => `<option${v===p.CoordinateSystem?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Origin</label><input type="text" data-p="Origin" value="${p.Origin}">
        <label>Axes</label>
        <select data-p="Axes">
          ${['VNB','MJ2000Eq','SpacecraftBody'].map(v => `<option${v===p.Axes?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Thrust Direction 1</label><input type="number" step="any" data-p="ThrustDirection1" value="${p.ThrustDirection1}">
        <label>Thrust Direction 2</label><input type="number" step="any" data-p="ThrustDirection2" value="${p.ThrustDirection2}">
        <label>Thrust Direction 3</label><input type="number" step="any" data-p="ThrustDirection3" value="${p.ThrustDirection3}">
        <label>Duty Cycle</label><input type="number" step="any" data-p="DutyCycle" value="${p.DutyCycle}">
        <label>Thrust Scale Factor</label><input type="number" step="any" data-p="ThrustScaleFactor" value="${p.ThrustScaleFactor}">
        <label>Decrement Mass</label>
        <select data-p="DecrementMass">
          <option value="false"${!p.DecrementMass?' selected':''}>false</option>
          <option value="true"${p.DecrementMass?' selected':''}>true</option>
        </select>
        <label>Tank</label>
        <select data-p="Tank">
          <option value="">-- None --</option>
          ${tanks.map(n => `<option value="${n}"${n===p.Tank?' selected':''}>${n}</option>`).join('')}
        </select>
        <label>Gravitational Accel (m/s²)</label><input type="number" step="any" data-p="GravitationalAccel" value="${p.GravitationalAccel}">
        <label>C1 — Thrust (N)</label><input type="number" step="any" data-p="C1" value="${p.C1}">
        <label>K1 — Isp (s)</label><input type="number" step="any" data-p="K1" value="${p.K1}">
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}

export function createElectricThrusterPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  const tanks = store.getAllByType('ElectricTank').map(o => o.name);
  el.innerHTML = `
    <div class="panel-section"><h3>Electric Thruster — ${name}</h3>
      <div class="form-grid">
        <label>Coordinate System</label>
        <select data-p="CoordinateSystem">
          ${['Local','EarthMJ2000Eq','EarthFixed'].map(v => `<option${v===p.CoordinateSystem?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Origin</label><input type="text" data-p="Origin" value="${p.Origin}">
        <label>Axes</label>
        <select data-p="Axes">
          ${['VNB','MJ2000Eq','SpacecraftBody'].map(v => `<option${v===p.Axes?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Thrust Direction 1</label><input type="number" step="any" data-p="ThrustDirection1" value="${p.ThrustDirection1}">
        <label>Thrust Direction 2</label><input type="number" step="any" data-p="ThrustDirection2" value="${p.ThrustDirection2}">
        <label>Thrust Direction 3</label><input type="number" step="any" data-p="ThrustDirection3" value="${p.ThrustDirection3}">
        <label>Duty Cycle</label><input type="number" step="any" data-p="DutyCycle" value="${p.DutyCycle}">
        <label>Thrust Scale Factor</label><input type="number" step="any" data-p="ThrustScaleFactor" value="${p.ThrustScaleFactor}">
        <label>Decrement Mass</label>
        <select data-p="DecrementMass">
          <option value="false"${!p.DecrementMass?' selected':''}>false</option>
          <option value="true"${p.DecrementMass?' selected':''}>true</option>
        </select>
        <label>Tank</label>
        <select data-p="Tank">
          <option value="">-- None --</option>
          ${tanks.map(n => `<option value="${n}"${n===p.Tank?' selected':''}>${n}</option>`).join('')}
        </select>
        <label>Thrust Model</label>
        <select data-p="ThrustModel">
          ${['ConstantThrustAndIsp','FixedEfficiency','ThrustMassPolynomial'].map(v => `<option${v===p.ThrustModel?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Max Usable Power (kW)</label><input type="number" step="any" data-p="MaximumUsablePower" value="${p.MaximumUsablePower}">
        <label>Min Usable Power (kW)</label><input type="number" step="any" data-p="MinimumUsablePower" value="${p.MinimumUsablePower}">
        <label>Constant Thrust (kN)</label><input type="number" step="any" data-p="ConstantThrust" value="${p.ConstantThrust}">
        <label>Isp (s)</label><input type="number" step="any" data-p="Isp" value="${p.Isp}">
        <label>Gravitational Accel</label><input type="number" step="any" data-p="GravitationalAccel" value="${p.GravitationalAccel}">
        <label>Fixed Efficiency</label><input type="number" step="any" data-p="FixedEfficiency" value="${p.FixedEfficiency}">
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}
