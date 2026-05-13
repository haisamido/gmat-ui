/**
 * WasmScriptPreprocessor.js — Strips unsupported object types from GMAT scripts
 *
 * The WASM console build disables many plugins and the GUI. Scripts that
 * reference disabled object types (e.g. OpenFramesInterface, GroundStation)
 * will fail at parse time. This preprocessor removes those objects and all
 * lines that reference them so the rest of the script can run.
 *
 * Usage:
 *   import { preprocessScript } from './WasmScriptPreprocessor.js';
 *   const { script, removed } = preprocessScript(rawScript);
 */

// Object types unavailable in the WASM console build.
// Organized by the build flag that disables them.
const UNSUPPORTED_TYPES = new Set([
  // GUI-only (GMAT_INCLUDE_GUI=OFF)
  'OpenFramesInterface',
  'OpenFramesView',
  'OpenFramesVector',

  // PLUGIN_DATAINTERFACE=OFF
  'FileInterface',

  // PLUGIN_DATACALLBACK=OFF
  'DataCallback',

  // PLUGIN_EKF=OFF
  'ExtendedKalmanFilter',

  // PLUGIN_ESTIMATION=OFF
  'Simulator',
  'BatchEstimator',
  'BatchEstimatorInv',
  'BatchEstimatorSVD',
  'AcceptFilter',
  'RejectFilter',
  'Antenna',
  'Transmitter',
  'Receiver',
  'Transponder',
  'TrackingFileSet',
  'ErrorModel',

  // PLUGIN_EVENTLOCATOR=OFF
  'EclipseLocator',
  'ContactLocator',
  'IntrusionLocator',
  'CustomFOV',
  'ConicalFOV',
  'RectangularFOV',

  // PLUGIN_EXTERNALFORCEMODEL=OFF
  'ExternalModel',

  // PLUGIN_FMINCONOPTIMIZER=OFF
  'FminconOptimizer',

  // PLUGIN_FORMATION=OFF
  'Formation',

  // PLUGIN_GEOMETRICMEASUREMENT=OFF
  'GeometricRange',
  'GeometricRangeRate',
  'GeometricAzEl',
  'GeometricRADec',

  // PLUGIN_GMATFUNCTION=OFF
  'GmatFunction',

  // PLUGIN_MATLABINTERFACE=OFF
  'MatlabFunction',
  'MatlabWorkspace',

  // PLUGIN_POLYHEDRONGRAVITY=OFF
  'PolyhedronGravityModel',

  // PLUGIN_STATION=OFF
  'GroundStation',

  // PLUGIN_THRUSTFILE=OFF
  'ThrustHistoryFile',
  'ThrustSegment',

  // PLUGIN_YUKONOPTIMIZER=OFF
  'Yukon',
]);

// Mission sequence commands from disabled plugins
const UNSUPPORTED_COMMANDS = new Set([
  'Save',              // PLUGIN_SAVECOMMAND
  'CommandEcho',       // PLUGIN_SCRIPTTOOLS
  'RunEstimator',      // PLUGIN_ESTIMATION
  'RunSimulator',      // PLUGIN_ESTIMATION
  'BeginFileThrust',   // PLUGIN_THRUSTFILE
  'EndFileThrust',     // PLUGIN_THRUSTFILE
  'CallMatlabFunction',// PLUGIN_MATLABINTERFACE
  'CallPythonFunction',// PLUGIN_PYTHONINTERFACE
]);

/**
 * Preprocess a GMAT script for the WASM console build.
 *
 * Two-pass approach:
 *   1. Scan for `Create <UnsupportedType> <Name>` and collect the names.
 *   2. Remove lines that create, configure, or reference those names,
 *      plus standalone unsupported commands.
 *
 * @param {string} script - Raw GMAT script text
 * @returns {{ script: string, removed: string[] }} Cleaned script and list of removed object descriptions
 */
export function preprocessScript(script) {
  const lines = script.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const removed = [];            // Human-readable descriptions of what was removed
  const removedNames = new Set(); // Object names to strip

  // --- Pass 1: find unsupported Create statements and collect names ---
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('%') || !trimmed) continue;

    const match = trimmed.match(/^Create\s+(\w+)\s+(.+?)(?:\s*;)?$/);
    if (match) {
      const [, type, namesStr] = match;
      if (UNSUPPORTED_TYPES.has(type)) {
        // Collect all object names from this Create line
        const namePattern = /(\w+)(?:\[[^\]]+\])?/g;
        let nameMatch;
        while ((nameMatch = namePattern.exec(namesStr)) !== null) {
          removedNames.add(nameMatch[1]);
        }
        removed.push(`${type}: ${namesStr.replace(/;$/, '').trim()}`);
      }
    }
  }

  if (removedNames.size === 0 && !lines.some(l => {
    const t = l.trim();
    for (const cmd of UNSUPPORTED_COMMANDS) {
      if (t.startsWith(cmd + ' ') || t === cmd || t === cmd + ';') return true;
    }
    return false;
  })) {
    // Nothing to strip
    return { script, removed: [] };
  }

  // --- Pass 2: filter out lines referencing removed objects ---
  const kept = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Always keep empty lines and comments
    if (!trimmed || trimmed.startsWith('%')) {
      kept.push(line);
      continue;
    }

    // Strip the trailing semicolon for matching, but keep the original line
    const bare = trimmed.endsWith(';') ? trimmed.slice(0, -1).trim() : trimmed;

    // 1. Remove Create lines for unsupported types
    const createMatch = bare.match(/^Create\s+(\w+)\s+/);
    if (createMatch && UNSUPPORTED_TYPES.has(createMatch[1])) {
      continue;
    }

    // 2. Remove property assignments for removed objects: Name.Prop = ...
    const propMatch = bare.match(/^(?:GMAT\s+)?(\w+)\./);
    if (propMatch && removedNames.has(propMatch[1])) {
      continue;
    }

    // 3. Remove Toggle/PenUp/PenDown/MarkPoint/ClearPlot referencing removed objects
    const subscriberCmdMatch = bare.match(/^(?:Toggle|PenUp|PenDown|MarkPoint|ClearPlot)\s+(?:'[^']*'\s+)?(.+)/);
    if (subscriberCmdMatch) {
      // The rest of the line has object names (and maybe On/Off at the end)
      const args = subscriberCmdMatch[1].split(/\s+/).filter(a => a !== 'On' && a !== 'Off');
      // If ALL referenced objects are removed, strip the entire line
      // If some remain, keep the line (GMAT will handle it)
      if (args.length > 0 && args.every(a => removedNames.has(a))) {
        continue;
      }
    }

    // 4. Remove standalone unsupported commands
    const cmdMatch = bare.match(/^(\w+)(?:\s|$)/);
    if (cmdMatch && UNSUPPORTED_COMMANDS.has(cmdMatch[1])) {
      continue;
    }

    kept.push(line);
  }

  return { script: kept.join('\n'), removed };
}
