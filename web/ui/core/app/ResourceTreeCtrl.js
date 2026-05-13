/**
 * ResourceTreeCtrl.js — Resource Tree controller
 *
 * C++ reference: src/gui/app/ResourceTree.cpp
 */

import { TreeView } from '../widgets/TreeView.js';
import { ContextMenu } from '../widgets/ContextMenu.js';
import { NAME_PREFIX } from '../../base/configs/GmatDefaults.js';

export class ResourceTreeCtrl {
  constructor(treeView, store, app) {
    this.tree = treeView;
    this.store = store;
    this.app = app;
    this.ctx = new ContextMenu();
    this.folders = {};
    this._initFolders();

    this.tree.onCtxMenu = (node, e) => {
      const items = this._menuItems(node);
      if (items.length) this.ctx.show(e.clientX, e.clientY, items);
    };

    this.tree.onDblClick = (node) => {
      if (node.data.type === 'object') this.app.openPanel(node.data.objectName, node.data.objectType);
      if (node.data.type === 'celestialBody') this.app.openPanel(node.data.bodyName, 'CelestialBody');
      if (node.data.type === 'predefinedCoordSys') this.app.openPanel(node.data.csName, 'PredefinedCoordSys');
      if (node.data.type === 'scriptEntry') {
        if (node.data.scriptName) {
          this.app.openScriptTab(node.data.scriptName);
        } else {
          this.app.tabMgr.activate('script');
        }
      }
    };

    this.store.onChange(() => this.refresh());
  }

  _initFolders() {
    const r = this.tree.root;
    this.folders.spacecraft     = this.tree.addNode(r, 'Spacecraft',        { type:'folder', cat:'Spacecraft' },     '\u{1F680}');
    this.folders.formations     = this.tree.addNode(r, 'Formations',        { type:'folder', cat:'Formation', disabled: true, disabledReason: 'Requires FormationPlugin (not available in WASM)' },      '\u{1F6F8}');
    this.folders.groundStations = this.tree.addNode(r, 'Ground Stations',   { type:'folder', cat:'GroundStation' },  '\u{1F4E1}');
    this.folders.hardware       = this.tree.addNode(r, 'Hardware',          { type:'folder', cat:'Hardware' },        '\u{1F529}');
    this.folders.burns          = this.tree.addNode(r, 'Burns',             { type:'folder', cat:'Burns' },          '\u{1F525}');
    this.folders.propagators    = this.tree.addNode(r, 'Propagators',       { type:'folder', cat:'Propagator' },     '\u2699');

    // Solar System — hierarchical celestial body tree (matches wxWidgets)
    this.folders.solarSystem    = this.tree.addNode(r, 'Solar System',      { type:'folder', cat:'SolarSystem', expanded: false },    '\u2609');
    this._initSolarSystemTree();

    this.folders.solvers        = this.tree.addNode(r, 'Solvers',           { type:'folder', cat:'Solver' },         '\u{1F527}');
    this.folders.output         = this.tree.addNode(r, 'Output',            { type:'folder', cat:'Output' },         '\u{1F4CA}');
    this.folders.interfaces     = this.tree.addNode(r, 'Interfaces',        { type:'folder', cat:'Interface', disabled: true, disabledReason: 'Requires DataInterfacePlugin (not available in WASM)' },      '\u{1F50C}');
    this.folders.scripts        = this.tree.addNode(r, 'Scripts',           { type:'folder', cat:'Script' },         '\u{1F4DC}');
    this.folders.variables      = this.tree.addNode(r, 'Variables',         { type:'folder', cat:'Variable' },       '\u{1D465}');
    this.folders.coordSystems   = this.tree.addNode(r, 'Coordinate Systems',{ type:'folder', cat:'CoordSystem' },    '\u2316');
    this._initCoordSystemDefaults();
    this.folders.eventLocators  = this.tree.addNode(r, 'Event Locators',    { type:'folder', cat:'EventLocator' },   '\u{1F50E}');
    this.folders.functions      = this.tree.addNode(r, 'Functions',         { type:'folder', cat:'Function', disabled: true, disabledReason: 'Requires GmatFunctionPlugin (not available in WASM)' },       '\u{1D453}');
  }

