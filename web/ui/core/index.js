/**
 * GMAT Web GUI — Module Index
 *
 * This file exports all GUI modules for easy importing.
 */

// Base modules (mirrors src/base/)
export { GmatObjectStore } from '../base/executive/GmatObjectStore.js';
export { GmatWasmRunner } from '../base/executive/GmatWasmRunner.js';
export { DEFAULTS, NAME_PREFIX } from '../base/configs/GmatDefaults.js';
export { GmatScriptGenerator } from '../base/interpreter/GmatScriptGenerator.js';
export { ScriptInterpreter } from '../base/interpreter/ScriptInterpreter.js';
export { GmatOutputParser } from '../base/subscriber/GmatOutputParser.js';

// GUI app modules (mirrors src/gui/app/)
export { GmatRouter } from './app/GmatRouter.js';
export { UITabManager } from './app/UITabManager.js';

// GUI resource modules (mirrors src/gui/resource/)
export { getIcon } from './resource/GmatIcons.js';

// Widget modules
export { TreeView } from './widgets/TreeView.js';
export { ContextMenu } from './widgets/ContextMenu.js';
export { wireDualList, createFileListWidget, bindInputsToStore, wireFileBrowseButtons } from './widgets/PanelHelpers.js';

// Orbit view modules
export { OrbitViewer, ModelPreview } from './orbit/OrbitView.js';

// Output modules
export { ReportViewer } from './output/ReportViewer.js';
export { createReportFilePanel } from './output/ReportFilePanel.js';

// Spacecraft panels
export { createSpacecraftPanel } from './spacecraft/SpacecraftPanel.js';
export { createFormationPanel } from './spacecraft/FormationSetupPanel.js';

// Propagator panel
export { createPropagatorPanel } from './propagator/Propagator.js';

// Burn panels
export { createBurnPanel } from './burn/ImpulsiveBurn.js';
export { createFiniteBurnPanel } from './burn/FiniteBurnSetupPanel.js';

// Solver panels
export { createDiffCorrectorPanel } from './solver/DCSetupPanel.js';
export { createVF13adPanel } from './solver/SQPSetupPanel.js';

// Subscriber panels
export { createXYPlotPanel } from './subscriber/XyPlotSetupPanel.js';
export { createOrbitViewPanel } from './subscriber/OrbitViewPanel.js';
export { createEphemerisFilePanel } from './subscriber/EphemerisFilePanel.js';

// Foundation panels (Variable, Array, String)
export { createVariablePanel } from './foundation/ParameterSetupPanel.js';

// Hardware panels
export { createChemicalTankPanel, createElectricTankPanel } from './hardware/TankConfigPanel.js';
export { createChemicalThrusterPanel, createElectricThrusterPanel } from './hardware/ThrusterConfigPanel.js';
export { createPowerSystemPanel } from './hardware/PowerSystemConfigPanel.js';

// Asset panels
export { createGroundStationPanel } from './asset/GroundStationPanel.js';

// Solar system panels
export { createCelestialBodyPanel, CELESTIAL_BODIES, DEFAULT_COLORS } from './solarsys/CelestialBodyPanel.js';

// Coordinate system panels
export { createPredefinedCoordSysPanel } from './coordsystem/CoordSystemConfigPanel.js';

// Event locator panels
export { createEclipseLocatorPanel, createContactLocatorPanel } from './event/EventLocatorPanel.js';

// Function panels
export { createGmatFunctionPanel } from './function/FunctionSetupPanel.js';

// File interface panels
export { createFileInterfacePanel } from './file/FileInterfacePanel.js';

// App-level modules
export { GmatApp } from './app/GmatApp.js';
export { PanelFactory } from './app/PanelFactory.js';
export { ResourceTreeCtrl } from './app/ResourceTreeCtrl.js';
export { MissionPanelCtrl } from './app/MissionPanelCtrl.js';
export { UIConsole } from './app/UIConsole.js';
