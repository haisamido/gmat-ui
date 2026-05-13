/**
 * GmatRouter.js — Hash-based URL router for GMAT Web GUI
 *
 * Routes URL fragments to panels and sub-tabs:
 *   #/Resources/Spacecraft/DefaultSC/Orbit
 *   #/Script
 *   #/Resources/Output/OrbitView (built-in 3D viewer)
 *   #/Resources/Output/ReportOutput (built-in report viewer)
 *
 * C++ reference: (none - web-only component)
 */

export class GmatRouter {
  constructor(app) {
    this.app = app;
    this._suppressPush = false;
    this._scTabs = ['Orbit','Attitude','BallisticMass','Tanks','PowerSystem','SPICE','Actuators','Visualization'];
    this._cbTabs = ['Properties','Orbit','Orientation','Visualization'];
    this._segmentToType = { CoordSystem: 'PredefinedCoordSys' };
    this._typeToSegment = { PredefinedCoordSys: 'CoordSystem' };
    // Category prefix mapping for all resource types to match GMAT resource tree
    this._typeToCategory = {
      Spacecraft: 'Spacecraft',
      Formation: 'Formations',
      GroundStation: 'GroundStations',
      ChemicalTank: 'Hardware', ElectricTank: 'Hardware',
      ChemicalThruster: 'Hardware', ElectricThruster: 'Hardware',
      SolarPowerSystem: 'Hardware', NuclearPowerSystem: 'Hardware',
      ImpulsiveBurn: 'Burns', FiniteBurn: 'Burns',
      ForceModel: 'Propagators', Propagator: 'Propagators',
      DifferentialCorrector: 'Solvers', VF13ad: 'Solvers',
      ReportFile: 'Output', OrbitView: 'Output',
      XYPlot: 'Output', EphemerisFile: 'Output',
      Variable: 'Variables', Array: 'Variables', String: 'Variables',
      CoordinateSystem: 'CoordinateSystems', PredefinedCoordSys: 'CoordinateSystems',
      CelestialBody: 'SolarSystem',
      FileInterface: 'Interfaces',
      EclipseLocator: 'EventLocators', ContactLocator: 'EventLocators',
      GmatFunction: 'Functions',
      Script: 'Scripts',
    };
    this._categories = new Set(Object.values(this._typeToCategory));
  }

  parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    if (!h) return null;
    const parts = h.split('/').filter(Boolean);
    if (!parts.length) return null;
    // Built-in tabs (legacy URLs without Resources prefix)
    if (parts[0] === 'Script') return { type: 'Script', name: null, subTab: null };
    if (parts[0] === 'OrbitView') return { type: 'OrbitView', name: null, subTab: null };
    if (parts[0] === 'ReportOutput') return { type: 'ReportOutput', name: null, subTab: null };
    // Resources URLs: #/Resources/Category or #/Resources/Category/Name/SubTab
    if (parts[0] === 'Resources' && parts.length >= 2) {
      const category = parts[1];
      // Handle #/Resources/Scripts (category view) or #/Resources/Scripts/ScriptName
      if (category === 'Scripts') {
        if (parts.length === 2) {
          // #/Resources/Scripts - show the built-in script editor (current script)
          return { type: 'Script', name: null, subTab: null };
        }
        // #/Resources/Scripts/ScriptName - show specific script
        const scriptName = decodeURIComponent(parts[2]);
        return { type: 'Script', name: scriptName, subTab: null };
      }
      // Other categories require at least 3 parts
      if (parts.length >= 3 && this._categories.has(category)) {
        const name = decodeURIComponent(parts[2]);
        const subTab = parts[3] ? decodeURIComponent(parts[3]) : null;
        // Special case: #/Resources/Output/OrbitView is the built-in 3D viewer tab
        // (unless there's an actual object named "OrbitView")
        if (category === 'Output' && name === 'OrbitView' && !subTab) {
          const obj = this.app.store.getObject(name);
          if (!obj) return { type: 'OrbitView', name: null, subTab: null };
        }
        // Special case: #/Resources/Output/ReportOutput is the built-in report viewer tab
        if (category === 'Output' && name === 'ReportOutput' && !subTab) {
          const obj = this.app.store.getObject(name);
          if (!obj) return { type: 'ReportOutput', name: null, subTab: null };
        }
        // Look up object by name to get its type
        const obj = this.app.store.getObject(name);
        if (obj) return { type: obj.type, name, subTab };
        // Handle predefined coordinate systems and celestial bodies
        if (category === 'CoordinateSystems') return { type: 'PredefinedCoordSys', name, subTab };
        if (category === 'SolarSystem') return { type: 'CelestialBody', name, subTab };
      }
      return null;
    }
    // Legacy fallback: #/Category/Name/SubTab (without Resources prefix)
    if (this._categories.has(parts[0]) && parts.length >= 2) {
      const name = decodeURIComponent(parts[1]);
      const subTab = parts[2] ? decodeURIComponent(parts[2]) : null;
      const obj = this.app.store.getObject(name);
      if (obj) return { type: obj.type, name, subTab };
      if (parts[0] === 'CoordinateSystems') return { type: 'PredefinedCoordSys', name, subTab };
      if (parts[0] === 'SolarSystem') return { type: 'CelestialBody', name, subTab };
      return null;
    }
    return null;
  }

  buildHash(type, name, subTab) {
    // Built-in Script tab uses Resources/Scripts
    if (!name && type === 'Script') {
      return '#/Resources/Scripts';
    }
    // Named script uses Resources/Scripts/ScriptName
    if (type === 'Script' && name) {
      return '#/Resources/Scripts/' + encodeURIComponent(name);
    }
    // Built-in OrbitView tab (3D viewer) uses Resources/Output/OrbitView
    if (!name && type === 'OrbitView') {
      return '#/Resources/Output/OrbitView';
    }
    // Built-in ReportOutput tab uses Resources/Output/ReportOutput
    if (!name && type === 'ReportOutput') {
      return '#/Resources/Output/ReportOutput';
    }
    // All resource types get #/Resources/Category/Name/SubTab
    const category = this._typeToCategory[type] || type;
    let h = '#/Resources/' + category;
    if (name) h += '/' + encodeURIComponent(name);
    if (subTab) h += '/' + encodeURIComponent(subTab);
    return h;
  }

  pushState(type, name, subTab) {
    if (this._suppressPush) return;
    const h = this.buildHash(type, name, subTab);
    if (location.hash !== h) history.pushState({ type, name, subTab }, '', h);
  }

  replaceState(type, name, subTab) {
    history.replaceState({ type, name, subTab }, '', this.buildHash(type, name, subTab));
  }

  pushDefault() {
    if (this._suppressPush) return;
    if (location.hash && location.hash !== '#/') history.pushState(null, '', '#/');
  }

  subTabIndex(type, subTabName) {
    if (!subTabName) return 0;
    const tabs = type === 'Spacecraft' ? this._scTabs : type === 'CelestialBody' ? this._cbTabs : null;
    if (!tabs) return 0;
    const idx = tabs.findIndex(t => t.toLowerCase() === subTabName.toLowerCase());
    return idx >= 0 ? idx : 0;
  }

  subTabName(type, idx) {
    const tabs = type === 'Spacecraft' ? this._scTabs : type === 'CelestialBody' ? this._cbTabs : null;
    if (!tabs || idx < 0) return null;
    return tabs[idx] || null;
  }

  handleNavigation() {
    const state = this.parseHash();
    if (!state) return;
    this._suppressPush = true;
    try {
      if (state.type === 'Script') {
        if (state.name) {
          // Open a specific named script
          this.app.openScriptTab(state.name);
        } else {
          // Open the default script editor
          this.app.tabMgr.activate('script');
        }
      }
      else if (state.type === 'OrbitView') { this.app.tabMgr.activate('orbit'); }
      else if (state.type === 'ReportOutput') { this.app.tabMgr.activate('report'); }
      else if (state.name) {
        this.app.openPanel(state.name, state.type);
        if (state.subTab) {
          const idx = this.subTabIndex(state.type, state.subTab);
          this._activateSubTab('panel-' + state.name, idx);
        }
      }
    } catch(e) { console.warn('Router: navigation failed', location.hash, e); }
    finally { this._suppressPush = false; }
  }

  _activateSubTab(tabId, idx) {
    const tab = this.app.tabMgr.tabs.get(tabId);
    if (!tab) return;
    const btns = tab.contentEl.querySelectorAll('.body-tab-btn');
    const panes = tab.contentEl.querySelectorAll('.body-tab-pane');
    if (!btns.length) return;
    btns.forEach(b => b.classList.remove('active'));
    panes.forEach(p => p.classList.remove('active'));
    if (btns[idx]) btns[idx].classList.add('active');
    const pane = tab.contentEl.querySelector(`[data-body-pane="${idx}"]`);
    if (pane) pane.classList.add('active');
  }

  listen() {
    window.addEventListener('popstate', () => this.handleNavigation());
  }
}
