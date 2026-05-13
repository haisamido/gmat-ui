/**
 * PanelFactory.js — Maps object types to their panel creation functions
 *
 * This module provides a centralized registry for creating config panels
 * based on GMAT object types.
 */

import { createSpacecraftPanel } from '../spacecraft/SpacecraftPanel.js';
import { createFormationPanel } from '../spacecraft/FormationSetupPanel.js';
import { createPropagatorPanel } from '../propagator/Propagator.js';
import { createBurnPanel } from '../burn/ImpulsiveBurn.js';
import { createFiniteBurnPanel } from '../burn/FiniteBurnSetupPanel.js';
import { createDiffCorrectorPanel } from '../solver/DCSetupPanel.js';
import { createVF13adPanel } from '../solver/SQPSetupPanel.js';
import { createXYPlotPanel } from '../subscriber/XyPlotSetupPanel.js';
import { createOrbitViewPanel } from '../subscriber/OrbitViewPanel.js';
import { createEphemerisFilePanel } from '../subscriber/EphemerisFilePanel.js';
import { createReportFilePanel } from '../output/ReportFilePanel.js';
import { createVariablePanel } from '../foundation/ParameterSetupPanel.js';
import { createChemicalTankPanel, createElectricTankPanel } from '../hardware/TankConfigPanel.js';
import { createChemicalThrusterPanel, createElectricThrusterPanel } from '../hardware/ThrusterConfigPanel.js';
import { createPowerSystemPanel } from '../hardware/PowerSystemConfigPanel.js';
import { createGroundStationPanel } from '../asset/GroundStationPanel.js';
import { createCelestialBodyPanel } from '../solarsys/CelestialBodyPanel.js';
import { createCoordinateSystemPanel, createPredefinedCoordSysPanel } from '../coordsystem/CoordSystemConfigPanel.js';
import { createEclipseLocatorPanel, createContactLocatorPanel } from '../event/EventLocatorPanel.js';
import { createGmatFunctionPanel } from '../function/FunctionSetupPanel.js';
import { createFileInterfacePanel } from '../file/FileInterfacePanel.js';

/**
 * PanelFactory class - creates config panels for GMAT objects
 */
export class PanelFactory {
  constructor(options = {}) {
    // ModelPreview class for Spacecraft visualization tab (optional dependency)
    this.ModelPreview = options.ModelPreview || null;
  }

  /**
   * Create a config panel for the given object
   * @param {string} objectType - The GMAT object type
   * @param {string} name - The object name
   * @param {GmatObjectStore} store - The object store
   * @returns {HTMLElement|null} - The panel element or null if type not supported
   */
  createPanel(objectType, name, store) {
    switch (objectType) {
      // Spacecraft
      case 'Spacecraft':
        return createSpacecraftPanel(store, name, this.ModelPreview);
      case 'Formation':
        return createFormationPanel(store, name);

      // Propagator
      case 'Propagator':
        return createPropagatorPanel(store, name);

      // Burns
      case 'ImpulsiveBurn':
        return createBurnPanel(store, name);
      case 'FiniteBurn':
        return createFiniteBurnPanel(store, name);

      // Solvers
      case 'DifferentialCorrector':
        return createDiffCorrectorPanel(store, name);
      case 'VF13ad':
        return createVF13adPanel(store, name);

      // Subscribers
      case 'XYPlot':
        return createXYPlotPanel(store, name);
      case 'OrbitView':
        return createOrbitViewPanel(store, name);
      case 'EphemerisFile':
        return createEphemerisFilePanel(store, name);
      case 'ReportFile':
        return createReportFilePanel(store, name);

      // Variables
      case 'Variable':
      case 'Array':
      case 'String':
        return createVariablePanel(store, name);

      // Hardware
      case 'ChemicalTank':
        return createChemicalTankPanel(store, name);
      case 'ElectricTank':
        return createElectricTankPanel(store, name);
      case 'ChemicalThruster':
        return createChemicalThrusterPanel(store, name);
      case 'ElectricThruster':
        return createElectricThrusterPanel(store, name);
      case 'SolarPowerSystem':
      case 'NuclearPowerSystem':
        return createPowerSystemPanel(store, name);

      // Assets
      case 'GroundStation':
        return createGroundStationPanel(store, name);

      // Solar system (read-only celestial body panels)
      case 'CelestialBody':
        return createCelestialBodyPanel(name);

      // Coordinate systems
      case 'CoordinateSystem':
        return createCoordinateSystemPanel(store, name);
      case 'PredefinedCoordSys':
        return createPredefinedCoordSysPanel(name);

      // Event locators
      case 'EclipseLocator':
        return createEclipseLocatorPanel(store, name);
      case 'ContactLocator':
        return createContactLocatorPanel(store, name);

      // Functions
      case 'GmatFunction':
        return createGmatFunctionPanel(store, name);

      // File interfaces
      case 'FileInterface':
        return createFileInterfacePanel(store, name);

      default:
        console.warn(`PanelFactory: No panel creator for type "${objectType}"`);
        return this._createUnknownPanel(objectType, name);
    }
  }

  /**
   * Create a fallback panel for unknown object types
   */
  _createUnknownPanel(objectType, name) {
    const el = document.createElement('div');
    el.className = 'config-panel';
    el.innerHTML = `
      <div class="panel-section">
        <h3>${objectType}: ${name}</h3>
        <p style="color:var(--overlay0);font-size:12px;">
          No configuration panel available for this object type.
        </p>
      </div>`;
    return el;
  }
}