  _initSolarSystemTree() {
    const ss = this.folders.solarSystem;
    const bodyData = (name) => ({ type:'celestialBody', bodyName: name });

    // Sun
    this.tree.addNode(ss, 'Sun', bodyData('Sun'), '\u2600');

    // Mercury, Venus
    this.tree.addNode(ss, 'Mercury', bodyData('Mercury'), '\u263F');
    this.tree.addNode(ss, 'Venus', bodyData('Venus'), '\u2640');

    // Earth with Luna
    const earth = this.tree.addNode(ss, 'Earth', bodyData('Earth'), '\u{1F30D}');
    this.tree.addNode(earth, 'Luna', bodyData('Luna'), '\u{1F319}');

    // Mars with moons
    const mars = this.tree.addNode(ss, 'Mars', bodyData('Mars'), '\u{1F534}');
    this.tree.addNode(mars, 'Phobos', bodyData('Phobos'), '\u{1F311}');
    this.tree.addNode(mars, 'Deimos', bodyData('Deimos'), '\u{1F311}');

    // Jupiter with Galilean moons
    const jupiter = this.tree.addNode(ss, 'Jupiter', bodyData('Jupiter'), '\u{1F7E0}');
    for (const m of ['Io','Europa','Ganymede','Callisto']) {
      this.tree.addNode(jupiter, m, bodyData(m), '\u{1F311}');
    }

    // Saturn with major moons
    const saturn = this.tree.addNode(ss, 'Saturn', bodyData('Saturn'), '\u{1FA90}');
    for (const m of ['Titan','Rhea','Iapetus','Dione','Tethys','Enceladus','Mimas']) {
      this.tree.addNode(saturn, m, bodyData(m), '\u{1F311}');
    }

    // Uranus
    const uranus = this.tree.addNode(ss, 'Uranus', bodyData('Uranus'), '\u{1F535}');
    for (const m of ['Titania','Oberon','Ariel','Umbriel','Miranda']) {
      this.tree.addNode(uranus, m, bodyData(m), '\u{1F311}');
    }

    // Neptune
    const neptune = this.tree.addNode(ss, 'Neptune', bodyData('Neptune'), '\u{1F535}');
    this.tree.addNode(neptune, 'Triton', bodyData('Triton'), '\u{1F311}');

    // Pluto
    const pluto = this.tree.addNode(ss, 'Pluto', bodyData('Pluto'), '\u26AA');
    this.tree.addNode(pluto, 'Charon', bodyData('Charon'), '\u{1F311}');

    // Special Points
    const sp = this.tree.addNode(ss, 'Special Points', { type:'folder', cat:'SpecialPoints' }, '\u2726');
    this.tree.addNode(sp, 'SolarSystemBarycenter', { type:'celestialBody', bodyName:'SolarSystemBarycenter' }, '\u2316');
    this.tree.addNode(sp, 'EarthMoonBarycenter', { type:'celestialBody', bodyName:'EarthMoonBarycenter' }, '\u2316');
  }

  _initCoordSystemDefaults() {
    const cs = this.folders.coordSystems;
    const predefined = [
      { name: 'EarthMJ2000Eq', origin: 'Earth', axes: 'MJ2000Eq' },
      { name: 'EarthMJ2000Ec', origin: 'Earth', axes: 'MJ2000Ec' },
      { name: 'EarthFixed',    origin: 'Earth', axes: 'BodyFixed' },
      { name: 'EarthICRF',     origin: 'Earth', axes: 'ICRF' },
    ];
    for (const p of predefined) {
      this.tree.addNode(cs, p.name, {
        type: 'predefinedCoordSys', csName: p.name, origin: p.origin, axes: p.axes
      }, '\u2316');
    }
  }

