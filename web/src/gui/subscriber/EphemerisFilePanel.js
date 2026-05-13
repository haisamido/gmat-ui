/**
 * EphemerisFilePanel.js — Ephemeris file configuration panel
 *
 * C++ reference: src/gui/subscriber/EphemerisFilePanel.cpp (if exists)
 *                src/base/subscriber/EphemerisFile.cpp
 */

export function createEphemerisFilePanel(store, name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;

  // Get available spacecraft and coordinate systems
  const scNames = store.getAllByType('Spacecraft').map(s => s.name);
  const csNames = ['EarthMJ2000Eq', 'EarthMJ2000Ec', 'EarthFixed', 'EarthICRF'];
  store.getAllByType('CoordinateSystem').forEach(cs => csNames.push(cs.name));

  // File format options
  const fileFormats = ['SPK', 'CCSDS-OEM', 'Code-500', 'STK-TimePosVel'];
  const interpolators = ['Hermite', 'Lagrange'];
  const stepSizes = ['IntegratorSteps', '60', '300', '600', '900', '1800', '3600'];
  const outputFormats = ['LittleEndian', 'BigEndian'];
  const distanceUnits = ['Kilometers', 'Meters'];
  const epochFormats = ['UTCGregorian', 'UTCModJulian', 'TAIGregorian', 'TAIModJulian', 'A1Gregorian', 'A1ModJulian'];
  const epochValues = ['InitialSpacecraftEpoch', 'FinalSpacecraftEpoch'];

  el.innerHTML = `
    <div class="panel-section"><h3>Options</h3>
      <div class="form-grid">
        <label>Spacecraft</label>
        <select data-p="Spacecraft">
          ${scNames.map(sc => `<option value="${sc}"${sc===p.Spacecraft?' selected':''}>${sc}</option>`).join('')}
        </select>
        <label>Coordinate System</label>
        <select data-p="CoordinateSystem">
          ${csNames.map(cs => `<option value="${cs}"${cs===p.CoordinateSystem?' selected':''}>${cs}</option>`).join('')}
        </select>
        <label>Write Ephemeris</label>
        <select data-p="WriteEphemeris">
          <option value="true"${p.WriteEphemeris?' selected':''}>true</option>
          <option value="false"${!p.WriteEphemeris?' selected':''}>false</option>
        </select>
      </div>
    </div>
    <div class="panel-section"><h3>File Settings</h3>
      <div class="form-grid">
        <label>File Format</label>
        <select data-p="FileFormat">
          ${fileFormats.map(f => `<option value="${f}"${f===p.FileFormat?' selected':''}>${f}</option>`).join('')}
        </select>
        <label>Filename</label>
        <input type="text" data-p="Filename" value="${p.Filename}" style="font-family:monospace;font-size:11px">
        <label>Interpolator</label>
        <select data-p="Interpolator">
          ${interpolators.map(i => `<option value="${i}"${i===p.Interpolator?' selected':''}>${i}</option>`).join('')}
        </select>
        <label>Interpolation Order</label>
        <input type="number" data-p="InterpolationOrder" value="${p.InterpolationOrder}" min="1" max="11">
        <label>Step Size</label>
        <select data-p="StepSize">
          ${stepSizes.map(s => `<option value="${s}"${s===p.StepSize?' selected':''}>${s === 'IntegratorSteps' ? s : s + ' sec'}</option>`).join('')}
        </select>
        <label>Output Format</label>
        <select data-p="OutputFormat">
          ${outputFormats.map(f => `<option value="${f}"${f===p.OutputFormat?' selected':''}>${f}</option>`).join('')}
        </select>
        <label>Distance Unit</label>
        <select data-p="DistanceUnit">
          ${distanceUnits.map(d => `<option value="${d}"${d===p.DistanceUnit?' selected':''}>${d}</option>`).join('')}
        </select>
        <label>Include Event Boundaries</label>
        <select data-p="IncludeEventBoundaries">
          <option value="true"${p.IncludeEventBoundaries?' selected':''}>true</option>
          <option value="false"${!p.IncludeEventBoundaries?' selected':''}>false</option>
        </select>
      </div>
    </div>
    <div class="panel-section"><h3>Epoch</h3>
      <div class="form-grid">
        <label>Epoch Format</label>
        <select data-p="EpochFormat">
          ${epochFormats.map(f => `<option value="${f}"${f===p.EpochFormat?' selected':''}>${f}</option>`).join('')}
        </select>
        <label>Initial Epoch</label>
        <select data-p="InitialEpoch">
          ${epochValues.map(v => `<option value="${v}"${v===p.InitialEpoch?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Final Epoch</label>
        <select data-p="FinalEpoch">
          ${epochValues.map(v => `<option value="${v}"${v===p.FinalEpoch?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>`;

  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      let v = inp.value;
      if (inp.type === 'number') v = parseFloat(v);
      else if (v === 'true') v = true;
      else if (v === 'false') v = false;
      store.setProperty(name, inp.dataset.p, v);
    });
  });

  return el;
}
