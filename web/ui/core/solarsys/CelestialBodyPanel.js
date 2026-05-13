/**
 * CelestialBodyPanel.js — Celestial Body configuration panel with comprehensive body database
 *
 * C++ reference: src/gui/solarsys/CelestialBodyPanel.cpp
 */

import { createFileListWidget } from '../widgets/PanelHelpers.js';

// ── Comprehensive body database ──
const CELESTIAL_BODIES = {
  Sun: {
    type: 'Star', centralBody: '', icon: '\u2600',
    mu: 132712440017.99, eqRadius: 696000, flattening: 0.0, naifId: 10,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 286.13, spinAxisRARate: 0.0, spinAxisDEC: 63.87, spinAxisDECRate: 0.0,
    rotConst: 84.176, rotRate: 14.1844000,
    spiceFrameId: 'IAU_SUN', fkFiles: [],
    textureFile: 'Sun.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Mercury: {
    type: 'Planet', centralBody: 'Sun', icon: '\u263F',
    mu: 22032.08, eqRadius: 2439.7, flattening: 0.0, naifId: 199,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 281.0097, spinAxisRARate: -0.0328, spinAxisDEC: 61.4143, spinAxisDECRate: -0.0049,
    rotConst: 329.5469, rotRate: 6.1385025,
    spiceFrameId: 'IAU_MERCURY', fkFiles: [],
    textureFile: 'Mercury_JPLCaltech.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Venus: {
    type: 'Planet', centralBody: 'Sun', icon: '\u2640',
    mu: 324858.592, eqRadius: 6051.8, flattening: 0.0, naifId: 299,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 272.76, spinAxisRARate: 0.0, spinAxisDEC: 67.16, spinAxisDECRate: 0.0,
    rotConst: 160.20, rotRate: -1.4813688,
    spiceFrameId: 'IAU_VENUS', fkFiles: [],
    textureFile: 'Venus_BjornJonsson.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Earth: {
    type: 'Planet', centralBody: 'Sun', icon: '\u{1F30D}',
    mu: 398600.4415, eqRadius: 6378.1363, flattening: 0.00335270, naifId: 399,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc', 'earth_latest_high_prec.bpc', 'SPICEEarthPredictedKernel.bpc', 'SPICEEarthCurrentKernel.bpc'],
    spinAxisRA: 0.0, spinAxisRARate: -0.641, spinAxisDEC: 90.0, spinAxisDECRate: -0.557,
    rotConst: 190.147, rotRate: 360.9856235,
    spiceFrameId: 'IAU_EARTH', nutationUpdateInterval: 60.0, fkFiles: [],
    textureFile: 'ModifiedBlueMarble.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Luna: {
    type: 'Moon', centralBody: 'Earth', icon: '\u{1F319}',
    mu: 4902.799, eqRadius: 1738.2, flattening: 0.0012, naifId: 301,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc', 'SPICELunaCurrentKernel.bpc'],
    spinAxisRA: 269.9949, spinAxisRARate: 0.0031, spinAxisDEC: 66.5392, spinAxisDECRate: 0.0130,
    rotConst: 38.3213, rotRate: 13.17635815,
    spiceFrameId: 'IAU_MOON', fkFiles: ['SPICELunaFrameKernel.tf'],
    textureFile: 'Moon_HermesCelestiaMotherlode.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Mars: {
    type: 'Planet', centralBody: 'Sun', icon: '\u{1F534}',
    mu: 42828.314, eqRadius: 3396.19, flattening: 0.00648, naifId: 499,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 317.68143, spinAxisRARate: -0.1061, spinAxisDEC: 52.88650, spinAxisDECRate: -0.0609,
    rotConst: 176.630, rotRate: 350.89198226,
    spiceFrameId: 'IAU_MARS', fkFiles: [],
    textureFile: 'Mars_JPLCaltechUSGS.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Phobos: {
    type: 'Moon', centralBody: 'Mars', icon: '\u{1F311}',
    mu: 0.0007112, eqRadius: 13.1, flattening: 0.0, naifId: 401,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 317.68, spinAxisRARate: -0.108, spinAxisDEC: 52.90, spinAxisDECRate: -0.061,
    rotConst: 35.06, rotRate: 1128.8445850,
    spiceFrameId: 'IAU_PHOBOS', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Deimos: {
    type: 'Moon', centralBody: 'Mars', icon: '\u{1F311}',
    mu: 0.0000985, eqRadius: 7.8, flattening: 0.0, naifId: 402,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 316.65, spinAxisRARate: -0.108, spinAxisDEC: 53.52, spinAxisDECRate: -0.061,
    rotConst: 79.41, rotRate: 285.1618970,
    spiceFrameId: 'IAU_DEIMOS', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Jupiter: {
    type: 'Planet', centralBody: 'Sun', icon: '\u{1F7E0}',
    mu: 126712767.8578, eqRadius: 71492, flattening: 0.06487, naifId: 599,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 268.056595, spinAxisRARate: -0.006499, spinAxisDEC: 64.495303, spinAxisDECRate: 0.002413,
    rotConst: 284.95, rotRate: 870.5360000,
    spiceFrameId: 'IAU_JUPITER', fkFiles: [],
    textureFile: 'Jupiter_HermesCelestiaMotherlode.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Io: {
    type: 'Moon', centralBody: 'Jupiter', icon: '\u{1F311}',
    mu: 5959.916, eqRadius: 1821.6, flattening: 0.0, naifId: 501,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 268.05, spinAxisRARate: -0.009, spinAxisDEC: 64.50, spinAxisDECRate: 0.003,
    rotConst: 200.39, rotRate: 203.4889538,
    spiceFrameId: 'IAU_IO', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Europa: {
    type: 'Moon', centralBody: 'Jupiter', icon: '\u{1F311}',
    mu: 3202.739, eqRadius: 1560.8, flattening: 0.0, naifId: 502,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 268.08, spinAxisRARate: -0.009, spinAxisDEC: 64.51, spinAxisDECRate: 0.003,
    rotConst: 36.022, rotRate: 101.3747235,
    spiceFrameId: 'IAU_EUROPA', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Ganymede: {
    type: 'Moon', centralBody: 'Jupiter', icon: '\u{1F311}',
    mu: 9887.834, eqRadius: 2631.2, flattening: 0.0, naifId: 503,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 268.20, spinAxisRARate: -0.009, spinAxisDEC: 64.57, spinAxisDECRate: 0.003,
    rotConst: 44.064, rotRate: 50.3176081,
    spiceFrameId: 'IAU_GANYMEDE', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Callisto: {
    type: 'Moon', centralBody: 'Jupiter', icon: '\u{1F311}',
    mu: 7179.289, eqRadius: 2410.3, flattening: 0.0, naifId: 504,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 268.72, spinAxisRARate: -0.009, spinAxisDEC: 64.83, spinAxisDECRate: 0.003,
    rotConst: 259.51, rotRate: 21.5710715,
    spiceFrameId: 'IAU_CALLISTO', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Saturn: {
    type: 'Planet', centralBody: 'Sun', icon: '\u{1FA90}',
    mu: 37940626.0611, eqRadius: 60268, flattening: 0.09796, naifId: 699,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 40.589, spinAxisRARate: -0.036, spinAxisDEC: 83.537, spinAxisDECRate: -0.004,
    rotConst: 38.90, rotRate: 810.7939024,
    spiceFrameId: 'IAU_SATURN', fkFiles: [],
    textureFile: 'Saturn_gradiusCelestiaMotherlode.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Titan: {
    type: 'Moon', centralBody: 'Saturn', icon: '\u{1F311}',
    mu: 8978.138, eqRadius: 2574.73, flattening: 0.0, naifId: 606,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 39.4827, spinAxisRARate: 0.0, spinAxisDEC: 83.4279, spinAxisDECRate: 0.0,
    rotConst: 186.5855, rotRate: 22.5769768,
    spiceFrameId: 'IAU_TITAN', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Enceladus: {
    type: 'Moon', centralBody: 'Saturn', icon: '\u{1F311}',
    mu: 7.211, eqRadius: 252.1, flattening: 0.0, naifId: 602,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: [], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 40.66, spinAxisRARate: -0.036, spinAxisDEC: 83.52, spinAxisDECRate: -0.004,
    rotConst: 6.32, rotRate: 262.7318996,
    spiceFrameId: 'IAU_ENCELADUS', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Uranus: {
    type: 'Planet', centralBody: 'Sun', icon: '\u{1F535}',
    mu: 5794549.0070, eqRadius: 25559, flattening: 0.02293, naifId: 799,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 257.311, spinAxisRARate: 0.0, spinAxisDEC: -15.175, spinAxisDECRate: 0.0,
    rotConst: 203.81, rotRate: -501.1600928,
    spiceFrameId: 'IAU_URANUS', fkFiles: [],
    textureFile: 'Uranus_JPLCaltech.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Neptune: {
    type: 'Planet', centralBody: 'Sun', icon: '\u{1F535}',
    mu: 6836534.0638, eqRadius: 24764, flattening: 0.01708, naifId: 899,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 299.36, spinAxisRARate: 0.0, spinAxisDEC: 43.46, spinAxisDECRate: 0.0,
    rotConst: 253.18, rotRate: 536.3128492,
    spiceFrameId: 'IAU_NEPTUNE', fkFiles: [],
    textureFile: 'Neptune_BjornJonsson.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Triton: {
    type: 'Moon', centralBody: 'Neptune', icon: '\u{1F311}',
    mu: 1427.598, eqRadius: 1353.4, flattening: 0.0, naifId: 801,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: [], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 299.36, spinAxisRARate: 0.0, spinAxisDEC: 41.17, spinAxisDECRate: 0.0,
    rotConst: 296.53, rotRate: -61.2572637,
    spiceFrameId: 'IAU_TRITON', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Pluto: {
    type: 'Planet', centralBody: 'Sun', icon: '\u26AA',
    mu: 869.326, eqRadius: 1188.3, flattening: 0.0, naifId: 999,
    ephemSource: 'DE405', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: ['DE421AllPlanets.bsp'], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 132.993, spinAxisRARate: 0.0, spinAxisDEC: -6.163, spinAxisDECRate: 0.0,
    rotConst: 302.695, rotRate: -56.3623195,
    spiceFrameId: 'IAU_PLUTO', fkFiles: [],
    textureFile: 'Pluto_JPLCaltech.jpg', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  Charon: {
    type: 'Moon', centralBody: 'Pluto', icon: '\u{1F311}',
    mu: 105.88, eqRadius: 603.6, flattening: 0.0, naifId: 901,
    ephemSource: 'SPICE', ephemFile: 'DE421AllPlanets.bsp',
    spkFiles: [], pckFiles: ['SPICEPlanetaryConstantsKernel.tpc'],
    spinAxisRA: 132.993, spinAxisRARate: 0.0, spinAxisDEC: -6.163, spinAxisDECRate: 0.0,
    rotConst: 122.695, rotRate: -56.3623195,
    spiceFrameId: 'IAU_CHARON', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  SolarSystemBarycenter: {
    type: 'Barycenter', centralBody: '', icon: '\u2316',
    mu: 0, eqRadius: 0, flattening: 0.0, naifId: 0,
    ephemSource: 'SPICE', ephemFile: '',
    spkFiles: [], pckFiles: [],
    spinAxisRA: 0, spinAxisRARate: 0, spinAxisDEC: 90, spinAxisDECRate: 0,
    rotConst: 0, rotRate: 0,
    spiceFrameId: '', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  },
  EarthMoonBarycenter: {
    type: 'Barycenter', centralBody: '', icon: '\u2316',
    mu: 0, eqRadius: 0, flattening: 0.0, naifId: 3,
    ephemSource: 'SPICE', ephemFile: '',
    spkFiles: [], pckFiles: [],
    spinAxisRA: 0, spinAxisRARate: 0, spinAxisDEC: 90, spinAxisDECRate: 0,
    rotConst: 0, rotRate: 0,
    spiceFrameId: '', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  }
};

// Default colors per body (GMAT defaults)
const DEFAULT_COLORS = {
  Sun: { orbit: '#ffff00', target: '#ffff00' },
  Mercury: { orbit: '#c0c0c0', target: '#c0c0c0' },
  Venus: { orbit: '#daa520', target: '#daa520' },
  Earth: { orbit: '#4169e1', target: '#4169e1' },
  Luna: { orbit: '#808080', target: '#808080' },
  Mars: { orbit: '#cd5c5c', target: '#cd5c5c' },
  Jupiter: { orbit: '#ff8c00', target: '#ff8c00' },
  Saturn: { orbit: '#daa520', target: '#daa520' },
  Uranus: { orbit: '#40e0d0', target: '#40e0d0' },
  Neptune: { orbit: '#4169e1', target: '#4169e1' },
  Pluto: { orbit: '#a0a0a0', target: '#a0a0a0' },
};

export function createCelestialBodyPanel(name) {
  const el = document.createElement('div');
  el.className = 'config-panel';

  const b = CELESTIAL_BODIES[name] || {
    type: 'Body', centralBody: '', icon: '\u25CF',
    mu: 0, eqRadius: 0, flattening: 0.0, naifId: -1,
    ephemSource: 'SPICE', ephemFile: '',
    spkFiles: [], pckFiles: [],
    spinAxisRA: 0, spinAxisRARate: 0, spinAxisDEC: 90, spinAxisDECRate: 0,
    rotConst: 0, rotRate: 0,
    spiceFrameId: '', fkFiles: [],
    textureFile: '', modelFile: '', modelOffset: [0,0,0], modelRotation: [0,0,0], modelScale: 1.0
  };

  const isDefault = name in CELESTIAL_BODIES;
  const isSun = name === 'Sun';
  const isBarycenter = b.type === 'Barycenter';
  const isEarth = name === 'Earth';

  const colors = DEFAULT_COLORS[name] || { orbit: '#ff8c00', target: '#ff8c00' };

  // ── Build tabbed panel ──
  const tabNames = ['Properties', 'Orbit', 'Orientation', 'Visualization'];
  const tabBar = `<div class="body-tabs">${tabNames.map((t, i) =>
    `<button class="body-tab-btn${i===0?' active':''}" data-body-tab="${i}">${t}</button>`
  ).join('')}</div>`;

  const header = `<div class="body-panel-header">
    <span style="font-size:20px">${b.icon}</span>
    <h2>${name}</h2>
    <span class="body-type">${b.type}</span>
  </div>`;

  // ── Tab 0: Properties ──
  const propDisabled = isBarycenter ? ' disabled' : '';
  const propertiesTab = `<div class="body-tab-pane active" data-body-pane="0">
    <div class="panel-section"><h3>Physical Properties</h3>
      <div class="form-grid">
        <label>Mu (km\u00B3/s\u00B2)</label>
        <input type="number" step="any" value="${b.mu}"${propDisabled}>
        <label>Equatorial Radius (km)</label>
        <input type="number" step="any" value="${b.eqRadius}"${propDisabled}>
        <label>Flattening</label>
        <input type="number" step="any" value="${b.flattening}"${propDisabled}>
      </div>
    </div>
    <div class="panel-section"><h3>PCK Files</h3>
      <div data-pck-file-list></div>
    </div>
  </div>`;

  // ── Tab 1: Orbit ──
  const ephemSources = ['DE405', 'DE421', 'DE424', 'SPICE', 'TwoBodyPropagation'];
  const cbDisabled = isDefault ? ' disabled' : '';
  const ephemSrcDisabled = isDefault ? ' disabled' : '';
  const ephemFileDisabled = isDefault ? ' disabled' : '';
  const twoBodyDisplay = b.ephemSource === 'TwoBodyPropagation' && !isSun ? '' : ' style="display:none"';
  const twoBodyDisabled = isDefault ? ' disabled' : '';

  const orbitTab = `<div class="body-tab-pane" data-body-pane="1">
    <div class="panel-section"><h3>Orbit Data</h3>
      <div class="form-grid">
        ${!isSun ? `<label>Central Body</label>
        <input type="text" value="${b.centralBody}"${cbDisabled}>` : ''}
        <label>Ephemeris Source</label>
        <select${ephemSrcDisabled}>
          ${ephemSources.map(s => `<option value="${s}"${s===b.ephemSource?' selected':''}>${s}</option>`).join('')}
        </select>
        <label>Ephemeris File</label>
        <input type="text" value="${b.ephemFile}"${ephemFileDisabled}>
        <label>NAIF ID</label>
        <input type="number" value="${b.naifId}" disabled>
      </div>
    </div>
    <div class="panel-section"><h3>SPK Files</h3>
      <div data-spk-file-list></div>
    </div>
    ${!isSun ? `<div class="panel-section" data-twobody-section${twoBodyDisplay}><h3>Initial Two-Body State</h3>
      <div class="form-grid">
        <label>Initial A1 Epoch</label><input type="text" value="21545"${twoBodyDisabled}>
        <label>SMA (km)</label><input type="number" step="any" value="0"${twoBodyDisabled}>
        <label>ECC</label><input type="number" step="any" value="0"${twoBodyDisabled}>
        <label>INC (deg)</label><input type="number" step="any" value="0"${twoBodyDisabled}>
        <label>RAAN (deg)</label><input type="number" step="any" value="0"${twoBodyDisabled}>
        <label>AOP (deg)</label><input type="number" step="any" value="0"${twoBodyDisabled}>
        <label>TA (deg)</label><input type="number" step="any" value="0"${twoBodyDisabled}>
      </div>
    </div>` : ''}
  </div>`;

  // ── Tab 2: Orientation ──
  const orientDisabled = isDefault ? ' disabled' : '';
  const rotDataSources = ['IAUSimplified', 'SPICE'];
  const orientationTab = `<div class="body-tab-pane" data-body-pane="2">
    <div class="panel-section"><h3>Spin Axis</h3>
      <div class="form-grid">
        <label>Spin Axis RA Constant (deg)</label>
        <input type="number" step="any" value="${b.spinAxisRA}"${orientDisabled}>
        <label>Spin Axis RA Rate (deg/century)</label>
        <input type="number" step="any" value="${b.spinAxisRARate}"${orientDisabled}>
        <label>Spin Axis DEC Constant (deg)</label>
        <input type="number" step="any" value="${b.spinAxisDEC}"${orientDisabled}>
        <label>Spin Axis DEC Rate (deg/century)</label>
        <input type="number" step="any" value="${b.spinAxisDECRate}"${orientDisabled}>
      </div>
    </div>
    <div class="panel-section"><h3>Rotation</h3>
      <div class="form-grid">
        <label>Rotation Constant (deg)</label>
        <input type="number" step="any" value="${b.rotConst}"${orientDisabled}>
        <label>Rotation Rate (deg/day)</label>
        <input type="number" step="any" value="${b.rotRate}"${orientDisabled}>
        ${isEarth ? `<label>Nutation Update Interval (sec)</label>
        <input type="number" step="any" value="${b.nutationUpdateInterval || 60.0}">` : ''}
        <label>Rotation Data Source</label>
        <select disabled>
          ${rotDataSources.map(s => `<option value="${s}"${s==='IAUSimplified'?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="panel-section"><h3>SPICE</h3>
      <div class="form-grid">
        <label>Spice Frame Id</label>
        <input type="text" value="${b.spiceFrameId}">
      </div>
    </div>
    <div class="panel-section"><h3>FK Files</h3>
      <div data-fk-file-list></div>
    </div>
  </div>`;

  // ── Tab 3: Visualization ──
  const visDisabled = isBarycenter ? ' disabled' : '';
  const visualizationTab = `<div class="body-tab-pane" data-body-pane="3">
    <div class="panel-section"><h3>Texture</h3>
      <div class="form-grid">
        <label>Texture File</label>
        <input type="text" value="${b.textureFile}"${visDisabled}>
      </div>
    </div>
    <div class="panel-section"><h3>3D Model</h3>
      <div class="form-grid">
        <label>3D Model File</label>
        <input type="text" value="${b.modelFile}"${visDisabled}>
        <label>3D Model Offset X</label>
        <input type="number" step="any" value="${b.modelOffset[0]}"${visDisabled}>
        <label>3D Model Offset Y</label>
        <input type="number" step="any" value="${b.modelOffset[1]}"${visDisabled}>
        <label>3D Model Offset Z</label>
        <input type="number" step="any" value="${b.modelOffset[2]}"${visDisabled}>
        <label>3D Model Rotation X (deg)</label>
        <input type="number" step="any" value="${b.modelRotation[0]}"${visDisabled}>
        <label>3D Model Rotation Y (deg)</label>
        <input type="number" step="any" value="${b.modelRotation[1]}"${visDisabled}>
        <label>3D Model Rotation Z (deg)</label>
        <input type="number" step="any" value="${b.modelRotation[2]}"${visDisabled}>
        <label>3D Model Scale</label>
        <input type="number" step="any" value="${b.modelScale}"${visDisabled}>
      </div>
    </div>
    <div class="panel-section"><h3>Colors</h3>
      <div class="color-row">
        <label>Orbit Color</label>
        <input type="color" class="color-swatch" value="${colors.orbit}">
      </div>
      <div class="color-row">
        <label>Target Color</label>
        <input type="color" class="color-swatch" value="${colors.target}">
      </div>
    </div>
  </div>`;

  el.innerHTML = tabBar + header + propertiesTab + orbitTab + orientationTab + visualizationTab;

  // ── Attach file list widgets with Add/Remove buttons ──
  const pckSlot = el.querySelector('[data-pck-file-list]');
  if (pckSlot) pckSlot.replaceWith(createFileListWidget(b.pckFiles));

  const spkSlot = el.querySelector('[data-spk-file-list]');
  if (spkSlot) spkSlot.replaceWith(createFileListWidget(b.spkFiles));

  const fkSlot = el.querySelector('[data-fk-file-list]');
  if (fkSlot) fkSlot.replaceWith(createFileListWidget(b.fkFiles));

  // ── Wire up sub-tab switching ──
  const btns = el.querySelectorAll('.body-tab-btn');
  const panes = el.querySelectorAll('.body-tab-pane');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const idx = btn.getAttribute('data-body-tab');
      el.querySelector(`[data-body-pane="${idx}"]`).classList.add('active');
      el.dispatchEvent(new CustomEvent('subtabchange', {
        bubbles: true,
        detail: { tabIndex: parseInt(idx), panelName: name, panelType: 'CelestialBody' }
      }));
    });
  });

  return el;
}

export { CELESTIAL_BODIES, DEFAULT_COLORS };
