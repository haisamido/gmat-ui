/**
 * GroundStationPanel.js — Ground Station configuration panel
 *
 * C++ reference: src/gui/asset/GroundStationPanel.cpp
 */

import { bindInputsToStore } from '../widgets/PanelHelpers.js';

export function createGroundStationPanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;
  el.innerHTML = `
    <div class="panel-section"><h3>Ground Station</h3>
      <div class="form-grid">
        <label>Central Body</label>
        <select data-p="CentralBody">
          ${['Earth','Luna','Mars'].map(v => `<option${v===p.CentralBody?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>State Type</label>
        <select data-p="StateType">
          ${['Spherical','Cartesian'].map(v => `<option${v===p.StateType?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Horizon Reference</label>
        <select data-p="HorizonReference">
          ${['Ellipsoid','Sphere'].map(v => `<option${v===p.HorizonReference?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Latitude (deg)</label><input type="number" step="any" data-p="Location1" value="${p.Location1}">
        <label>Longitude (deg)</label><input type="number" step="any" data-p="Location2" value="${p.Location2}">
        <label>Altitude (km)</label><input type="number" step="any" data-p="Location3" value="${p.Location3}">
        <label>Station Id</label><input type="text" data-p="Id" value="${p.Id || ''}">
        <label>Min Elevation (deg)</label><input type="number" step="any" data-p="MinimumElevationAngle" value="${p.MinimumElevationAngle}">
      </div>
    </div>`;
  bindInputsToStore(el, store, name);
  return el;
}
