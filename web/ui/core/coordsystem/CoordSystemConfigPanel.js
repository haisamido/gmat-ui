/**
 * CoordSystemConfigPanel.js — Coordinate System configuration panel
 *
 * C++ reference: src/gui/coordsystem/CoordSysCreateDialog.cpp
 */

/**
 * Create a panel for user-defined coordinate systems
 */
export function createCoordinateSystemPanel(store, name) {
  const obj = store.getObject(name);
  const p = obj?.properties || { Origin: 'Earth', Axes: 'MJ2000Eq' };
  const el = document.createElement('div');
  el.className = 'config-panel';

  // Origin options: celestial bodies, barycenters, spacecraft
  const origins = [
    'Sun', 'Mercury', 'Venus', 'Earth', 'Luna', 'Mars', 'Phobos', 'Deimos',
    'Jupiter', 'Io', 'Europa', 'Ganymede', 'Callisto',
    'Saturn', 'Titan', 'Rhea',
    'Uranus', 'Neptune', 'Triton', 'Pluto', 'Charon',
    'SolarSystemBarycenter', 'EarthMoonBarycenter',
  ];
  // Add spacecraft as potential origins
  const scList = store.getAllByType('Spacecraft');
  if (scList.length) origins.push(...scList.map(s => s.name));

  // Axes types (from AxisSystemFactory.cpp)
  const axesTypes = [
    'MJ2000Eq',     // Mean of J2000 Equator (inertial)
    'MJ2000Ec',     // Mean of J2000 Ecliptic (inertial)
    'ICRF',         // International Celestial Reference Frame (inertial)
    'BodyFixed',    // Body-fixed rotating frame
    'BodyInertial', // Body-centered inertial
    'Equator',      // True of Date Equator
    'TODEq',        // True of Date Equator
    'TODEc',        // True of Date Ecliptic
    'MODEq',        // Mean of Date Equator
    'MODEc',        // Mean of Date Ecliptic
    'TOEEq',        // True of Epoch Equator
    'TOEEc',        // True of Epoch Ecliptic
    'MOEEq',        // Mean of Epoch Equator
    'MOEEc',        // Mean of Epoch Ecliptic
    'ObjectReferenced', // Defined by primary/secondary objects
    'Topocentric',  // Topocentric at ground station
    'GSE',          // Geocentric Solar Ecliptic
    'GSM',          // Geocentric Solar Magnetospheric
    'LocalAlignedConstrained', // Local aligned constrained
    'BodySpinSun',  // Body spin sun
    'TEME',         // True Equator Mean Equinox
  ];

  el.innerHTML = `
    <div class="panel-section"><h3>Coordinate System — ${name}</h3>
      <div class="form-grid">
        <label>Origin</label>
        <select data-p="Origin">
          ${origins.map(v => `<option${v===p.Origin?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Axes</label>
        <select data-p="Axes">
          ${axesTypes.map(v => `<option${v===p.Axes?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="panel-section" data-axes-options style="display:none;">
      <h3>Axes Options</h3>
      <div class="form-grid" data-axes-options-grid></div>
    </div>
  `;

  // Wire up change listeners
  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      const prop = inp.dataset.p;
      const val = inp.type === 'checkbox' ? inp.checked : inp.value;
      store.setProperty(name, prop, val);
      if (prop === 'Axes') updateAxesOptions();
    });
  });

  // Update axes-specific options based on selection
  function updateAxesOptions() {
    const axesSection = el.querySelector('[data-axes-options]');
    const axesGrid = el.querySelector('[data-axes-options-grid]');
    const axesSelect = el.querySelector('[data-p="Axes"]');
    const axes = axesSelect?.value || p.Axes || 'MJ2000Eq';

    // ObjectReferenced axes need primary/secondary objects
    if (axes === 'ObjectReferenced') {
      axesSection.style.display = '';
      axesGrid.innerHTML = `
        <label>Primary</label>
        <select data-p="Primary">
          ${origins.map(v => `<option${v===p.Primary?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Secondary</label>
        <select data-p="Secondary">
          ${origins.map(v => `<option${v===p.Secondary?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>X-Axis</label>
        <select data-p="XAxis">
          ${['R','V','-R','-V'].map(v => `<option${v===p.XAxis?' selected':''}>${v}</option>`).join('')}
        </select>
        <label>Y-Axis</label>
        <select data-p="YAxis">
          ${['N','R','V','-N','-R','-V'].map(v => `<option${v===p.YAxis?' selected':''}>${v}</option>`).join('')}
        </select>
      `;
      // Wire new inputs
      axesGrid.querySelectorAll('[data-p]').forEach(inp => {
        inp.addEventListener('change', () => {
          store.setProperty(name, inp.dataset.p, inp.value);
        });
      });
    } else if (axes === 'Topocentric') {
      axesSection.style.display = '';
      const stations = store.getAllByType('GroundStation');
      axesGrid.innerHTML = `
        <label>Ground Station</label>
        <select data-p="Primary">
          ${stations.map(s => `<option${s.name===p.Primary?' selected':''}>${s.name}</option>`).join('')}
        </select>
      `;
      axesGrid.querySelectorAll('[data-p]').forEach(inp => {
        inp.addEventListener('change', () => {
          store.setProperty(name, inp.dataset.p, inp.value);
        });
      });
    } else {
      axesSection.style.display = 'none';
    }
  }

  updateAxesOptions();
  return el;
}

export function createPredefinedCoordSysPanel(name) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const info = {
    EarthMJ2000Eq: { origin: 'Earth', axes: 'MJ2000Eq', desc: 'Earth-centered Mean Equator and Equinox of J2000 (inertial)' },
    EarthMJ2000Ec: { origin: 'Earth', axes: 'MJ2000Ec', desc: 'Earth-centered Mean Ecliptic and Equinox of J2000 (inertial)' },
    EarthFixed:    { origin: 'Earth', axes: 'BodyFixed', desc: 'Earth-centered Earth-fixed rotating frame (ITRF)' },
    EarthICRF:     { origin: 'Earth', axes: 'ICRF',      desc: 'Earth-centered International Celestial Reference Frame (inertial)' },
  };
  const cs = info[name] || { origin: 'Earth', axes: '—', desc: '' };
  el.innerHTML = `
    <div class="panel-section"><h3>Coordinate System — ${name}</h3>
      <p style="color:var(--subtext0);font-size:12px;margin-bottom:12px;">${cs.desc}</p>
      <div class="form-grid">
        <label>Origin</label><input type="text" disabled value="${cs.origin}">
        <label>Axes</label><input type="text" disabled value="${cs.axes}">
        <label>Epoch</label><input type="text" disabled value="J2000 (01 Jan 2000 12:00:00.000 TT)">
      </div>
      <p style="color:var(--overlay0);font-size:11px;margin-top:12px;">
        This is a built-in coordinate system and cannot be modified or deleted.
      </p>
    </div>`;
  return el;
}
