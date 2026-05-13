/**
 * ScriptInterpreter.js — Parses GMAT script text into store objects
 *
 * Parses Create statements, GMAT property assignments, and mission sequence
 * commands from GMAT script text and populates the GmatObjectStore.
 *
 * C++ reference: src/base/interpreter/ScriptInterpreter.cpp
 */

export class ScriptInterpreter {
  constructor(store) {
    this.store = store;
  }

  /**
   * Interpret a GMAT script and populate the store
   * @param {string} script - The GMAT script text
   * @returns {{success: boolean, errors: string[]}} Interpretation result
   */
  interpret(script) {
    const errors = [];

    // Clear the store before parsing
    this.store.clearAll();

    // Normalize line endings and split into lines
    const lines = script.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    let inMissionSequence = false;
    let currentBlock = null; // For tracking Target/EndTarget, etc.
    const blockStack = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      let line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('%')) continue;

      // Remove inline comments
      const commentIdx = line.indexOf('%');
      if (commentIdx > 0) {
        line = line.substring(0, commentIdx).trim();
      }

      // Remove trailing semicolon for easier parsing
      if (line.endsWith(';')) {
        line = line.slice(0, -1).trim();
      }

      // Skip empty after processing
      if (!line) continue;

      try {
        // Check for BeginMissionSequence
        if (line === 'BeginMissionSequence') {
          inMissionSequence = true;
          continue;
        }

        if (!inMissionSequence) {
          // Parse resource definitions
          if (line.startsWith('Create ')) {
            this._parseCreate(line);
          } else if (line.startsWith('GMAT ')) {
            this._parseGmatAssignment(line);
          }
          // Skip other lines in resource section (like standalone property assignments)
        } else {
          // Parse mission sequence commands
          this._parseMissionCommand(line, blockStack);
        }
      } catch (e) {
        errors.push(`Line ${lineNum}: ${e.message}`);
      }
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * Parse a Create statement
   * @param {string} line - The line starting with "Create "
   * Supports: Create <Type> <Name1> [Name2] [Name3] ...
   * Also supports array syntax: Create Array arr[3,1] arr2[2,2]
   */
  _parseCreate(line) {
    // Create <Type> <Name(s)>
    // Match type followed by one or more names (names can include array brackets)
    const match = line.match(/^Create\s+(\w+)\s+(.+)$/);
    if (!match) {
      throw new Error(`Invalid Create syntax: ${line}`);
    }

    const [, type, namesStr] = match;

    // Store OrbitView config for Three.js visualization (don't skip it)
    // Skip XYPlot, GroundTrackPlot - they don't have web equivalents yet
    const skipTypes = ['XYPlot', 'GroundTrackPlot', 'EphemerisFile'];
    if (skipTypes.includes(type)) {
      return; // Silently skip unsupported subscriber types
    }

    // Parse object names - can be space-separated, may include array dimensions
    // e.g., "SMA ECC INC" or "rv[3,1] vv[3,1]"
    const namePattern = /(\w+)(?:\[[^\]]+\])?/g;
    let nameMatch;
    while ((nameMatch = namePattern.exec(namesStr)) !== null) {
      const name = nameMatch[1]; // Just the name without brackets
      this.store.createObject(type, name);
    }
  }

  /**
   * Parse a GMAT property assignment
   * @param {string} line - The line starting with "GMAT "
   */
  _parseGmatAssignment(line) {
    // GMAT <Object>.<Property> = <Value>
    // or GMAT <Object>.<Property>.<SubProperty> = <Value>
    const match = line.match(/^GMAT\s+(\w+)\.(.+?)\s*=\s*(.+)$/);
    if (!match) {
      throw new Error(`Invalid GMAT assignment: ${line}`);
    }

    const [, objName, propPath, valueStr] = match;

    // Check if object exists
    const obj = this.store.getObject(objName);
    if (!obj) {
      // Object might be a skipped type (OrbitView, etc.) - silently ignore
      return;
    }

    // Parse the value
    const value = this._parseValue(valueStr.trim());

    // Set the property
    // Handle nested properties like GravityField.Earth.Degree
    this.store.setProperty(objName, propPath, value);
  }

  /**
   * Parse a value string into appropriate type
   * @param {string} str - The value string
   * @returns {*} Parsed value
   */
  _parseValue(str) {
    str = str.trim();

    // Array: {item1, item2, ...} or { item1 item2 ... }
    if (str.startsWith('{') && str.endsWith('}')) {
      const inner = str.slice(1, -1).trim();
      if (!inner) return [];

      // Try comma-separated first, then space-separated
      let items;
      if (inner.includes(',')) {
        items = inner.split(',').map(s => s.trim()).filter(s => s);
      } else {
        items = inner.split(/\s+/).filter(s => s);
      }

      return items.map(item => this._parseValue(item));
    }

    // Boolean
    if (str === 'true' || str === 'On') return true;
    if (str === 'false' || str === 'Off') return false;

    // Quoted string
    if ((str.startsWith("'") && str.endsWith("'")) ||
        (str.startsWith('"') && str.endsWith('"'))) {
      return str.slice(1, -1);
    }

    // Number (including scientific notation)
    if (/^-?[\d.]+(?:e[+-]?\d+)?$/i.test(str)) {
      const num = parseFloat(str);
      if (!isNaN(num)) return num;
    }

    // Color name to hex conversion
    const colorMap = {
      'Red': '#ff0000', 'Green': '#008000', 'Yellow': '#ffff00', 'Blue': '#0000ff',
      'Pink': '#ffc0cb', 'Lime': '#00ff00', 'Gold': '#ffd700', 'Navy': '#000080',
      'Purple': '#800080', 'Olive': '#808000', 'Beige': '#f5f5dc', 'Cyan': '#00ffff',
      'Fuchsia': '#ff00ff', 'SeaGreen': '#2e8b57', 'Peru': '#cd853f', 'SlateBlue': '#6a5acd',
      'Orchid': '#da70d6', 'SpringGreen': '#00ff7f', 'Tan': '#d2b48c', 'Turquoise': '#40e0d0',
      'Teal': '#008080', 'LightGray': '#d3d3d3', 'DarkGray': '#a9a9a9', 'DimGray': '#696969',
      'DarkSlateGray': '#2f4f4f', 'Orange': '#ff8c00', 'GoldenRod': '#daa520',
      'White': '#ffffff', 'Black': '#000000', 'Gray': '#808080', 'Silver': '#c0c0c0',
    };
    if (colorMap[str]) return colorMap[str];

    // Otherwise return as string
    return str;
  }

  /**
   * Parse a mission sequence command
   * @param {string} line - The command line
   * @param {Array} blockStack - Stack of nested blocks
   */
  _parseMissionCommand(line, blockStack) {
    // Skip Write commands - they're just console output
    if (line.startsWith('Write ')) return;

    // Skip Report commands for now (they run during execution)
    if (line.startsWith('Report ')) return;

    // Propagate ['Label'] <Propagator>(<Spacecraft>) {<StopCondition>}
    // Label is optional single-quoted string
    const propagateMatch = line.match(/^Propagate\s+(?:'[^']*'\s+)?(\w+)\s*\(\s*([^)]+)\s*\)\s*\{([^}]+)\}/);
    if (propagateMatch) {
      const [, propName, scList, stopCond] = propagateMatch;
      const spacecraft = scList.split(',').map(s => s.trim());

      // Parse stop condition: Spacecraft.Param = Value or just Spacecraft.Param
      const stopMatch = stopCond.match(/^\s*([^=]+?)\s*(?:=\s*(.+))?\s*$/);
      if (stopMatch) {
        const [, param, value] = stopMatch;
        this.store.addCommand({
          type: 'Propagate',
          propagator: propName,
          spacecraft: spacecraft.length === 1 ? spacecraft[0] : spacecraft,
          stopCondition: {
            param: param.trim(),
            value: value ? this._parseValue(value.trim()) : 0
          }
        });
      }
      return;
    }

    // Maneuver ['Label'] <Burn>(<Spacecraft>)
    const maneuverMatch = line.match(/^Maneuver\s+(?:'[^']*'\s+)?(\w+)\s*\(\s*(\w+)\s*\)/);
    if (maneuverMatch) {
      const [, burn, spacecraft] = maneuverMatch;
      this.store.addCommand({
        type: 'Maneuver',
        burn,
        spacecraft
      });
      return;
    }

    // Target ['Label'] <Solver> {options}
    const targetMatch = line.match(/^Target\s+(?:'[^']*'\s+)?(\w+)/);
    if (targetMatch) {
      const [, solver] = targetMatch;
      blockStack.push({ type: 'Target', solver });
      this.store.addCommand({ type: 'Target', solver });
      return;
    }

    // EndTarget
    if (line === 'EndTarget') {
      blockStack.pop();
      this.store.addCommand({ type: 'EndTarget' });
      return;
    }

    // Vary ['Label'] <Solver>(<Variable> = <InitialValue>, {options})
    const varyMatch = line.match(/^Vary\s+(?:'[^']*'\s+)?(\w+)\s*\(\s*([^=]+?)\s*=\s*([^,]+)/);
    if (varyMatch) {
      const [, solver, variable, initialValue] = varyMatch;

      // Parse options if present
      const optionsMatch = line.match(/\{([^}]+)\}/);
      let options = {};
      if (optionsMatch) {
        const optStr = optionsMatch[1];
        const optPairs = optStr.split(',');
        for (const pair of optPairs) {
          const [key, val] = pair.split('=').map(s => s.trim());
          if (key && val !== undefined) {
            options[key] = this._parseValue(val);
          }
        }
      }

      this.store.addCommand({
        type: 'Vary',
        solver,
        variable: variable.trim(),
        initialValue: this._parseValue(initialValue.trim()),
        ...options
      });
      return;
    }

    // Achieve ['Label'] <Solver>(<Goal> = <Value>, {options})
    const achieveMatch = line.match(/^Achieve\s+(?:'[^']*'\s+)?(\w+)\s*\(\s*([^=]+?)\s*=\s*([^,)]+)/);
    if (achieveMatch) {
      const [, solver, goal, value] = achieveMatch;

      // Parse tolerance if present
      const tolMatch = line.match(/Tolerance\s*=\s*([^,}]+)/);
      const tolerance = tolMatch ? this._parseValue(tolMatch[1].trim()) : 0.1;

      this.store.addCommand({
        type: 'Achieve',
        solver,
        goal: goal.trim(),
        value: this._parseValue(value.trim()),
        tolerance
      });
      return;
    }

    // BeginFiniteBurn ['Label'] <Burn>(<Spacecraft>)
    const beginBurnMatch = line.match(/^BeginFiniteBurn\s+(?:'[^']*'\s+)?(\w+)\s*\(\s*(\w+)\s*\)/);
    if (beginBurnMatch) {
      const [, burn, spacecraft] = beginBurnMatch;
      this.store.addCommand({ type: 'BeginFiniteBurn', burn, spacecraft });
      return;
    }

    // EndFiniteBurn ['Label'] <Burn>(<Spacecraft>)
    const endBurnMatch = line.match(/^EndFiniteBurn\s+(?:'[^']*'\s+)?(\w+)\s*\(\s*(\w+)\s*\)/);
    if (endBurnMatch) {
      const [, burn, spacecraft] = endBurnMatch;
      this.store.addCommand({ type: 'EndFiniteBurn', burn, spacecraft });
      return;
    }

    // Optimize ['Label'] <Solver>
    const optimizeMatch = line.match(/^Optimize\s+(?:'[^']*'\s+)?(\w+)/);
    if (optimizeMatch) {
      const [, solver] = optimizeMatch;
      blockStack.push({ type: 'Optimize', solver });
      this.store.addCommand({ type: 'Optimize', solver });
      return;
    }

    // EndOptimize
    if (line === 'EndOptimize') {
      blockStack.pop();
      this.store.addCommand({ type: 'EndOptimize' });
      return;
    }

    // If <Condition>
    const ifMatch = line.match(/^If\s+(.+)$/);
    if (ifMatch) {
      const [, condition] = ifMatch;
      blockStack.push({ type: 'If' });
      this.store.addCommand({ type: 'If', condition });
      return;
    }

    // Else
    if (line === 'Else') {
      this.store.addCommand({ type: 'Else' });
      return;
    }

    // EndIf
    if (line === 'EndIf') {
      blockStack.pop();
      this.store.addCommand({ type: 'EndIf' });
      return;
    }

    // For <Var> = <Start>:<Step>:<End> or <Start>:<End>
    const forMatch = line.match(/^For\s+(\w+)\s*=\s*([^:]+):([^:]+)(?::(.+))?$/);
    if (forMatch) {
      const [, variable, start, stepOrEnd, maybeEnd] = forMatch;
      blockStack.push({ type: 'For' });
      if (maybeEnd !== undefined) {
        this.store.addCommand({
          type: 'For',
          variable,
          start: this._parseValue(start.trim()),
          step: this._parseValue(stepOrEnd.trim()),
          end: this._parseValue(maybeEnd.trim())
        });
      } else {
        this.store.addCommand({
          type: 'For',
          variable,
          start: this._parseValue(start.trim()),
          step: 1,
          end: this._parseValue(stepOrEnd.trim())
        });
      }
      return;
    }

    // EndFor
    if (line === 'EndFor') {
      blockStack.pop();
      this.store.addCommand({ type: 'EndFor' });
      return;
    }

    // While <Condition>
    const whileMatch = line.match(/^While\s+(.+)$/);
    if (whileMatch) {
      const [, condition] = whileMatch;
      blockStack.push({ type: 'While' });
      this.store.addCommand({ type: 'While', condition });
      return;
    }

    // EndWhile
    if (line === 'EndWhile') {
      blockStack.pop();
      this.store.addCommand({ type: 'EndWhile' });
      return;
    }

    // Stop
    if (line === 'Stop') {
      this.store.addCommand({ type: 'Stop' });
      return;
    }

    // Toggle <Subscriber> <On|Off>
    const toggleMatch = line.match(/^Toggle\s+(\w+)\s+(On|Off)$/i);
    if (toggleMatch) {
      const [, subscriber, state] = toggleMatch;
      this.store.addCommand({ type: 'Toggle', subscriber, state });
      return;
    }

    // PenUp/PenDown/MarkPoint/ClearPlot <Subscriber>
    for (const cmd of ['PenUp', 'PenDown', 'MarkPoint', 'ClearPlot']) {
      const regex = new RegExp(`^${cmd}\\s+(\\w+)$`);
      const match = line.match(regex);
      if (match) {
        this.store.addCommand({ type: cmd, subscriber: match[1] });
        return;
      }
    }

    // GMAT assignment in mission sequence (e.g., GMAT var = expression)
    if (line.startsWith('GMAT ')) {
      const assignMatch = line.match(/^GMAT\s+(.+?)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, lhs, rhs] = assignMatch;
        this.store.addCommand({ type: 'Assignment', lhs, rhs });
        return;
      }
    }

    // Unknown command - could log but don't throw
    // console.warn(`Unknown mission command: ${line}`);
  }
}
