/**
 * GmatObjectStore.js — Central data model for GMAT Web GUI
 *
 * Manages all GMAT objects (Spacecraft, Propagators, Burns, etc.) and the
 * mission sequence. Provides create/read/update/delete operations with
 * change notification support.
 *
 * C++ reference: src/base/executive/Moderator.cpp
 *                src/base/executive/Sandbox.cpp
 */
import { DEFAULTS, NAME_PREFIX } from '../configs/GmatDefaults.js';

export class GmatObjectStore {
  constructor() {
    this.objects = new Map();
    this.missionSequence = [];
    this.scripts = new Map();  // Map of script name -> { content, sourcePath }
    this._listeners = new Set();
    this._nextId = 1;
    this._scColorIdx = 0;
    this._notificationsPaused = false;
  }

  static ORBIT_COLORS = [
    '#ff0000','#008000','#ffff00','#0000ff','#ffc0cb',
    '#00ff00','#ffd700','#000080','#800080','#808000',
    '#f5f5dc','#00ffff','#ff00ff','#2e8b57','#cd853f',
    '#6a5acd','#da70d6','#00ff7f','#d2b48c','#40e0d0',
  ];

  static TARGET_COLORS = [
    '#008080','#d3d3d3','#a9a9a9','#696969','#2f4f4f',
    '#d3d3d3','#a9a9a9','#696969','#2f4f4f','#d3d3d3',
    '#a9a9a9','#696969','#2f4f4f','#d3d3d3','#a9a9a9',
    '#696969','#2f4f4f','#d3d3d3','#a9a9a9','#696969',
  ];

