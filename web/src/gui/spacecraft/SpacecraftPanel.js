/**
 * SpacecraftPanel.js — Spacecraft configuration panel with tabbed interface
 *
 * C++ reference: src/gui/spacecraft/SpacecraftPanel.cpp
 */

import { wireDualList, createFileListWidget, bindInputsToStore, wireFileBrowseButtons } from '../widgets/PanelHelpers.js';

export function createSpacecraftPanel(store, name, ModelPreview) {
  const el = document.createElement('div');
  el.className = 'config-panel';
  const obj = store.getObject(name);
  const p = obj.properties;

  // ── Tab definitions ──
  const tabNames = ['Orbit', 'Attitude', 'Ballistic/Mass', 'Tanks', 'Power System', 'SPICE', 'Actuators', 'Visualization'];

  let activeTabIdx = 0;
  let _sliderDragging = false;
  function buildPanel() {
    if (_sliderDragging) return;
    // Preserve active tab across rebuilds
    const curActive = el.querySelector('.body-tab-btn.active');
    if (curActive) activeTabIdx = parseInt(curActive.dataset.bodyTab) || 0;
    // ── Tab bar ──
    const tabBar = `<div class="body-tabs">${tabNames.map((t, i) =>
      `<button class="body-tab-btn${i===activeTabIdx?' active':''}" data-body-tab="${i}">${t}</button>`
    ).join('')}</div>`;

    // ── Tab 0: Orbit ──
    const stateType = p.DisplayStateType || 'Keplerian';
    const stateTypes = ['Cartesian','Keplerian','ModifiedKeplerian','SphericalAZFPA','SphericalRADEC','Equinoctial','ModifiedEquinoctial','Delaunay','Planetodetic','IncomingAsymptote','OutgoingAsymptote','BrouwerMeanShort','BrouwerMeanLong'];
    const elemLabels = {
      Keplerian:     [['SMA','km'],['ECC',''],['INC','deg'],['RAAN','deg'],['AOP','deg'],['TA','deg']],
      Cartesian:     [['X','km'],['Y','km'],['Z','km'],['VX','km/s'],['VY','km/s'],['VZ','km/s']],
      SphericalAZFPA:[['RMAG','km'],['RA','deg'],['DEC','deg'],['VMAG','km/s'],['AZI','deg'],['FPA','deg']],
      SphericalRADEC:[['RMAG','km'],['RA','deg'],['DEC','deg'],['VMAG','km/s'],['RAV','deg'],['DECV','deg']],
    };
    const fields = elemLabels[stateType] || elemLabels.Keplerian;
    const isKep = stateType === 'Keplerian' || stateType === 'ModifiedKeplerian';
    const anomalyTypes = ['TA','MA','EA','HA'];

    // Build list of coordinate systems: predefined + user-created
    const predefinedCS = ['EarthMJ2000Eq','EarthMJ2000Ec','EarthFixed','EarthICRF'];
    const userCS = store.getAllByType('CoordinateSystem').map(cs => cs.name);
    const allCoordSystems = [...predefinedCS, ...userCS];

    const orbitTab = `<div class="body-tab-pane${activeTabIdx===0?' active':''}" data-body-pane="0">
      <div class="panel-section"><h3>Epoch</h3>
        <div class="form-grid">
          <label>Epoch Format</label>
          <select data-p="DateFormat">
            ${['UTCGregorian','TAIModJulian','UTCModJulian','A1ModJulian','TTModJulian','TDBModJulian','TTGregorian','TDBGregorian'].map(v => `<option${v===p.DateFormat?' selected':''}>${v}</option>`).join('')}
          </select>
          <label>Epoch</label>
          <input type="text" data-p="Epoch" value="${p.Epoch}">
        </div>
      </div>
      <div class="panel-section"><h3>Coordinate System</h3>
        <div class="form-grid">
          <label>Coordinate System</label>
          <select data-p="CoordinateSystem">
            ${allCoordSystems.map(v => `<option${v===p.CoordinateSystem?' selected':''}>${v}</option>`).join('')}
          </select>
          <label>State Type</label>
          <select data-p="DisplayStateType" data-sc-state-type>
            ${stateTypes.map(v => `<option${v===stateType?' selected':''}>${v}</option>`).join('')}
          </select>
          ${isKep ? `<label>Anomaly Type</label>
          <select data-p="AnomalyType">
            ${anomalyTypes.map(v => `<option${v===(p.AnomalyType||'TA')?' selected':''}>${v}</option>`).join('')}
          </select>` : ''}
        </div>
      </div>
      <div class="panel-section"><h3>Orbital Elements</h3>
        <div class="form-grid">
          ${fields.map(([f, u]) => `<label>${f}${u ? ' ('+u+')' : ''}</label><input type="number" step="any" data-p="${f}" value="${p[f] ?? 0}">`).join('')}
        </div>
      </div>
    </div>`;

    // ── Tab 1: Attitude ──
    const attModels = ['CoordinateSystemFixed','Spinner','PrecessingSpinner','NadirPointing','CCSDS-AEM'];
    const attStateTypes = ['EulerAngles','Quaternion','DirectionCosineMatrix','MRPs'];
    const attRateTypes = ['EulerAngleRates','AngularVelocity'];
    const eulerSeqs = ['123','132','213','231','312','321'];
    const attModel = p.AttitudeModel || 'CoordinateSystemFixed';
    const attST = p.AttitudeStateType || 'EulerAngles';
    const isEuler = attST === 'EulerAngles';
    const isSpinner = attModel === 'Spinner';
    const isPrecessing = attModel === 'PrecessingSpinner';
    const isNadir = attModel === 'NadirPointing';
    const isCCSDS = attModel === 'CCSDS-AEM';
    const celestialBodies = ['Earth','Luna','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];

    const attitudeTab = `<div class="body-tab-pane${activeTabIdx===1?' active':''}" data-body-pane="1">
      <div class="panel-section"><h3>Attitude Model</h3>
        <div class="form-grid">
          <label>Attitude Model</label>
          <select data-p="AttitudeModel" data-att-model-select>
            ${attModels.map(v => `<option${v===attModel?' selected':''}>${v}</option>`).join('')}
          </select>
          <label>Coordinate System</label>
          <select data-p="AttitudeCoordinateSystem">
            ${allCoordSystems.map(v => `<option${v===p.AttitudeCoordinateSystem?' selected':''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      ${isSpinner || isPrecessing ? `
      <div class="panel-section"><h3>Spinner Parameters</h3>
        <div class="form-grid">
          <label>Spin Axis X</label><input type="number" step="any" data-p="SpinAxis1" value="${p.SpinAxis1 ?? 0}">
          <label>Spin Axis Y</label><input type="number" step="any" data-p="SpinAxis2" value="${p.SpinAxis2 ?? 0}">
          <label>Spin Axis Z</label><input type="number" step="any" data-p="SpinAxis3" value="${p.SpinAxis3 ?? 1}">
          <label>Initial Spin Angle (deg)</label><input type="number" step="any" data-p="InitialSpinAngle" value="${p.InitialSpinAngle ?? 0}">
          <label>Spin Rate (deg/s)</label><input type="number" step="any" data-p="SpinRate" value="${p.SpinRate ?? 0}">
        </div>
      </div>` : ''}
      ${isPrecessing ? `
      <div class="panel-section"><h3>Precession Parameters</h3>
        <div class="form-grid">
          <label>Nutation Ref Vector X</label><input type="number" step="any" data-p="NutationReferenceVectorX" value="${p.NutationReferenceVectorX ?? 0}">
          <label>Nutation Ref Vector Y</label><input type="number" step="any" data-p="NutationReferenceVectorY" value="${p.NutationReferenceVectorY ?? 0}">
          <label>Nutation Ref Vector Z</label><input type="number" step="any" data-p="NutationReferenceVectorZ" value="${p.NutationReferenceVectorZ ?? 1}">
          <label>Initial Precession Angle (deg)</label><input type="number" step="any" data-p="InitialPrecessionAngle" value="${p.InitialPrecessionAngle ?? 0}">
          <label>Precession Rate (deg/s)</label><input type="number" step="any" data-p="PrecessionRate" value="${p.PrecessionRate ?? 0}">
          <label>Nutation Angle (deg)</label><input type="number" step="any" data-p="NutationAngle" value="${p.NutationAngle ?? 0}">
        </div>
      </div>` : ''}
      ${isNadir ? `
      <div class="panel-section"><h3>Nadir Pointing Parameters</h3>
        <div class="form-grid">
          <label>Reference Body</label>
          <select data-p="AttitudeReferenceBody">
            ${celestialBodies.map(v => `<option${v===(p.AttitudeReferenceBody||'Earth')?' selected':''}>${v}</option>`).join('')}
          </select>
          <label>Constraint Type</label>
          <select data-p="AttitudeConstraintType">
            ${['Velocity','OrbitNormal'].map(v => `<option${v===(p.AttitudeConstraintType||'Velocity')?' selected':''}>${v}</option>`).join('')}
          </select>
          <label>Body Alignment X</label><input type="number" step="any" data-p="BodyAlignmentVectorX" value="${p.BodyAlignmentVectorX ?? 1}">
          <label>Body Alignment Y</label><input type="number" step="any" data-p="BodyAlignmentVectorY" value="${p.BodyAlignmentVectorY ?? 0}">
          <label>Body Alignment Z</label><input type="number" step="any" data-p="BodyAlignmentVectorZ" value="${p.BodyAlignmentVectorZ ?? 0}">
          <label>Body Constraint X</label><input type="number" step="any" data-p="BodyConstraintVectorX" value="${p.BodyConstraintVectorX ?? 0}">
          <label>Body Constraint Y</label><input type="number" step="any" data-p="BodyConstraintVectorY" value="${p.BodyConstraintVectorY ?? 0}">
          <label>Body Constraint Z</label><input type="number" step="any" data-p="BodyConstraintVectorZ" value="${p.BodyConstraintVectorZ ?? 1}">
        </div>
      </div>` : ''}
      ${isCCSDS ? `
      <div class="panel-section"><h3>CCSDS-AEM File</h3>
        <div class="form-grid">
          <label>AEM File</label>
          <div class="file-browse">
            <input type="text" data-p="AEMFileFullPath" value="${p.AEMFileFullPath || ''}">
            <button type="button" data-file-browse="AEMFileFullPath">\uD83D\uDCC2 Browse</button>
          </div>
        </div>
      </div>` : ''}
      ${!isCCSDS ? `
      <div class="panel-section"><h3>Attitude State</h3>
        <div class="form-grid">
          <label>State Type</label>
          <select data-p="AttitudeStateType">
            ${attStateTypes.map(v => `<option${v===attST?' selected':''}>${v}</option>`).join('')}
          </select>
          <label>Rate State Type</label>
          <select data-p="AttitudeRateStateType">
            ${attRateTypes.map(v => `<option${v===(p.AttitudeRateStateType||'EulerAngleRates')?' selected':''}>${v}</option>`).join('')}
          </select>
          ${isEuler ? `<label>Euler Sequence</label>
          <select data-p="EulerSequence">
            ${eulerSeqs.map(v => `<option${v===(p.EulerSequence||'321')?' selected':''}>${v}</option>`).join('')}
          </select>` : ''}
        </div>
      </div>
      <div class="panel-section"><h3>Initial ${isEuler ? 'Euler Angles' : attST}</h3>
        <div class="form-grid">
          ${isEuler ? `
          <label>Euler Angle 1 (deg)</label><input type="number" step="any" data-p="EulerAngle1" value="${p.EulerAngle1 ?? 0}">
          <label>Euler Angle 2 (deg)</label><input type="number" step="any" data-p="EulerAngle2" value="${p.EulerAngle2 ?? 0}">
          <label>Euler Angle 3 (deg)</label><input type="number" step="any" data-p="EulerAngle3" value="${p.EulerAngle3 ?? 0}">
          ` : attST === 'Quaternion' ? `
          <label>Q1</label><input type="number" step="any" data-p="Q1" value="${p.Q1 ?? 0}">
          <label>Q2</label><input type="number" step="any" data-p="Q2" value="${p.Q2 ?? 0}">
          <label>Q3</label><input type="number" step="any" data-p="Q3" value="${p.Q3 ?? 0}">
          <label>Q4</label><input type="number" step="any" data-p="Q4" value="${p.Q4 ?? 1}">
          ` : attST === 'MRPs' ? `
          <label>MRP1</label><input type="number" step="any" data-p="MRP1" value="${p.MRP1 ?? 0}">
          <label>MRP2</label><input type="number" step="any" data-p="MRP2" value="${p.MRP2 ?? 0}">
          <label>MRP3</label><input type="number" step="any" data-p="MRP3" value="${p.MRP3 ?? 0}">
          ` : `
          <label>DCM(1,1)</label><input type="number" step="any" data-p="DCM11" value="${p.DCM11 ?? 1}">
          <label>DCM(1,2)</label><input type="number" step="any" data-p="DCM12" value="${p.DCM12 ?? 0}">
          <label>DCM(1,3)</label><input type="number" step="any" data-p="DCM13" value="${p.DCM13 ?? 0}">
          <label>DCM(2,1)</label><input type="number" step="any" data-p="DCM21" value="${p.DCM21 ?? 0}">
          <label>DCM(2,2)</label><input type="number" step="any" data-p="DCM22" value="${p.DCM22 ?? 1}">
          <label>DCM(2,3)</label><input type="number" step="any" data-p="DCM23" value="${p.DCM23 ?? 0}">
          <label>DCM(3,1)</label><input type="number" step="any" data-p="DCM31" value="${p.DCM31 ?? 0}">
          <label>DCM(3,2)</label><input type="number" step="any" data-p="DCM32" value="${p.DCM32 ?? 0}">
          <label>DCM(3,3)</label><input type="number" step="any" data-p="DCM33" value="${p.DCM33 ?? 1}">
          `}
        </div>
      </div>
      <div class="panel-section"><h3>Attitude Rates</h3>
        <div class="form-grid">
          ${isEuler ? `
          <label>Euler Angle Rate 1 (deg/s)</label><input type="number" step="any" data-p="EulerAngleRate1" value="${p.EulerAngleRate1 ?? 0}">
          <label>Euler Angle Rate 2 (deg/s)</label><input type="number" step="any" data-p="EulerAngleRate2" value="${p.EulerAngleRate2 ?? 0}">
          <label>Euler Angle Rate 3 (deg/s)</label><input type="number" step="any" data-p="EulerAngleRate3" value="${p.EulerAngleRate3 ?? 0}">
          ` : `
          <label>Angular Velocity X (deg/s)</label><input type="number" step="any" data-p="AngularVelocityX" value="${p.AngularVelocityX ?? 0}">
          <label>Angular Velocity Y (deg/s)</label><input type="number" step="any" data-p="AngularVelocityY" value="${p.AngularVelocityY ?? 0}">
          <label>Angular Velocity Z (deg/s)</label><input type="number" step="any" data-p="AngularVelocityZ" value="${p.AngularVelocityZ ?? 0}">
          `}
        </div>
      </div>` : ''}
    </div>`;

    // ── Tab 2: Ballistic/Mass ──
    const spadInterp = ['Bilinear','Bicubic'];
    const ballisticTab = `<div class="body-tab-pane${activeTabIdx===2?' active':''}" data-body-pane="2">
      <div class="panel-section"><h3>Spherical</h3>
        <div class="form-grid">
          <label>Dry Mass (kg)</label><input type="number" step="any" data-p="DryMass" value="${p.DryMass}">
          <label>Coefficient of Drag (Cd)</label><input type="number" step="any" data-p="Cd" value="${p.Cd}">
          <label>Cd Sigma</label><input type="number" step="any" data-p="CdSigma" value="${p.CdSigma ?? 0}">
          <label>Coefficient of Reflectivity (Cr)</label><input type="number" step="any" data-p="Cr" value="${p.Cr}">
          <label>Cr Sigma</label><input type="number" step="any" data-p="CrSigma" value="${p.CrSigma ?? 0}">
          <label>Drag Area (m\u00B2)</label><input type="number" step="any" data-p="DragArea" value="${p.DragArea}">
          <label>SRP Area (m\u00B2)</label><input type="number" step="any" data-p="SRPArea" value="${p.SRPArea}">
          <label>Atmos Density Scale Factor</label><input type="number" step="any" data-p="AtmosDensityScaleFactor" value="${p.AtmosDensityScaleFactor ?? 1}">
          <label>Atmos Density Scale Sigma</label><input type="number" step="any" data-p="AtmosDensityScaleFactorSigma" value="${p.AtmosDensityScaleFactorSigma ?? 0}">
        </div>
      </div>
      <div class="panel-section"><h3>Dry Center of Mass</h3>
        <div class="form-grid">
          <label>CM Offset X (m)</label><input type="number" step="any" data-p="DryCenterOfMassX" value="${p.DryCenterOfMassX ?? 0}">
          <label>CM Offset Y (m)</label><input type="number" step="any" data-p="DryCenterOfMassY" value="${p.DryCenterOfMassY ?? 0}">
          <label>CM Offset Z (m)</label><input type="number" step="any" data-p="DryCenterOfMassZ" value="${p.DryCenterOfMassZ ?? 0}">
        </div>
      </div>
      <div class="panel-section"><h3>Dry Moment of Inertia (kg\u00B7m\u00B2)</h3>
        <div class="form-grid">
          <label>MOI XX</label><input type="number" step="any" data-p="DryMomentOfInertiaXX" value="${p.DryMomentOfInertiaXX ?? 0}">
          <label>MOI XY</label><input type="number" step="any" data-p="DryMomentOfInertiaXY" value="${p.DryMomentOfInertiaXY ?? 0}">
          <label>MOI XZ</label><input type="number" step="any" data-p="DryMomentOfInertiaXZ" value="${p.DryMomentOfInertiaXZ ?? 0}">
          <label>MOI YY</label><input type="number" step="any" data-p="DryMomentOfInertiaYY" value="${p.DryMomentOfInertiaYY ?? 0}">
          <label>MOI YZ</label><input type="number" step="any" data-p="DryMomentOfInertiaYZ" value="${p.DryMomentOfInertiaYZ ?? 0}">
          <label>MOI ZZ</label><input type="number" step="any" data-p="DryMomentOfInertiaZZ" value="${p.DryMomentOfInertiaZZ ?? 0}">
        </div>
      </div>
      <div class="panel-section"><h3>SPAD</h3>
        <div class="form-grid">
          <label>SPAD SRP File</label>
          <div class="file-browse">
            <input type="text" data-p="SPADSRPFile" value="${p.SPADSRPFile || ''}">
            <button type="button" data-file-browse="SPADSRPFile">\uD83D\uDCC2 Choose a File</button>
          </div>
          <label>SPAD SRP Scale Factor</label><input type="number" step="any" data-p="SPADSRPScaleFactor" value="${p.SPADSRPScaleFactor ?? 1}">
          <label>SPAD SRP Scale Sigma</label><input type="number" step="any" data-p="SPADSRPScaleFactorSigma" value="${p.SPADSRPScaleFactorSigma ?? 0}">
          <label>SPAD SRP Interpolation</label>
          <select data-p="SPADSRPInterpolationMethod">
            ${spadInterp.map(v => `<option${v===(p.SPADSRPInterpolationMethod||'Bilinear')?' selected':''}>${v}</option>`).join('')}
          </select>
          <label>SPAD Drag File</label>
          <div class="file-browse">
            <input type="text" data-p="SPADDragFile" value="${p.SPADDragFile || ''}">
            <button type="button" data-file-browse="SPADDragFile">\uD83D\uDCC2 Choose a File</button>
          </div>
          <label>SPAD Drag Scale Factor</label><input type="number" step="any" data-p="SPADDragScaleFactor" value="${p.SPADDragScaleFactor ?? 1}">
          <label>SPAD Drag Scale Sigma</label><input type="number" step="any" data-p="SPADDragScaleFactorSigma" value="${p.SPADDragScaleFactorSigma ?? 0}">
          <label>SPAD Drag Interpolation</label>
          <select data-p="SPADDragInterpolationMethod">
            ${spadInterp.map(v => `<option${v===(p.SPADDragInterpolationMethod||'Bilinear')?' selected':''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>`;

    // ── Tab 3: Tanks ──
    const allTanks = [...store.getAllByType('ChemicalTank').map(o=>o.name), ...store.getAllByType('ElectricTank').map(o=>o.name)];
    const scTanks = p.Tanks || [];
    const tanksTab = `<div class="body-tab-pane${activeTabIdx===3?' active':''}" data-body-pane="3">
      <div class="panel-section"><h3>Tanks</h3>
        <div class="dual-list">
          <div>
            <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Available Tanks</div>
            <div class="dual-list-box" data-sc-tank-avail>
              ${allTanks.filter(n => !scTanks.includes(n)).map(n => `<div class="list-item" data-val="${n}">${n}</div>`).join('')}
            </div>
          </div>
          <div class="dual-list-btns">
            <button data-sc-tank-add-all title="Select All">&rArr;</button>
            <button data-sc-tank-add>&rarr;</button>
            <button data-sc-tank-rem>&larr;</button>
            <button data-sc-tank-rem-all title="Remove All">&lArr;</button>
          </div>
          <div>
            <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Selected Tanks</div>
            <div class="dual-list-box" data-sc-tank-sel>
              ${scTanks.map(n => `<div class="list-item" data-val="${n}">${n}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;

    // ── Tab 4: Power System ──
    const allPower = [...store.getAllByType('SolarPowerSystem').map(o=>o.name), ...store.getAllByType('NuclearPowerSystem').map(o=>o.name)];
    const powerTab = `<div class="body-tab-pane${activeTabIdx===4?' active':''}" data-body-pane="4">
      <div class="panel-section"><h3>Power System</h3>
        <div class="form-grid">
          <label>Power System</label>
          <select data-p="PowerSystem">
            <option value="">None</option>
            ${allPower.map(n => `<option value="${n}"${n===p.PowerSystem?' selected':''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>`;

    // ── Tab 5: SPICE ── (two-column layout matching wxWidgets SpicePanel)
    const spiceTab = `<div class="body-tab-pane${activeTabIdx===5?' active':''}" data-body-pane="5">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div class="panel-section"><h3>NAIF ID</h3>
            <input type="number" data-p="NAIFId" value="${p.NAIFId ?? -10002}" style="width:100%;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-size:12px;font-family:'SF Mono','Fira Code',Consolas,monospace;outline:none;">
          </div>
          <div class="panel-section"><h3>SPK Files</h3>
            <div data-sc-spk-list></div>
          </div>
          <div class="panel-section"><h3>FK Files</h3>
            <div data-sc-fk-list></div>
          </div>
        </div>
        <div>
          <div class="panel-section"><h3>Frame NAIF ID</h3>
            <input type="number" data-p="NAIFIdReferenceFrame" value="${p.NAIFIdReferenceFrame ?? -9002}" style="width:100%;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-size:12px;font-family:'SF Mono','Fira Code',Consolas,monospace;outline:none;">
          </div>
          <div class="panel-section"><h3>CK Files</h3>
            <div data-sc-ck-list></div>
          </div>
          <div class="panel-section"><h3>SCLK Files</h3>
            <div data-sc-sclk-list></div>
          </div>
        </div>
      </div>
    </div>`;

    // ── Tab 6: Actuators ──
    const allThrusters = [...store.getAllByType('ChemicalThruster').map(o=>o.name), ...store.getAllByType('ElectricThruster').map(o=>o.name)];
    const scThrusters = p.Thrusters || [];
    const actuatorsTab = `<div class="body-tab-pane${activeTabIdx===6?' active':''}" data-body-pane="6">
      <div class="panel-section"><h3>Thrusters</h3>
        <div class="dual-list">
          <div>
            <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Available Thrusters</div>
            <div class="dual-list-box" data-sc-thr-avail>
              ${allThrusters.filter(n => !scThrusters.includes(n)).map(n => `<div class="list-item" data-val="${n}">${n}</div>`).join('')}
            </div>
          </div>
          <div class="dual-list-btns">
            <button data-sc-thr-add-all title="Select All">&rArr;</button>
            <button data-sc-thr-add>&rarr;</button>
            <button data-sc-thr-rem>&larr;</button>
            <button data-sc-thr-rem-all title="Remove All">&lArr;</button>
          </div>
          <div>
            <div style="font-size:11px;color:var(--subtext0);margin-bottom:4px">Selected Thrusters</div>
            <div class="dual-list-box" data-sc-thr-sel>
              ${scThrusters.map(n => `<div class="list-item" data-val="${n}">${n}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;

    // ── Tab 7: Visualization ──
    const visTab = `<div class="body-tab-pane${activeTabIdx===7?' active':''}" data-body-pane="7">
      <div class="vis-grid">
        <div class="vis-left">
          <div class="panel-section"><h3>Model</h3>
            <div class="form-grid">
              <label>Model File</label>
              <div class="file-browse">
                <input type="text" data-p="ModelFile" value="${p.ModelFile || 'aura.3ds'}">
                <button type="button" data-file-browse="ModelFile">\uD83D\uDCC2 Browse</button>
              </div>
            </div>
          </div>
          <div class="panel-section"><h3>Model Rotation</h3>
            <div class="slider-row">
              <label>X (deg)</label>
              <span class="slider-min">-180</span>
              <input type="range" min="-180" max="180" step="1" value="${p.ModelRotationX ?? 0}" data-slider="ModelRotationX">
              <span class="slider-max">180</span>
              <input type="number" step="any" data-p="ModelRotationX" value="${p.ModelRotationX ?? 0}">
            </div>
            <div class="slider-row">
              <label>Y (deg)</label>
              <span class="slider-min">-180</span>
              <input type="range" min="-180" max="180" step="1" value="${p.ModelRotationY ?? 0}" data-slider="ModelRotationY">
              <span class="slider-max">180</span>
              <input type="number" step="any" data-p="ModelRotationY" value="${p.ModelRotationY ?? 0}">
            </div>
            <div class="slider-row">
              <label>Z (deg)</label>
              <span class="slider-min">-180</span>
              <input type="range" min="-180" max="180" step="1" value="${p.ModelRotationZ ?? 0}" data-slider="ModelRotationZ">
              <span class="slider-max">180</span>
              <input type="number" step="any" data-p="ModelRotationZ" value="${p.ModelRotationZ ?? 0}">
            </div>
          </div>
          <div class="panel-section"><h3>Model Translation</h3>
            <div class="slider-row">
              <label>X</label>
              <span class="slider-min">-3.5</span>
              <input type="range" min="-3.5" max="3.5" step="0.01" value="${p.ModelOffsetX ?? 0}" data-slider="ModelOffsetX">
              <span class="slider-max">3.5</span>
              <input type="number" step="any" data-p="ModelOffsetX" value="${p.ModelOffsetX ?? 0}">
            </div>
            <div class="slider-row">
              <label>Y</label>
              <span class="slider-min">-3.5</span>
              <input type="range" min="-3.5" max="3.5" step="0.01" value="${p.ModelOffsetY ?? 0}" data-slider="ModelOffsetY">
              <span class="slider-max">3.5</span>
              <input type="number" step="any" data-p="ModelOffsetY" value="${p.ModelOffsetY ?? 0}">
            </div>
            <div class="slider-row">
              <label>Z</label>
              <span class="slider-min">-3.5</span>
              <input type="range" min="-3.5" max="3.5" step="0.01" value="${p.ModelOffsetZ ?? 0}" data-slider="ModelOffsetZ">
              <span class="slider-max">3.5</span>
              <input type="number" step="any" data-p="ModelOffsetZ" value="${p.ModelOffsetZ ?? 0}">
            </div>
          </div>
          <div class="panel-section"><h3>Model Scale</h3>
            <div class="slider-row">
              <label>Scale</label>
              <span class="slider-min">0.001</span>
              <input type="range" min="0" max="1" step="0.001" value="${(() => { const v = p.ModelScale ?? 1; return ((Math.log10(Math.max(0.001,Math.min(1000,v))) - Math.log10(0.001)) / (Math.log10(1000) - Math.log10(0.001))).toFixed(4); })()}" data-slider-log="ModelScale">
              <span class="slider-max">1000</span>
              <input type="number" step="any" data-p="ModelScale" value="${p.ModelScale ?? 1}">
            </div>
          </div>
        </div>
        <div class="vis-right">
          <h3 class="vis-right-heading">Display</h3>
          <div class="model-preview-toolbar">
            <button type="button" data-preview-earth>Show Earth</button>
            <button type="button" data-preview-recenter>Recenter</button>
            <button type="button" data-preview-autoscale>Autoscale</button>
          </div>
          <div class="model-preview-container" data-model-preview></div>
        </div>
      </div>
      <div class="panel-section"><h3>Colors</h3>
        <div style="display:flex;gap:24px;justify-content:center;">
          <div class="color-row">
            <label>Orbit Color</label>
            <input type="color" class="color-swatch" data-p="OrbitColor" value="${p.OrbitColor || '#ff0000'}">
          </div>
          <div class="color-row">
            <label>Target Color</label>
            <input type="color" class="color-swatch" data-p="TargetColor" value="${p.TargetColor || '#008080'}">
          </div>
        </div>
      </div>
    </div>`;

    el.innerHTML = tabBar + orbitTab + attitudeTab + ballisticTab + tanksTab + powerTab + spiceTab + actuatorsTab + visTab;

    // ── Wire sub-tab switching ──
    const btns = el.querySelectorAll('.body-tab-btn');
    const panes = el.querySelectorAll('.body-tab-pane');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        panes.forEach(pp => pp.classList.remove('active'));
        btn.classList.add('active');
        el.querySelector(`[data-body-pane="${btn.dataset.bodyTab}"]`).classList.add('active');
        el.dispatchEvent(new CustomEvent('subtabchange', {
          bubbles: true,
          detail: { tabIndex: parseInt(btn.dataset.bodyTab), panelName: name, panelType: 'Spacecraft' }
        }));
      });
    });

    // ── Bind all data-p inputs ──
    bindInputsToStore(el, store, name);

    // ── File browse buttons (native file picker) ──
    wireFileBrowseButtons(el, store, name);

    // ── Sync range sliders ↔ number inputs bidirectionally ──
    el.querySelectorAll('[data-slider]').forEach(slider => {
      const prop = slider.dataset.slider;
      const numInput = el.querySelector(`input[type="number"][data-p="${prop}"]`);
      if (!numInput) return;
      slider.addEventListener('pointerdown', () => { _sliderDragging = true; });
      slider.addEventListener('pointerup', () => { _sliderDragging = false; });
      slider.addEventListener('input', () => { numInput.value = slider.value; });
      slider.addEventListener('change', () => { numInput.dispatchEvent(new Event('change')); });
      numInput.addEventListener('input', () => { slider.value = numInput.value; });
    });

    // ── Sync logarithmic scale slider ↔ number input ──
    el.querySelectorAll('[data-slider-log]').forEach(slider => {
      const prop = slider.dataset.sliderLog;
      const numInput = el.querySelector(`input[type="number"][data-p="${prop}"]`);
      if (!numInput) return;
      const LOG_MIN = Math.log10(0.001), LOG_MAX = Math.log10(1000), LOG_RANGE = LOG_MAX - LOG_MIN;
      slider.addEventListener('pointerdown', () => { _sliderDragging = true; });
      slider.addEventListener('pointerup', () => { _sliderDragging = false; });
      slider.addEventListener('input', () => {
        const t = parseFloat(slider.value);
        const val = Math.pow(10, LOG_MIN + t * LOG_RANGE);
        numInput.value = parseFloat(val.toPrecision(4));
      });
      slider.addEventListener('change', () => { numInput.dispatchEvent(new Event('change')); });
      numInput.addEventListener('input', () => {
        const v = Math.max(0.001, Math.min(1000, parseFloat(numInput.value) || 1));
        slider.value = ((Math.log10(v) - LOG_MIN) / LOG_RANGE).toFixed(4);
      });
    });

    // ── State type change rebuilds orbit tab ──
    const stSel = el.querySelector('[data-sc-state-type]');
    if (stSel) {
      stSel.addEventListener('change', function() {
        store.setProperty(name, 'DisplayStateType', this.value);
        buildPanel();
      });
    }

    // ── SPICE file lists with Add/Remove ──
    const spkSlot = el.querySelector('[data-sc-spk-list]');
    if (spkSlot) spkSlot.replaceWith(createFileListWidget(p.OrbitSpiceKernelName || []));
    const ckSlot = el.querySelector('[data-sc-ck-list]');
    if (ckSlot) ckSlot.replaceWith(createFileListWidget(p.AttitudeSpiceKernelName || []));
    const sclkSlot = el.querySelector('[data-sc-sclk-list]');
    if (sclkSlot) sclkSlot.replaceWith(createFileListWidget(p.SCClockSpiceKernelName || []));
    const fkSlot = el.querySelector('[data-sc-fk-list]');
    if (fkSlot) fkSlot.replaceWith(createFileListWidget(p.FrameSpiceKernelName || []));

    // ── Dual-list wiring for Tanks (Tab 3) ──
    wireDualList(el, 'data-sc-tank', store, name, 'Tanks');

    // ── Dual-list wiring for Thrusters (Tab 6) ──
    wireDualList(el, 'data-sc-thr', store, name, 'Thrusters');

    // ── 3D Model Preview (Tab 7: Visualization) ──
    if (ModelPreview) {
      const previewContainer = el.querySelector('[data-model-preview]');
      if (previewContainer) {
        const preview = new ModelPreview(previewContainer);
        el._modelPreview = preview;

        // Load default model
        const modelFileInput = el.querySelector('[data-p="ModelFile"]');
        const defaultFile = modelFileInput ? modelFileInput.value : 'aura.3ds';
        if (defaultFile) preview.loadModel(defaultFile);

        // Wire browse button to also load into preview
        const browseBtn = el.querySelector('[data-file-browse="ModelFile"]');
        if (browseBtn) {
          browseBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.3ds';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            fileInput.addEventListener('change', () => {
              if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (modelFileInput) { modelFileInput.value = file.name; modelFileInput.dispatchEvent(new Event('change')); }
                preview.loadModelFromFile(file);
              }
              fileInput.remove();
            });
            fileInput.addEventListener('cancel', () => fileInput.remove());
            fileInput.click();
          }, { capture: true });
        }

        // Helper to read current slider values
        const getNum = (prop) => parseFloat(el.querySelector(`input[type="number"][data-p="${prop}"]`)?.value || 0);

        // Wire rotation sliders
        ['ModelRotationX','ModelRotationY','ModelRotationZ'].forEach(prop => {
          const slider = el.querySelector(`[data-slider="${prop}"]`);
          const num = el.querySelector(`input[type="number"][data-p="${prop}"]`);
          const sync = () => preview.setRotation(getNum('ModelRotationX'), getNum('ModelRotationY'), getNum('ModelRotationZ'));
          if (slider) slider.addEventListener('input', sync);
          if (num) num.addEventListener('input', sync);
        });

        // Wire translation sliders
        ['ModelOffsetX','ModelOffsetY','ModelOffsetZ'].forEach(prop => {
          const slider = el.querySelector(`[data-slider="${prop}"]`);
          const num = el.querySelector(`input[type="number"][data-p="${prop}"]`);
          const sync = () => preview.setTranslation(getNum('ModelOffsetX'), getNum('ModelOffsetY'), getNum('ModelOffsetZ'));
          if (slider) slider.addEventListener('input', sync);
          if (num) num.addEventListener('input', sync);
        });

        // Wire scale slider (logarithmic)
        const scaleSlider = el.querySelector('[data-slider-log="ModelScale"]');
        const scaleNum = el.querySelector('input[type="number"][data-p="ModelScale"]');
        const syncScale = () => preview.setScale(parseFloat(scaleNum?.value || 1));
        if (scaleSlider) scaleSlider.addEventListener('input', () => {
          // scaleNum is already updated by the log slider handler above, use a microtask to read after
          queueMicrotask(syncScale);
        });
        if (scaleNum) scaleNum.addEventListener('input', syncScale);

        // Wire preview toolbar buttons
        const earthBtn = el.querySelector('[data-preview-earth]');
        const recenterBtn = el.querySelector('[data-preview-recenter]');
        const autoscaleBtn = el.querySelector('[data-preview-autoscale]');

        if (earthBtn) {
          earthBtn.addEventListener('click', () => {
            const visible = preview.toggleEarth();
            earthBtn.textContent = visible ? 'Hide Earth' : 'Show Earth';
            earthBtn.classList.toggle('active', visible);
          });
        }

        if (recenterBtn) {
          recenterBtn.addEventListener('click', () => {
            preview.recenter();
            // Update translation sliders/inputs to 0
            ['ModelOffsetX','ModelOffsetY','ModelOffsetZ'].forEach(prop => {
              const slider = el.querySelector(`[data-slider="${prop}"]`);
              const num = el.querySelector(`input[type="number"][data-p="${prop}"]`);
              if (slider) slider.value = 0;
              if (num) { num.value = 0; store.setProperty(name, prop, 0); }
            });
          });
        }

        if (autoscaleBtn) {
          autoscaleBtn.addEventListener('click', () => {
            preview.autoscale();
            // Update scale input to 1
            if (scaleNum) { scaleNum.value = 1; store.setProperty(name, 'ModelScale', 1); }
            // Update scale slider (convert 1 to log slider position)
            if (scaleSlider) {
              const logMin = Math.log10(0.001), logMax = Math.log10(1000);
              scaleSlider.value = ((Math.log10(1) - logMin) / (logMax - logMin)).toFixed(4);
            }
          });
        }

        // Enable/disable controls based on model load state
        const visControls = el.querySelectorAll('[data-body-pane="7"] input[type="range"], [data-body-pane="7"] input[type="number"]');
        const updateControlState = (hasModel) => {
          visControls.forEach(ctrl => ctrl.disabled = !hasModel);
          if (recenterBtn) recenterBtn.disabled = !hasModel;
          if (autoscaleBtn) autoscaleBtn.disabled = !hasModel;
        };
        preview.onModelChange = updateControlState;
        // Initial state - enable if model loaded successfully
        setTimeout(() => updateControlState(preview.hasModel()), 100);
      }
    }
  }

  buildPanel();

  // Rebuild panel when store changes (e.g. new tank/thruster/power system added)
  store.onChange(() => {
    if (el.isConnected) {
      // Dispose existing ModelPreview before rebuilding to prevent WebGL context leak
      if (el._modelPreview) {
        el._modelPreview.dispose();
        el._modelPreview = null;
      }
      buildPanel();
    }
  });

  return el;
}