  _menuItems(node) {
    if (node.data.type === 'folder') {
      switch (node.data.cat) {
        case 'Spacecraft':  return [{ label: 'Add Spacecraft', action: () => this._add('Spacecraft') }];
        case 'Formation': return [{ label: 'Add Formation', disabled: true, title: 'Requires FormationPlugin (not available in WASM)', action: () => {} }];
        case 'GroundStation': return [
          { label: 'Add Ground Station', action: () => this._add('GroundStation') },
        ];
        case 'Hardware': return [
          { label: 'Add Fuel Tank (Chemical)', action: () => this._add('ChemicalTank') },
          { label: 'Add Fuel Tank (Electric)', action: () => this._add('ElectricTank') },
          { label: 'Add Thruster (Chemical)', action: () => this._add('ChemicalThruster') },
          { label: 'Add Thruster (Electric)', action: () => this._add('ElectricThruster') },
          { label: 'Add Solar Power System', action: () => this._add('SolarPowerSystem') },
          { label: 'Add Nuclear Power System', action: () => this._add('NuclearPowerSystem') },
        ];
        case 'Propagator':  return [{ label: 'Add Propagator', action: () => this._addPropagator() }];
        case 'Burns': return [
          { label: 'Add Impulsive Burn', action: () => this._add('ImpulsiveBurn') },
          { label: 'Add Finite Burn', action: () => this._add('FiniteBurn') },
        ];
        case 'Solver': return [
          { label: 'Add Differential Corrector', action: () => this._add('DifferentialCorrector') },
          { label: 'Add VF13ad Optimizer', action: () => this._add('VF13ad') },
        ];
        case 'Output': return [
          { label: 'Add Report File', action: () => this._add('ReportFile') },
          { label: 'Add Orbit View', action: () => this._add('OrbitView') },
          { label: 'Add XY Plot', action: () => this._add('XYPlot') },
          { label: 'Add Ephemeris File', action: () => this._add('EphemerisFile') },
        ];
        case 'Variable': return [
          { label: 'Add Variable', action: () => this._add('Variable') },
          { label: 'Add Array', action: () => this._add('Array') },
          { label: 'Add String', action: () => this._add('String') },
        ];
        case 'CoordSystem': return [
          { label: 'Add Coordinate System', action: () => this._add('CoordinateSystem') },
        ];
        case 'SolarSystem': return [];
        case 'SpecialPoints': return [];
        case 'Interface': return [
          { label: 'Add File Interface', disabled: true, title: 'Requires DataInterfacePlugin (not available in WASM)', action: () => {} },
        ];
        case 'Script': return [
          { label: 'New Script', action: () => this._addScript() },
          { label: 'View Current Script', action: () => this.app.tabMgr.activate('script') },
        ];
        case 'EventLocator': return [
          { label: 'Add Eclipse Locator', action: () => this._add('EclipseLocator') },
          { label: 'Add Contact Locator', action: () => this._add('ContactLocator') },
        ];
        case 'Function': return [
          { label: 'Add GMAT Function', disabled: true, title: 'Requires GmatFunctionPlugin (not available in WASM)', action: () => {} },
        ];
        default: return [];
      }
    }
    if (node.data.type === 'celestialBody') {
      return [
        { label: 'Open', action: () => this.app.openPanel(node.data.bodyName, 'CelestialBody') },
      ];
    }
    if (node.data.type === 'predefinedCoordSys') {
      return [
        { label: 'Open', action: () => this.app.openPanel(node.data.csName, 'PredefinedCoordSys') },
      ];
    }
    if (node.data.type === 'scriptEntry') {
      if (node.data.scriptName) {
        // Individual script entry
        return [
          { label: 'Open', action: () => this.app.openScriptTab(node.data.scriptName) },
          { label: 'Rename', action: () => this._renameScript(node) },
          { separator: true },
          { label: 'Delete', action: () => this._deleteScript(node.data.scriptName) },
        ];
      }
      // Current script entry (no specific name)
      return [
        { label: 'Open Script Editor', action: () => this.app.tabMgr.activate('script') },
      ];
    }
    // ForceModel objects are tied to their Propagator - no delete/clone/rename
    if (node.data.objectType === 'ForceModel') {
      return [
        { label: 'Open', action: () => this.app.openPanel(node.data.objectName, node.data.objectType) },
      ];
    }
    return [
      { label: 'Open', action: () => this.app.openPanel(node.data.objectName, node.data.objectType) },
      { label: 'Rename', action: () => this._rename(node) },
      { label: 'Clone', action: () => this.store.cloneObject(node.data.objectName) },
      { separator: true },
      { label: 'Delete', action: () => { this.store.deleteObject(node.data.objectName); this.app.tabMgr.close('panel-'+node.data.objectName); }},
    ];
  }