  /**
   * Validate a GMAT object name
   * GMAT names must start with a letter and contain only letters, numbers, and underscores
   * @param {string} name - The name to validate
   * @returns {{valid: boolean, error?: string}} Validation result with optional error message
   */
  static isValidName(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Name cannot be empty' };
    }
    if (name.length === 0) {
      return { valid: false, error: 'Name cannot be empty' };
    }
    if (!/^[A-Za-z]/.test(name)) {
      return { valid: false, error: 'Name must start with a letter' };
    }
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      return { valid: false, error: 'Name can only contain letters, numbers, and underscores (no hyphens or spaces)' };
    }
    return { valid: true };
  }

  createObject(type, name) {
    const obj = { id: this._nextId++, type, name, properties: {} };
    const defaults = GmatObjectStore.DEFAULTS[type];
    if (defaults) obj.properties = structuredClone(defaults);
    if (type === 'Spacecraft') {
      const idx = this._scColorIdx % 20;
      obj.properties.OrbitColor = GmatObjectStore.ORBIT_COLORS[idx];
      obj.properties.TargetColor = GmatObjectStore.TARGET_COLORS[idx];
      // Vary RAAN by 45° for each spacecraft so orbits don't overlap visually
      obj.properties.RAAN = (306.6148021947984 + idx * 45) % 360;
      this._scColorIdx++;
    }
    this.objects.set(name, obj);
    this._notify('create', obj);
    return obj;
  }

  getObject(name) { return this.objects.get(name); }

  getAllByType(type) {
    return [...this.objects.values()].filter(o => o.type === type);
  }

  deleteObject(name) {
    const obj = this.objects.get(name);
    if (!obj) return;
    if (obj.type === 'ForceModel') return;

    this.objects.delete(name);

    if (obj.type === 'Propagator') {
      const fmName = obj.properties.FM;
      if (fmName && this.objects.has(fmName)) {
        const fm = this.objects.get(fmName);
        this.objects.delete(fmName);
        this._notify('delete', fm);
      }
      this.missionSequence = this.missionSequence.filter(cmd => {
        return !(cmd.type === 'Propagate' && cmd.propagator === name);
      });
    }

    if (obj.type === 'Spacecraft') {
      for (const cmd of this.missionSequence) {
        if (cmd.type === 'Propagate' && cmd.spacecraft) {
          if (Array.isArray(cmd.spacecraft)) {
            cmd.spacecraft = cmd.spacecraft.filter(sc => sc !== name);
          } else if (cmd.spacecraft === name) {
            cmd.spacecraft = [];
          }
        }
        if (cmd.stopCondition?.param?.startsWith(name + '.')) {
          const remaining = Array.isArray(cmd.spacecraft) && cmd.spacecraft.length > 0 ? cmd.spacecraft[0] : null;
          if (remaining) {
            cmd.stopCondition.param = remaining + cmd.stopCondition.param.slice(name.length);
          }
        }
      }
      this.missionSequence = this.missionSequence.filter(cmd => {
        if (cmd.type === 'Propagate') {
          const sc = cmd.spacecraft;
          return Array.isArray(sc) ? sc.length > 0 : (sc && sc.length > 0);
        }
        if (cmd.type === 'Maneuver' && cmd.spacecraft === name) return false;
        if ((cmd.type === 'BeginFiniteBurn' || cmd.type === 'EndFiniteBurn') && cmd.spacecraft === name) return false;
        return true;
      });
      for (const rpt of this.getAllByType('ReportFile')) {
        const add = rpt.properties.Add || [];
        rpt.properties.Add = add.filter(p => !p.startsWith(name + '.'));
      }
    }

    if (obj.type === 'ImpulsiveBurn') {
      this.missionSequence = this.missionSequence.filter(cmd => {
        return !(cmd.type === 'Maneuver' && cmd.burn === name);
      });
    }

    if (obj.type === 'FiniteBurn') {
      this.missionSequence = this.missionSequence.filter(cmd => {
        return !((cmd.type === 'BeginFiniteBurn' || cmd.type === 'EndFiniteBurn') && cmd.burn === name);
      });
    }

    this._notify('delete', obj);
  }

  renameObject(oldName, newName) {
    const obj = this.objects.get(oldName);
    if (!obj) return { success: false, error: 'Object not found' };
    if (this.objects.has(newName)) return { success: false, error: 'An object with that name already exists' };
    const validation = GmatObjectStore.isValidName(newName);
    if (!validation.valid) return { success: false, error: validation.error };
    this.objects.delete(oldName);
    obj.name = newName;
    this.objects.set(newName, obj);

    const oldPattern = new RegExp(`\\b${oldName}\\b`, 'g');

    for (const cmd of this.missionSequence) {
      for (const key of Object.keys(cmd)) {
        if (cmd[key] === oldName) {
          cmd[key] = newName;
        } else if (Array.isArray(cmd[key])) {
          cmd[key] = cmd[key].map(v => v === oldName ? newName : (typeof v === 'string' ? v.replace(oldPattern, newName) : v));
        } else if (typeof cmd[key] === 'string' && cmd[key].includes(oldName)) {
          // Handle string fields that contain object names (conditions, expressions, etc.)
          cmd[key] = cmd[key].replace(oldPattern, newName);
        }
      }
      if (cmd.stopCondition?.param) {
        cmd.stopCondition.param = cmd.stopCondition.param.replace(oldPattern, newName);
      }
    }

    for (const [, other] of this.objects) {
      for (const [key, val] of Object.entries(other.properties)) {
        if (val === oldName) {
          other.properties[key] = newName;
        } else if (Array.isArray(val)) {
          other.properties[key] = val.map(v => typeof v === 'string' ? v.replace(oldPattern, newName) : v);
        } else if (typeof val === 'string' && val.includes(oldName)) {
          other.properties[key] = val.replace(oldPattern, newName);
        }
      }
    }
    this._notify('rename', obj);
    return { success: true };
  }

  cloneObject(name) {
    const obj = this.objects.get(name);
    if (!obj) return null;

    const cloneSingle = (srcName) => {
      const src = this.objects.get(srcName);
      if (!src) return null;
      let n = 2;
      while (this.objects.has(srcName + n)) n++;
      const newName = srcName + n;
      const cloned = this.createObject(src.type, newName);
      cloned.properties = structuredClone(src.properties);
      return { oldName: srcName, newName, obj: cloned };
    };

    if (obj.type === 'Spacecraft') {
      const tankMap = new Map();
      const thrusterMap = new Map();

      for (const tankName of (obj.properties.Tanks || [])) {
        const result = cloneSingle(tankName);
        if (result) tankMap.set(result.oldName, result.newName);
      }

      for (const thrusterName of (obj.properties.Thrusters || [])) {
        const result = cloneSingle(thrusterName);
        if (result) {
          thrusterMap.set(result.oldName, result.newName);
          // Update Tank reference (can be string or array)
          const tankProp = result.obj.properties.Tank;
          if (Array.isArray(tankProp)) {
            result.obj.properties.Tank = tankProp.map(t => tankMap.get(t) || t);
          } else if (tankProp && tankMap.has(tankProp)) {
            result.obj.properties.Tank = tankMap.get(tankProp);
          }
        }
      }

      // Clone FiniteBurn objects that use this spacecraft's thrusters
      const finBurnMap = new Map();
      for (const fb of this.getAllByType('FiniteBurn')) {
        const fbThrusters = fb.properties.Thrusters || [];
        // Check if any of this spacecraft's thrusters are in this FiniteBurn
        const usesOurThrusters = fbThrusters.some(t => thrusterMap.has(t));
        if (usesOurThrusters) {
          const result = cloneSingle(fb.name);
          if (result) {
            finBurnMap.set(result.oldName, result.newName);
            // Update cloned FiniteBurn to use cloned thrusters
            result.obj.properties.Thrusters = fbThrusters.map(t => thrusterMap.get(t) || t);
          }
        }
      }

      // Identify ImpulsiveBurns used with this spacecraft (from Maneuver commands)
      const impBurnMap = new Map();
      for (const cmd of this.missionSequence) {
        if (cmd.type === 'Maneuver' && cmd.spacecraft === name && cmd.burn) {
          const burnObj = this.objects.get(cmd.burn);
          if (burnObj && burnObj.type === 'ImpulsiveBurn' && !impBurnMap.has(cmd.burn)) {
            const result = cloneSingle(cmd.burn);
            if (result) {
              impBurnMap.set(result.oldName, result.newName);
            }
          }
        }
      }

      // Identify Solvers used in Target blocks that involve this spacecraft
      const solverMap = new Map();
      let inTargetBlock = false;
      let currentSolver = null;
      let targetInvolvesSpacecraft = false;
      for (const cmd of this.missionSequence) {
        if (cmd.type === 'Target') {
          inTargetBlock = true;
          currentSolver = cmd.solver;
          targetInvolvesSpacecraft = false;
        } else if (cmd.type === 'EndTarget') {
          if (targetInvolvesSpacecraft && currentSolver && !solverMap.has(currentSolver)) {
            const result = cloneSingle(currentSolver);
            if (result) {
              solverMap.set(result.oldName, result.newName);
            }
          }
          inTargetBlock = false;
          currentSolver = null;
        } else if (inTargetBlock) {
          if (cmd.spacecraft === name) targetInvolvesSpacecraft = true;
          if (cmd.variable && cmd.variable.includes(name + '.')) targetInvolvesSpacecraft = true;
          if (cmd.goal && cmd.goal.includes(name + '.')) targetInvolvesSpacecraft = true;
        }
      }

      let newPowerSystem = '';
      if (obj.properties.PowerSystem && this.objects.has(obj.properties.PowerSystem)) {
        const result = cloneSingle(obj.properties.PowerSystem);
        if (result) newPowerSystem = result.newName;
      }

      let n = 2;
      while (this.objects.has(name + n)) n++;
      const clone = this.createObject(obj.type, name + n);
      clone.properties = structuredClone(obj.properties);
      clone.properties.Tanks = (obj.properties.Tanks || []).map(t => tankMap.get(t) || t);
      clone.properties.Thrusters = (obj.properties.Thrusters || []).map(t => thrusterMap.get(t) || t);
      if (newPowerSystem) clone.properties.PowerSystem = newPowerSystem;

      this._notify('update', clone);

      const cloneName = clone.name;
      for (const rpt of this.getAllByType('ReportFile')) {
        const add = rpt.properties.Add || [];
        const newEntries = add.filter(p => p.startsWith(name + '.')).map(p => cloneName + p.slice(name.length));
        if (newEntries.length > 0) {
          rpt.properties.Add = [...add, ...newEntries];
          this._notify('update', rpt);
        }
      }

      // Helper to replace spacecraft name in strings (e.g., "DefaultSC.Earth.RMAG" -> "DefaultSC2.Earth.RMAG")
      const replaceScName = (str) => {
        if (!str || typeof str !== 'string') return str;
        const pattern = new RegExp(`\\b${name}\\b`, 'g');
        return str.replace(pattern, cloneName);
      };

      // Helper to replace burn names
      const replaceBurn = (burnName) => {
        return impBurnMap.get(burnName) || finBurnMap.get(burnName) || burnName;
      };

      // Clone mission sequence commands for the cloned spacecraft
      const newMissionSequence = [];
      inTargetBlock = false;
      currentSolver = null;
      let clonedSolver = null;
      let targetBlockCommands = [];

      for (const cmd of this.missionSequence) {
        // Always add original command
        newMissionSequence.push(cmd);

        if (cmd.type === 'Target') {
          inTargetBlock = true;
          currentSolver = cmd.solver;
          clonedSolver = solverMap.get(cmd.solver) || null;
          targetBlockCommands = [];
          if (clonedSolver) {
            targetBlockCommands.push({ type: 'Target', solver: clonedSolver });
          }
        } else if (cmd.type === 'EndTarget') {
          if (clonedSolver && targetBlockCommands.length > 0) {
            targetBlockCommands.push({ type: 'EndTarget' });
            // Insert cloned Target block after original EndTarget
            newMissionSequence.push(...targetBlockCommands);
          }
          inTargetBlock = false;
          currentSolver = null;
          clonedSolver = null;
          targetBlockCommands = [];
        } else if (inTargetBlock && clonedSolver) {
          // Clone commands inside Target block for the cloned spacecraft
          if (cmd.type === 'Vary') {
            // Replace burn or spacecraft references in variable (e.g., "TOI.Element1" -> "TOI2.Element1")
            let newVariable = cmd.variable;
            if (newVariable) {
              const varParts = newVariable.split('.');
              if (varParts.length >= 1) {
                const objName = varParts[0];
                if (impBurnMap.has(objName)) {
                  newVariable = impBurnMap.get(objName) + '.' + varParts.slice(1).join('.');
                } else {
                  newVariable = replaceScName(newVariable);
                }
              }
            }
            targetBlockCommands.push({
              type: 'Vary',
              solver: clonedSolver,
              variable: newVariable,
              initialValue: cmd.initialValue,
              perturbation: cmd.perturbation,
              lower: cmd.lower,
              upper: cmd.upper,
              maxStep: cmd.maxStep
            });
          } else if (cmd.type === 'Achieve') {
            targetBlockCommands.push({
              type: 'Achieve',
              solver: clonedSolver,
              goal: replaceScName(cmd.goal),
              value: cmd.value,
              tolerance: cmd.tolerance
            });
          } else if (cmd.type === 'Maneuver' && cmd.spacecraft === name) {
            targetBlockCommands.push({
              type: 'Maneuver',
              burn: replaceBurn(cmd.burn),
              spacecraft: cloneName
            });
          } else if (cmd.type === 'Propagate') {
            // Propagate inside Target block - add cloned spacecraft
            const scList = Array.isArray(cmd.spacecraft) ? cmd.spacecraft : [cmd.spacecraft];
            if (scList.includes(name)) {
              targetBlockCommands.push({
                type: 'Propagate',
                propagator: cmd.propagator,
                spacecraft: cloneName,
                stopCondition: {
                  param: replaceScName(cmd.stopCondition?.param),
                  value: cmd.stopCondition?.value
                }
              });
            }
          }
        } else if (!inTargetBlock) {
          // Outside Target blocks
          if (cmd.type === 'BeginFiniteBurn' && cmd.spacecraft === name && finBurnMap.has(cmd.burn)) {
            newMissionSequence.push({
              type: 'BeginFiniteBurn',
              burn: finBurnMap.get(cmd.burn),
              spacecraft: cloneName
            });
          } else if (cmd.type === 'EndFiniteBurn' && cmd.spacecraft === name && finBurnMap.has(cmd.burn)) {
            newMissionSequence.push({
              type: 'EndFiniteBurn',
              burn: finBurnMap.get(cmd.burn),
              spacecraft: cloneName
            });
          } else if (cmd.type === 'Maneuver' && cmd.spacecraft === name && impBurnMap.has(cmd.burn)) {
            newMissionSequence.push({
              type: 'Maneuver',
              burn: impBurnMap.get(cmd.burn),
              spacecraft: cloneName
            });
          } else if (cmd.type === 'Propagate') {
            // Add cloned spacecraft to Propagate commands (modify in place)
            const scList = Array.isArray(cmd.spacecraft) ? cmd.spacecraft : [cmd.spacecraft];
            if (scList.includes(name) && !scList.includes(cloneName)) {
              cmd.spacecraft = [...scList, cloneName];
            }
          }
        }
      }

      this.missionSequence = newMissionSequence;
      this._notify('mission', null);

      return clone;
    }

    let n = 2;
    while (this.objects.has(name + n)) n++;
    const clone = this.createObject(obj.type, name + n);
    clone.properties = structuredClone(obj.properties);
    return clone;
  }

  setProperty(name, prop, value) {
    const obj = this.objects.get(name);
    if (obj) {
      obj.properties[prop] = value;
      this._notify('update', obj);
    }
  }

  addCommand(cmd) {
    this.missionSequence.push(cmd);
    this._notify('mission', null);
  }

  removeCommand(index) {
    this.missionSequence.splice(index, 1);
    this._notify('mission', null);
  }

  clearAll() {
    this.objects.clear();
    this.missionSequence = [];
    this.scripts.clear();
    this._nextId = 1;
    this._notify('clear', null);
  }

  // Script management methods
  addScript(name, content = '', sourcePath = null) {
    this.scripts.set(name, { content, sourcePath });
    this._notify('script', { action: 'add', name });
    return { name, content, sourcePath };
  }

  getScript(name) {
    return this.scripts.get(name);
  }

  getAllScripts() {
    return [...this.scripts.entries()].map(([name, data]) => ({ name, ...data }));
  }

  updateScript(name, content) {
    const script = this.scripts.get(name);
    if (script) {
      script.content = content;
      this._notify('script', { action: 'update', name });
    }
  }

  deleteScript(name) {
    if (this.scripts.has(name)) {
      this.scripts.delete(name);
      this._notify('script', { action: 'delete', name });
    }
  }

  renameScript(oldName, newName) {
    if (!this.scripts.has(oldName)) return { success: false, error: 'Script not found' };
    if (this.scripts.has(newName)) return { success: false, error: 'A script with that name already exists' };
    const script = this.scripts.get(oldName);
    this.scripts.delete(oldName);
    this.scripts.set(newName, script);
    this._notify('script', { action: 'rename', oldName, newName });
    return { success: true };
  }

  onChange(cb) { this._listeners.add(cb); }

  pauseNotifications() { this._notificationsPaused = true; }

  resumeNotifications() { this._notificationsPaused = false; }

  _notify(action, obj) {
    if (this._notificationsPaused) return;
    this._listeners.forEach(cb => cb(action, obj));
  }
}

// Assign defaults from separate file (matches monolithic pattern)
GmatObjectStore.DEFAULTS = DEFAULTS;
GmatObjectStore.NAME_PREFIX = NAME_PREFIX;