  _rename(node) {
    const oldName = node.data.objectName;
    const el = node.el;
    if (!el) return;
    const lblEl = el.querySelector('.tree-label');
    if (!lblEl) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tree-rename-input';
    input.value = oldName;
    lblEl.replaceWith(input);
    input.focus();
    input.select();
    const finish = () => {
      const newName = input.value.trim();
      if (newName && newName !== oldName) {
        const result = this.store.renameObject(oldName, newName);
        if (!result.success) {
          this.app.console.error(`[Rename failed: ${result.error}]`);
          alert(`Rename failed: ${result.error}`);
        } else {
          // Update open tab
          this.app.tabMgr.close('panel-' + oldName);
        }
      }
      this.refresh();
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = oldName; input.blur(); }
    });
  }

  _add(type) {
    const name = this._genName(type);
    this.store.createObject(type, name);
    if (type === 'Spacecraft') {
      this._addSpacecraftToSubscribers(name);
      this._addSpacecraftToPropagation(name);
    }
    // Assign first available spacecraft to EphemerisFile
    if (type === 'EphemerisFile') {
      const spacecraft = this.store.getAllByType('Spacecraft');
      if (spacecraft.length > 0) {
        const obj = this.store.getObject(name);
        if (obj) obj.properties.Spacecraft = spacecraft[0].name;
      }
    }
    this.app.openPanel(name, type);
  }

  _addSpacecraftToSubscribers(scName) {
    for (const rpt of this.store.getAllByType('ReportFile')) {
      const cur = rpt.properties.Add || [];
      const newParams = [
        `${scName}.UTCGregorian`,
        `${scName}.EarthMJ2000Eq.X`,
        `${scName}.EarthMJ2000Eq.Y`,
        `${scName}.EarthMJ2000Eq.Z`,
      ];
      for (const p of newParams) {
        if (!cur.includes(p)) cur.push(p);
      }
      this.store.setProperty(rpt.name, 'Add', cur);
    }
  }

  _addSpacecraftToPropagation(scName) {
    const seq = this.store.missionSequence;
    const propCmd = seq.find(c => c.type === 'Propagate');
    if (propCmd) {
      // Normalize to array and check for duplicates
      const scList = Array.isArray(propCmd.spacecraft) ? propCmd.spacecraft :
                     (propCmd.spacecraft ? [propCmd.spacecraft] : []);
      if (!scList.includes(scName)) {
        scList.push(scName);
        propCmd.spacecraft = scList;
      }
    } else {
      const props = this.store.getAllByType('Propagator');
      const propName = props.length > 0 ? props[0].name : 'DefaultProp';
      seq.push({
        type: 'Propagate',
        propagator: propName,
        spacecraft: [scName],
        stopCondition: { param: `${scName}.ElapsedDays`, value: 1 }
      });
    }
  }

  _addPropagator() {
    const fmName = this._genName('ForceModel');
    const propName = this._genName('Propagator');
    this.store.createObject('ForceModel', fmName);
    this.store.createObject('Propagator', propName);
    this.store.setProperty(propName, 'FM', fmName);
    this.app.openPanel(propName, 'Propagator');
  }

  _addScript() {
    // Generate unique script name
    let n = 1;
    while (this.store.getScript('Script' + n)) n++;
    const name = 'Script' + n;
    this.store.addScript(name, '% GMAT Script: ' + name + '\n\nBeginMissionSequence;\n');
    this.app.openScriptTab(name);
  }

  _renameScript(node) {
    const oldName = node.data.scriptName;
    const el = node.el;
    if (!el) return;
    const lblEl = el.querySelector('.tree-label');
    if (!lblEl) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tree-rename-input';
    input.value = oldName;
    lblEl.replaceWith(input);
    input.focus();
    input.select();
    const finish = () => {
      const newName = input.value.trim();
      if (newName && newName !== oldName) {
        const result = this.store.renameScript(oldName, newName);
        if (!result.success) {
          this.app.console.error(`[Script rename failed: ${result.error}]`);
          alert(`Rename failed: ${result.error}`);
        } else {
          // Close old tab if open
          this.app.tabMgr.close('script-' + oldName);
        }
      }
      this.refresh();
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = oldName; input.blur(); }
    });
  }

  _deleteScript(name) {
    this.store.deleteScript(name);
    this.app.tabMgr.close('script-' + name);
  }

  _genName(type) {
    const pfx = NAME_PREFIX[type] || type;
    let n = 1;
    while (this.store.getObject(pfx + n)) n++;
    return pfx + n;
  }

  refresh() {
    // Clear all folders except static hierarchies (Solar System, Coordinate Systems)
    const staticFolders = new Set(['solarSystem', 'coordSystems']);
    for (const [key, f] of Object.entries(this.folders)) {
      if (staticFolders.has(key)) continue;
      this.tree.clearChildren(f);
    }
    // Coord Systems: clear then re-add predefined + user objects
    this.tree.clearChildren(this.folders.coordSystems);
    this._initCoordSystemDefaults();

    const typeToFolder = {
      Spacecraft: 'spacecraft',
      Formation: 'formations',
      GroundStation: 'groundStations',
      ChemicalTank: 'hardware', ElectricTank: 'hardware',
      ChemicalThruster: 'hardware', ElectricThruster: 'hardware',
      SolarPowerSystem: 'hardware', NuclearPowerSystem: 'hardware',
      ForceModel: 'propagators', Propagator: 'propagators',
      ImpulsiveBurn: 'burns', FiniteBurn: 'burns',
      DifferentialCorrector: 'solvers', VF13ad: 'solvers',
      ReportFile: 'output', OrbitView: 'output', XYPlot: 'output', EphemerisFile: 'output',
      Variable: 'variables', Array: 'variables', String: 'variables',
      CoordinateSystem: 'coordSystems',
      FileInterface: 'interfaces',
      EclipseLocator: 'eventLocators', ContactLocator: 'eventLocators',
      GmatFunction: 'functions',
    };

    const icons = {
      Spacecraft: '\u{1F6F0}', Formation: '\u{1F6F8}',
      GroundStation: '\u{1F4E1}',
      ChemicalTank: '\u{1F6E2}', ElectricTank: '\u{1F50B}',
      ChemicalThruster: '\u{1F4A5}', ElectricThruster: '\u26A1',
      SolarPowerSystem: '\u2600', NuclearPowerSystem: '\u2622',
      ForceModel: '\u{1F30D}', Propagator: '\u{2699}',
      ImpulsiveBurn: '\u26A1', FiniteBurn: '\u{1F525}',
      DifferentialCorrector: '\u{1F50D}', VF13ad: '\u{1F4C8}',
      ReportFile: '\u{1F4C4}', OrbitView: '\u{1F30F}', XYPlot: '\u{1F4C8}', EphemerisFile: '\u{1F4BE}',
      Variable: '\u{1D465}', Array: '\u{1F4CB}', String: '\u{1F520}',
      CoordinateSystem: '\u2316',
      FileInterface: '\u{1F50C}',
      EclipseLocator: '\u{1F311}', ContactLocator: '\u{1F4E1}',
      GmatFunction: '\u{1D453}',
    };

    for (const obj of this.store.objects.values()) {
      const fk = typeToFolder[obj.type];
      if (fk && this.folders[fk]) {
        const node = this.tree.addNode(this.folders[fk], obj.name, {
          type: 'object', objectType: obj.type, objectName: obj.name
        }, icons[obj.type] || '\u25CF');

        // Formation: show member spacecraft as children
        if (obj.type === 'Formation') {
          const members = obj.properties.Add || [];
          for (const sc of members) {
            this.tree.addNode(node, sc, {
              type: 'object', objectType: 'Spacecraft', objectName: sc
            }, icons.Spacecraft);
          }
        }

        // Spacecraft: show attached hardware as children
        if (obj.type === 'Spacecraft') {
          const tanks = obj.properties.Tanks || [];
          for (const t of tanks) {
            const tObj = this.store.getObject(t);
            const tType = tObj ? tObj.type : 'ChemicalTank';
            this.tree.addNode(node, t, {
              type: 'object', objectType: tType, objectName: t
            }, icons[tType] || '\u25CF');
          }
          const thrusters = obj.properties.Thrusters || [];
          for (const t of thrusters) {
            const tObj = this.store.getObject(t);
            const tType = tObj ? tObj.type : 'ChemicalThruster';
            this.tree.addNode(node, t, {
              type: 'object', objectType: tType, objectName: t
            }, icons[tType] || '\u25CF');
          }
          const ps = obj.properties.PowerSystem;
          if (ps) {
            const psObj = this.store.getObject(ps);
            const psType = psObj ? psObj.type : 'SolarPowerSystem';
            this.tree.addNode(node, ps, {
              type: 'object', objectType: psType, objectName: ps
            }, icons[psType] || '\u25CF');
          }
        }
      }
    }

    // Scripts folder: add "Current Script" and all stored scripts
    this.tree.addNode(this.folders.scripts, 'Current Script', { type: 'scriptEntry' }, '\u{1F4DC}');
    for (const script of this.store.getAllScripts()) {
      this.tree.addNode(this.folders.scripts, script.name, {
        type: 'scriptEntry', scriptName: script.name
      }, '\u{1F4C4}');
    }

    this.tree.render();
  }
}
