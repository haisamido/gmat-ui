/**
 * GmatApp.js — Main Application Controller
 *
 * This is the central orchestrator that wires together all GUI modules.
 * C++ reference: src/gui/app/GmatMainFrame.cpp
 */

import { GmatObjectStore } from '../../base/executive/GmatObjectStore.js';
import { GmatScriptGenerator } from '../../base/interpreter/GmatScriptGenerator.js';
import { ScriptInterpreter } from '../../base/interpreter/ScriptInterpreter.js';
import { GmatWasmRunner } from '../../base/executive/GmatWasmRunner.js';
import { GmatRouter } from './GmatRouter.js';
import { UITabManager } from './UITabManager.js';
import { getIcon } from '../resource/GmatIcons.js';
import { TreeView } from '../widgets/TreeView.js';
import { OrbitViewer, ModelPreview } from '../orbit/OrbitView.js';
import { ReportViewer } from '../output/ReportViewer.js';
import { ResourceTreeCtrl } from './ResourceTreeCtrl.js';
import { MissionPanelCtrl } from './MissionPanelCtrl.js';
import { UIConsole } from './UIConsole.js';
import { PanelFactory } from './PanelFactory.js';
import { wrapPanelWithActionBar } from './PanelActionBar.js';

/**
 * GmatApp — Main application controller
 *
 * Initializes and coordinates all subsystems:
 * - Object store (data model)
 * - Script generator
 * - WASM runner
 * - Tab manager
 * - Resource tree
 * - Mission sequence panel
 * - Console output
 * - Router
 * - Panel factory
 */
export class GmatApp {
  constructor(options = {}) {
    // Configuration
    this.config = {
      tabBarEl: options.tabBarEl || document.getElementById('tab-bar'),
      tabContentEl: options.tabContentEl || document.getElementById('tab-content'),
      consoleOutputEl: options.consoleOutputEl || document.getElementById('console-output'),
      consoleCountEl: options.consoleCountEl || document.getElementById('console-line-count'),
      resourcesPanelEl: options.resourcesPanelEl || document.getElementById('resources-panel'),
      missionPanelEl: options.missionPanelEl || document.getElementById('mission-panel'),
      orbitContainerEl: options.orbitContainerEl || null,
    };

    // Core data model
    this.store = new GmatObjectStore();

    // Script generation and parsing
    this.generator = new GmatScriptGenerator(this.store);
    this.interpreter = new ScriptInterpreter(this.store);

    // Console output
    this.console = new UIConsole(
      this.config.consoleOutputEl,
      this.config.consoleCountEl
    );

    // WASM runner
    this.runner = new GmatWasmRunner({
      onStdout: t => this.console.append(t),
      onStderr: t => this.console.error(t),
      onStatus: s => this._setStatus(s),
    });

    // Tab manager
    this.tabMgr = new UITabManager(
      this.config.tabBarEl,
      this.config.tabContentEl
    );

    // 3D Orbit viewer
    this.orbitViewer = new OrbitViewer();

    // Report output viewer
    this.reportViewer = new ReportViewer();

    // Panel factory (for creating config panels)
    this.panelFactory = new PanelFactory({
      ModelPreview: ModelPreview
    });

    // Controllers (initialized in init())
    this.resourceTree = null;
    this.missionCtrl = null;
    this.router = null;

    // Internal state
    this._currentFilename = 'gmat_script.script';
    this._loadedScriptName = null;  // Track source script name for generator header
    this._statusEl = options.statusEl || null;
  }

  /**
   * Initialize the application
   */
  async init() {
    // Initialize left panel tabs
    this._initLeftPanelTabs();

    // Initialize resource tree
    this._initResourceTree();

    // Initialize mission panel
    this._initMissionPanel();

    // Initialize script editor tab
    this._initScriptEditor();

    // Initialize orbit viewer tab
    this._initOrbitViewer();

    // Initialize report output tab
    this._initReportViewer();

    // Initialize router
    this._initRouter();

    // Initialize keyboard shortcuts
    this._initKeyboardShortcuts();

    // Initialize toolbar
    this._initToolbar();

    // Initialize WASM module (non-fatal if it fails)
    this.console.append('[Loading GMAT WASM module...]');
    try {
      await this.runner.init();
      this.console.append('[GMAT WASM module ready]');
      // Enable run button now that WASM is ready
      const runBtn = document.getElementById('btn-run');
      if (runBtn) runBtn.disabled = false;
    } catch (e) {
      this.console.error('[WASM load error: ' + (e.message || e) + ']');
      this.console.append('[Hint: Ensure GmatConsole.js/wasm/data files exist in the parent directory]');
    }

    // Load default sample script (Ex_FiniteBurn.script)
    await this._loadDefaultSample();

    this.console.append('GMAT Web GUI initialized');
  }

  /**
   * Open a configuration panel for an object
   */
  openPanel(name, type) {
    const tabId = 'panel-' + name;

    // Check if tab already open
    if (this.tabMgr.getTab(tabId)) {
      this.tabMgr.activate(tabId);
      const meta = this.tabMgr.getTab(tabId).meta;
      if (this.router && meta && meta.type) {
        this.router.pushState(meta.type, name, null);
      }
      return;
    }

    // Create panel using factory
    const panel = this.panelFactory.createPanel(type, name, this.store);
    if (!panel) return;

    // Wrap panel with action bar
    const wrapper = wrapPanelWithActionBar(panel, {
      onShowScript: () => this.generateScript(),
      onShowResourceScript: () => this.showResourceScript(name),
      onOk: () => this.tabMgr.close(tabId),
      onCancel: () => this.tabMgr.close(tabId),
    });

    // Add as tab with type metadata and icon
    this.tabMgr.addTab(tabId, name, wrapper, true, { type }, getIcon(type));

    // Update router
    if (this.router) {
      this.router.pushState(type, name, null);
    }
  }

  /**
   * Open a script editor tab for a named script
   * @param {string} name - The script name
   */
  openScriptTab(name) {
    const tabId = 'script-' + name;

    // Check if tab already open
    if (this.tabMgr.getTab(tabId)) {
      this.tabMgr.activate(tabId);
      if (this.router) {
        this.router.pushState('Script', name, null);
      }
      return;
    }

    // Get or create the script
    let scriptData = this.store.getScript(name);
    if (!scriptData) {
      // Create new script
      this.store.addScript(name, '% GMAT Script: ' + name + '\n\nBeginMissionSequence;\n');
      scriptData = this.store.getScript(name);
    }

    // Create script editor element
    const editorEl = document.createElement('div');
    editorEl.className = 'script-editor-wrap';
    editorEl.innerHTML = `
      <div class="script-toolbar">
        <button class="btn-save-script">Save</button>
        <button class="btn-run-script">Run</button>
        <span class="spacer"></span>
        <span style="font-size:11px;color:var(--overlay0)">F5 to run</span>
      </div>
      <div class="script-editor-container">
        <pre class="script-highlight" aria-hidden="true"><code class="language-matlab"></code></pre>
        <textarea class="script-textarea" spellcheck="false"></textarea>
      </div>
    `;

    const textarea = editorEl.querySelector('.script-textarea');
    const pre = editorEl.querySelector('.script-highlight');
    const codeEl = pre.querySelector('code');

    // Set initial content
    textarea.value = scriptData.content;

    // Highlight function
    const syncHighlight = () => {
      codeEl.textContent = textarea.value + '\n';
      if (typeof Prism !== 'undefined') {
        Prism.highlightElement(codeEl);
      }
    };
    syncHighlight();

    // Wire up events
    textarea.addEventListener('input', () => {
      syncHighlight();
      // Auto-save to store
      this.store.updateScript(name, textarea.value);
    });
    textarea.addEventListener('scroll', () => {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
    });

    // Tab key handling
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = textarea.selectionStart, end = textarea.selectionEnd;
        textarea.setRangeText('   ', start, end, 'end');
        syncHighlight();
      }
    });

    // Save button
    editorEl.querySelector('.btn-save-script').addEventListener('click', () => {
      this.store.updateScript(name, textarea.value);
      this.console.append(`[Script "${name}" saved]`);
    });

    // Run button
    editorEl.querySelector('.btn-run-script').addEventListener('click', () => {
      // Use this script to run
      const origTextarea = this._scriptTextarea;
      if (origTextarea) {
        origTextarea.value = textarea.value;
        this._syncHighlight();
      }
      this.run();
    });

    // Add as tab
    this.tabMgr.addTab(tabId, name, editorEl, true, { type: 'Script', scriptName: name }, getIcon('Script'));

    // Update router
    if (this.router) {
      this.router.pushState('Script', name, null);
    }
  }

  /**
   * Generate script and show in Script Editor tab
   */
  generateScript() {
    this._generateScriptSilent();
    this.tabMgr.activate('script');
  }

  /**
   * Show resource script for a specific object in the Script Editor tab
   * @param {string} objectName - The name of the object to generate script for
   */
  showResourceScript(objectName) {
    const script = this.generator.generateForObject(objectName);
    const textarea = document.getElementById('script-textarea');
    if (textarea) {
      textarea.value = script;
      this._syncHighlight();
    }
    this.tabMgr.activate('script');
  }

  /**
   * Generate script without switching tabs
   */
  _generateScriptSilent() {
    const script = this.generator.generate(this._loadedScriptName);
    const textarea = document.getElementById('script-textarea');
    if (textarea) {
      textarea.value = script;
      this._syncHighlight();
    }
  }

  /**
   * Run the current script (from textarea, not regenerated from store)
   */
  async run() {
    if (this.runner.isRunning) return;

    const textarea = document.getElementById('script-textarea');
    let script = textarea?.value || '';
    if (!script.trim()) {
      this.console.error('[ERROR] No script to run');
      return;
    }

    // Auto-inject ReportFile for orbit visualization if needed
    script = this._injectOrbitReportFile(script);
    // Auto-inject ReportFile paths for solvers
    script = this._injectSolverReportFiles(script);

    this.console.append('\n--- Run ---');
    this.console.append('[Creating GMAT module instance...]');

    try {
      const result = await this.runner.runScript(script);
      if (!result) return;

      this.console.append('[GMAT exited with code ' + result.exitCode + ']');

      if (result.exitCode === 0) {
        this.console.append('Mission run completed successfully');
        // Update report viewer with all output files
        if (result.outputs && result.outputs.files) {
          this.reportViewer.update(result.outputs.files);
        }
        // Update orbit viewer with ephemeris files if available
        if (result.outputs && result.outputs.files) {
          // Collect per-spacecraft ephemeris files (pattern: /tmp/Resources/Spacecraft/{name}/ephemeris.txt)
          const ephemerisFiles = {};
          const ephemerisPattern = /^\/application\/output\/Resources\/Spacecraft\/([^/]+)\/ephemeris\.txt$/;
          for (const [path, content] of Object.entries(result.outputs.files)) {
            const match = path.match(ephemerisPattern);
            if (match) {
              // Convert GMAT Gregorian timestamps to ISO format
              ephemerisFiles[match[1]] = this._convertGmatToIsoTimestamp(content);
            }
          }

          // Fall back to legacy single-file format for backwards compatibility
          const hasEphemeris = Object.keys(ephemerisFiles).length > 0;
          const hasLegacyReport = result.outputs.files['/application/output/gmat_output.txt'];

          if (hasEphemeris || hasLegacyReport) {
            // Initialize orbit viewer if not already done
            if (!this.orbitViewer.initialized) {
              const earthVertex = document.getElementById('earthVertex')?.textContent || '';
              const earthFragment = document.getElementById('earthFragment')?.textContent || '';
              const atmosVertex = document.getElementById('atmosVertex')?.textContent || '';
              const atmosFragment = document.getElementById('atmosFragment')?.textContent || '';
              this.orbitViewer.init(earthVertex, earthFragment, atmosVertex, atmosFragment);
              // Mount the viewer element if needed
              const container = document.querySelector('#orbit-container');
              if (container && !container.contains(this.orbitViewer.el)) {
                container.appendChild(this.orbitViewer.el);
              }
            }

            if (hasEphemeris) {
              // Use per-spacecraft ephemeris files
              this.orbitViewer.setEphemerisFiles(ephemerisFiles, this.store);
            } else {
              // Fall back to legacy single report format
              this.orbitViewer.setTrajectory(hasLegacyReport, this.store);
            }
            // Activate orbit view tab to show results
            this.tabMgr.activate('orbit');
          }
        }
      }
    } catch (err) {
      this.console.error('Error: ' + err.message);
    }
  }

  /**
   * Inject ReportFiles for orbit visualization - one per spacecraft
   * Files are written to /tmp/Resources/Spacecraft/{name}/ephemeris.txt
   * @param {string} script - The original script
   * @returns {string} The script with injected ReportFiles if needed
   */
  _injectOrbitReportFile(script) {
    // Find all spacecraft in the script
    const spacecraftMatches = script.matchAll(/Create\s+Spacecraft\s+(\w+)/g);
    const spacecraft = [...spacecraftMatches].map(m => m[1]);

    if (spacecraft.length === 0) {
      return script; // No spacecraft to track
    }

    // Check which spacecraft already have ephemeris output
    const spacecraftNeedingReport = spacecraft.filter(sc => {
      // Check for per-spacecraft ephemeris file
      const hasPerScEphemeris = new RegExp(
        `ReportFile.*Filename\\s*=\\s*['"]?/tmp/Resources/Spacecraft/${sc}/ephemeris\\.txt`, 'i'
      ).test(script);
      // Check for legacy single-file output with this spacecraft
      const hasLegacyOutput = /ReportFile.*Filename\s*=\s*['"]?\/tmp\/gmat_output\.txt/i.test(script) &&
                              new RegExp(`${sc}\\.\\w+\\.X\\b`, 'i').test(script);
      return !hasPerScEphemeris && !hasLegacyOutput;
    });

    if (spacecraftNeedingReport.length === 0) {
      return script; // All spacecraft already have orbit data output
    }

    // Determine the coordinate system to use
    // Only look at OrbitView/plot coordinate systems, not burn coordinate systems
    // C++ default is EarthMJ2000Eq (see OrbitPlot.cpp, OrbitView.cpp, OpenGlPlot.cpp)
    let coordSys = 'EarthMJ2000Eq';
    const coordMatch = script.match(/(?:OrbitView|OpenGLPlot|GroundTrackPlot)\w*\.CoordinateSystem\s*=\s*(\w+)/i);
    if (coordMatch) {
      coordSys = coordMatch[1];
    }

    // Build per-spacecraft ReportFile blocks
    const reportFileBlocks = spacecraftNeedingReport.map(sc => `
Create ReportFile ${sc}Ephemeris;
GMAT ${sc}Ephemeris.Filename = '/tmp/Resources/Spacecraft/${sc}/ephemeris.txt';
GMAT ${sc}Ephemeris.Add = {${sc}.UTCGregorian, ${sc}.${coordSys}.X, ${sc}.${coordSys}.Y, ${sc}.${coordSys}.Z};
GMAT ${sc}Ephemeris.WriteHeaders = true;
GMAT ${sc}Ephemeris.WriteReport = true;
GMAT ${sc}Ephemeris.Delimiter = ',';
GMAT ${sc}Ephemeris.FixedWidth = false;`).join('\n');

    const injectionBlock = `
%----------------------------------------
% Auto-injected ReportFiles for web orbit visualization
%----------------------------------------${reportFileBlocks}
`;

    // Insert before BeginMissionSequence (semicolon is optional in GMAT scripts)
    const bmsIndex = script.search(/BeginMissionSequence\s*;?/i);
    if (bmsIndex === -1) {
      // No BeginMissionSequence found, append at end of resources section
      return script + '\n' + injectionBlock;
    }

    // Insert the ReportFile blocks before BeginMissionSequence
    return script.slice(0, bmsIndex) + injectionBlock + '\n' + script.slice(bmsIndex);
  }

  /**
   * Convert GMAT Gregorian timestamps to ISO 8601 format
   * @param {string} content - File content with GMAT timestamps
   * @returns {string} Content with ISO formatted timestamps
   */
  _convertGmatToIsoTimestamp(content) {
    // Convert "01 Jan 2000 12:00:00.000" to "2000-01-01 12:00:00.00000"
    const months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
                    Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
    return content.replace(/(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+(\d{2}:\d{2}:\d{2}\.\d+)/g,
      (_, day, mon, year, time) => `${year}-${months[mon]}-${day} ${time.padEnd(14, '0')}`);
  }

  /**
   * Inject ReportFile paths for solvers to organize output under /tmp/Solvers/{name}/
   * @param {string} script - The original script
   * @returns {string} The script with injected solver ReportFile properties
   */
  _injectSolverReportFiles(script) {
    // Find all solvers in the script (DifferentialCorrector, VF13ad, etc.)
    const solverTypes = ['DifferentialCorrector', 'VF13ad', 'FminconOptimizer', 'Yukon'];
    const solvers = [];

    for (const type of solverTypes) {
      const regex = new RegExp(`Create\\s+${type}\\s+(\\w+)`, 'g');
      const matches = script.matchAll(regex);
      for (const match of matches) {
        solvers.push({ name: match[1], type });
      }
    }

    if (solvers.length === 0) {
      return script;
    }

    // For each solver, extract existing ReportFile filename (if any) and build new path
    const injectionLines = [];
    let modifiedScript = script;

    for (const solver of solvers) {
      const reportFileRegex = new RegExp(`GMAT\\s+${solver.name}\\.ReportFile\\s*=\\s*['"]?([^'";\\n]+)['"]?\\s*;?`, 'i');
      const match = modifiedScript.match(reportFileRegex);

      let filename;
      if (match) {
        // Extract just the filename from existing path
        const existingPath = match[1].trim();
        filename = existingPath.split('/').pop() || `${solver.name}.data`;
        // Remove the existing ReportFile line
        modifiedScript = modifiedScript.replace(reportFileRegex, '');
      } else {
        filename = `${solver.name}.data`;
      }

      injectionLines.push(`GMAT ${solver.name}.ReportFile = '/tmp/Solvers/${solver.name}/${filename}';`);
    }

    const injectionBlock = `
%----------------------------------------
% Auto-injected Solver ReportFile paths
%----------------------------------------
${injectionLines.join('\n')}
`;

    // Insert before BeginMissionSequence
    const bmsIndex = modifiedScript.search(/BeginMissionSequence\s*;?/i);
    if (bmsIndex === -1) {
      return modifiedScript + '\n' + injectionBlock;
    }

    return modifiedScript.slice(0, bmsIndex) + injectionBlock + '\n' + modifiedScript.slice(bmsIndex);
  }

  /**
   * Clear the workspace
   */
  clear() {
    this.store.clearAll();
    this.tabMgr.closeAll();
    this.console.clear();
    this.orbitViewer.clear();
    this.resourceTree.refresh();
    this.missionCtrl.render();
    this._currentFilename = 'gmat_script.script';
    this._loadedScriptName = null;
    this._updateScriptName('');
    this.console.append('Workspace cleared');
  }

  // ─────────────────────────────────────────────────────────────────
  // Private initialization methods
  // ─────────────────────────────────────────────────────────────────

  _initLeftPanelTabs() {
    const leftTabs = document.querySelectorAll('.left-tab');
    leftTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        leftTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.left-panel-content').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(tab.dataset.tab + '-panel');
        if (panel) panel.classList.add('active');
      });
    });
  }

  _initResourceTree() {
    const resourcesPanel = this.config.resourcesPanelEl;
    if (!resourcesPanel) return;

    // Create toolbar
    const treeToolbar = document.createElement('div');
    treeToolbar.className = 'tree-toolbar';
    treeToolbar.innerHTML = '<button id="tree-toggle-all">Expand All</button>';
    resourcesPanel.appendChild(treeToolbar);

    // Create tree container
    const treeContainer = document.createElement('div');
    treeContainer.className = 'tree-content';
    resourcesPanel.appendChild(treeContainer);

    // Initialize tree view and controller
    const treeView = new TreeView(treeContainer, {});
    this.resourceTree = new ResourceTreeCtrl(treeView, this.store, this);

    // Toggle expand/collapse
    let treeExpanded = false;
    document.getElementById('tree-toggle-all').addEventListener('click', (e) => {
      if (treeExpanded) {
        treeView.collapseAll();
        e.target.textContent = 'Expand All';
      } else {
        treeView.expandAll();
        e.target.textContent = 'Collapse All';
      }
      treeExpanded = !treeExpanded;
    });
  }

  _initMissionPanel() {
    if (!this.config.missionPanelEl) return;
    this.missionCtrl = new MissionPanelCtrl(
      this.config.missionPanelEl,
      this.store,
      this
    );
    this.missionCtrl.render();
  }

  _initScriptEditor() {
    const editorEl = document.createElement('div');
    editorEl.className = 'script-editor-wrap';
    editorEl.innerHTML = `
      <div class="find-bar" id="find-bar">
        <input type="text" id="find-input" placeholder="Find...">
        <button id="find-next-btn">Next</button>
        <button id="find-prev-btn">Prev</button>
        <span class="find-count" id="find-count"></span>
        <input type="text" id="replace-input" placeholder="Replace...">
        <button id="replace-btn">Replace</button>
        <button id="replace-all-btn">Replace All</button>
        <span class="find-close" id="find-close">\u00D7</span>
      </div>
      <div class="script-toolbar">
        <button id="btn-gen-script">Generate from GUI</button>
        <button id="btn-save-script-as">Save Script</button>
        <span id="script-name" style="margin-left:12px;font-size:11px;color:var(--subtext0);font-style:italic" title=""></span>
        <span class="spacer"></span>
        <span style="font-size:11px;color:var(--overlay0)">F5 to run | Ctrl+S to save</span>
      </div>
      <div class="script-editor-container">
        <div class="script-line-numbers" id="script-line-numbers"></div>
        <pre class="script-highlight" id="script-highlight" aria-hidden="true"><code class="language-matlab"></code></pre>
        <textarea class="script-textarea" id="script-textarea" spellcheck="false" placeholder="GMAT script will appear here..."></textarea>
      </div>
    `;
    this.tabMgr.addTab('script', 'Script Editor', editorEl, false, {}, getIcon('Script'));

    // Store references to editor elements
    const textarea = editorEl.querySelector('#script-textarea');
    const pre = editorEl.querySelector('#script-highlight');
    const codeEl = pre.querySelector('code');
    const lineNumbers = editorEl.querySelector('#script-line-numbers');
    this._scriptTextarea = textarea;
    this._scriptPre = pre;
    this._scriptCodeEl = codeEl;
    this._scriptLineNumbers = lineNumbers;
    this._scriptNameEl = editorEl.querySelector('#script-name');

    // Wire up generate button
    const genBtn = editorEl.querySelector('#btn-gen-script');
    if (genBtn && textarea) {
      genBtn.addEventListener('click', () => {
        textarea.value = this.generator.generate(this._loadedScriptName);
        this._syncHighlight();
        this._currentFilename = 'gmat_script.script';
        this._updateScriptName('(generated from GUI)');
      });
    }

    // Wire up Save Script button (saves textarea content directly)
    const saveAsBtn = editorEl.querySelector('#btn-save-script-as');
    if (saveAsBtn) {
      saveAsBtn.addEventListener('click', () => this._saveScriptAs());
    }

    // Wire up highlighting, line numbers, and scroll sync
    textarea.addEventListener('input', () => this._syncHighlight());
    textarea.addEventListener('scroll', () => {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
      lineNumbers.scrollTop = textarea.scrollTop;
    });

    // Tab key handling for indentation
    textarea.addEventListener('keydown', e => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = textarea.selectionStart, end = textarea.selectionEnd;
        textarea.setRangeText('   ', start, end, 'end');
        this._syncHighlight();
      }
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this._unindent();
        this._syncHighlight();
      }
    });
  }

  _initOrbitViewer() {
    const orbitEl = document.createElement('div');
    orbitEl.className = 'orbit-view-wrap';
    orbitEl.innerHTML = `
      <div class="orbit-toolbar">
        <button id="orbit-reset-view">Reset View</button>
        <button id="orbit-toggle-grid">Toggle Grid</button>
        <button id="orbit-toggle-axes">Toggle Axes</button>
      </div>
      <div class="orbit-container" id="orbit-container"></div>
    `;
    this.tabMgr.addTab('orbit', 'Orbit View', orbitEl, false, {}, getIcon('OrbitViewer'));

    // Initialize viewer when tab is shown
    this.tabMgr.onTabActivate = (tabId) => {
      if (tabId === 'orbit') {
        const container = orbitEl.querySelector('#orbit-container');
        if (container && !this.orbitViewer.initialized) {
          // Get shaders from the page (embedded in script tags)
          const earthVertex = document.getElementById('earthVertex')?.textContent || '';
          const earthFragment = document.getElementById('earthFragment')?.textContent || '';
          const atmosVertex = document.getElementById('atmosVertex')?.textContent || '';
          const atmosFragment = document.getElementById('atmosFragment')?.textContent || '';

          // Initialize the viewer with shaders
          this.orbitViewer.init(earthVertex, earthFragment, atmosVertex, atmosFragment);

          // Mount the viewer element into the container
          container.appendChild(this.orbitViewer.el);
        }
      }
    };

    // Wire up toolbar buttons
    orbitEl.querySelector('#orbit-reset-view')?.addEventListener('click', () => {
      this.orbitViewer.resetView();
    });
    orbitEl.querySelector('#orbit-toggle-grid')?.addEventListener('click', () => {
      this.orbitViewer.toggleGrid();
    });
    orbitEl.querySelector('#orbit-toggle-axes')?.addEventListener('click', () => {
      this.orbitViewer.toggleAxes();
    });
  }

  _initReportViewer() {
    // Add the Report Output tab (non-closeable)
    this.tabMgr.addTab('report', 'Report Output', this.reportViewer.el, false, {}, getIcon('ReportFile'));
  }

  _initRouter() {
    this.router = new GmatRouter(this);
    this.router.listen();

    // Update URL when sub-tabs change (e.g., Spacecraft Visualization tab)
    this.config.tabContentEl?.addEventListener('subtabchange', (e) => {
      const { tabIndex, panelName, panelType } = e.detail;
      const subTabName = this.router.subTabName(panelType, tabIndex);
      this.router.pushState(panelType, panelName, subTabName);
    });

    // Handle initial URL if present
    this.router.handleNavigation();
  }

  _initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // F5 to run
      if (e.key === 'F5') {
        e.preventDefault();
        this.run();
      }
      // F7 to show script
      if (e.key === 'F7') {
        e.preventDefault();
        this.generateScript();
      }
      // Ctrl/Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._saveScript();
      }
      // Ctrl/Cmd+O to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        this._openScript();
      }
      // Ctrl/Cmd+F to find (in script editor)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        const findBar = document.getElementById('find-bar');
        if (findBar && this.tabMgr.getActiveTabId() === 'script') {
          e.preventDefault();
          findBar.classList.toggle('visible');
          if (findBar.classList.contains('visible')) {
            document.getElementById('find-input')?.focus();
          }
        }
      }
    });
  }

  _initToolbar() {
    // New button
    document.getElementById('btn-new')?.addEventListener('click', () => {
      if (confirm('Clear workspace and start new?')) {
        this.clear();
      }
    });

    // Open button
    document.getElementById('btn-open')?.addEventListener('click', () => {
      this._openScript();
    });

    // Save button
    document.getElementById('btn-save')?.addEventListener('click', () => {
      this._saveScript();
    });

    // Run button
    document.getElementById('btn-run')?.addEventListener('click', () => {
      this.run();
    });

    // Stop button
    document.getElementById('btn-stop')?.addEventListener('click', () => {
      this.runner.stop();
    });
  }

  _saveScript() {
    const script = this.generator.generate(this._loadedScriptName);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this._currentFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.console.append(`Script saved as ${this._currentFilename}`);
  }

  /**
   * Save the current textarea content directly (not regenerated from store)
   */
  _saveScriptAs() {
    const script = this._scriptTextarea?.value || '';
    if (!script.trim()) {
      this.console.error('[No script content to save]');
      return;
    }
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this._currentFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.console.append(`Script saved as ${this._currentFilename}`);
  }

  _openScript() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.script,.gmat,.txt';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this._currentFilename = file.name;
      const text = await file.text();
      this._loadScriptText(text, file.name);
      this.tabMgr.activate('script');
    });
    input.click();
  }

  /**
   * Load script text into the editor and parse it to populate GUI
   * @param {string} text - The script text
   * @param {string} filename - Optional filename for logging
   */
  _loadScriptText(text, filename = 'script') {
    // Track source script name for generator header
    this._loadedScriptName = filename;

    // Update textarea
    if (this._scriptTextarea) {
      this._scriptTextarea.value = text;
      this._syncHighlight();
    }

    // Update script name display
    this._updateScriptName(filename);

    // Also add to scripts store (strip .script extension for display name)
    const scriptName = filename.replace(/\.script$/i, '');
    if (!this.store.getScript(scriptName)) {
      this.store.addScript(scriptName, text, filename);
    } else {
      this.store.updateScript(scriptName, text);
    }

    // Pause notifications during batch parse to avoid intermediate refreshes
    this.store.pauseNotifications();

    // Parse script and populate store
    const result = this.interpreter.interpret(text);

    // Resume notifications
    this.store.resumeNotifications();

    // Refresh GUI elements once (authoritative update)
    if (this.resourceTree) this.resourceTree.refresh();
    if (this.missionCtrl) this.missionCtrl.render();

    // Close any open object panels (they may be stale)
    this.tabMgr.closeAll();

    // Log result
    if (result.success) {
      this.console.append(`Loaded script: ${filename}`);
      const objCount = this.store.objects.size;
      const cmdCount = this.store.missionSequence.length;
      this.console.append(`  Parsed ${objCount} objects, ${cmdCount} mission commands`);
    } else {
      this.console.append(`Loaded script: ${filename} (with warnings)`);
      for (const err of result.errors.slice(0, 5)) {
        this.console.error(`  ${err}`);
      }
      if (result.errors.length > 5) {
        this.console.error(`  ... and ${result.errors.length - 5} more warnings`);
      }
    }
  }

  _syncHighlight() {
    const ta = this._scriptTextarea;
    const codeEl = this._scriptCodeEl;
    const lineNumbers = this._scriptLineNumbers;
    if (!ta || !codeEl) return;

    // Update syntax highlighting
    if (window.hljs) {
      const result = window.hljs.highlight(ta.value, { language: 'matlab' });
      codeEl.innerHTML = result.value + '\n';
    } else {
      codeEl.textContent = ta.value + '\n';
    }

    // Update line numbers
    if (lineNumbers) {
      const lines = ta.value.split('\n');
      const lineCount = lines.length;
      let html = '';
      for (let i = 1; i <= lineCount; i++) {
        html += `<div class="line-number">${i}</div>`;
      }
      lineNumbers.innerHTML = html;
    }
  }

  _updateScriptName(name, path = '') {
    // Update the inline script name display
    if (this._scriptNameEl) {
      this._scriptNameEl.textContent = name;
      this._scriptNameEl.title = path || name;
    }
    // Update the tab title
    const tabLabel = name && !name.startsWith('(') ? name : 'Script Editor';
    this.tabMgr.setTabLabel('script', tabLabel);
  }

  _unindent() {
    const ta = this._scriptTextarea;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const text = ta.value;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', end);
    const block = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
    const lines = block.split('\n');
    const modified = lines.map(l => l.replace(/^   /, '')).join('\n');
    ta.setRangeText(modified, lineStart, lineEnd === -1 ? text.length : lineEnd, 'end');
    ta.focus();
  }

  _setStatus(status) {
    if (this._statusEl) {
      const statusMap = {
        loading: 'Loading WASM...',
        ready: 'Ready',
        running: 'Running...',
        error: 'Error',
      };
      this._statusEl.textContent = statusMap[status] || status;
      this._statusEl.className = status;
    }
    // Enable/disable run button based on status
    const runBtn = document.getElementById('btn-run');
    if (runBtn) {
      runBtn.disabled = (status === 'loading' || status === 'running');
    }
  }

  /**
   * Create default GMAT objects for a new mission
   */
  _loadDefaults() {
    // Default spacecraft
    this.store.createObject('Spacecraft', 'DefaultSC');

    // Default propagator with force model
    this.store.createObject('ForceModel', 'DefaultProp_ForceModel');
    this.store.createObject('Propagator', 'DefaultProp');
    this.store.setProperty('DefaultProp', 'FM', 'DefaultProp_ForceModel');

    // Default report file
    this.store.createObject('ReportFile', 'DefaultReport');
    this.store.setProperty('DefaultReport', 'Add', [
      'DefaultSC.UTCGregorian',
      'DefaultSC.EarthMJ2000Eq.X',
      'DefaultSC.EarthMJ2000Eq.Y',
      'DefaultSC.EarthMJ2000Eq.Z',
    ]);

    // Default mission sequence: propagate for 1 day
    this.store.addCommand({
      type: 'Propagate',
      propagator: 'DefaultProp',
      spacecraft: 'DefaultSC',
      stopCondition: { param: 'DefaultSC.ElapsedDays', value: 1 },
    });
  }

  /**
   * Load default sample script at startup
   */
  async _loadDefaultSample() {
    const defaultScript = 'Ex_FiniteBurn.script';
    try {
      const response = await fetch(`./samples/${defaultScript}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const script = await response.text();
      this._loadScriptText(script, defaultScript);
      this.console.append(`[Loaded default sample: ${defaultScript}]`);
    } catch (err) {
      // Fall back to default objects if sample not available
      this.console.append(`[Could not load ${defaultScript}: ${err.message}]`);
      this.console.append('[Loading default mission instead]');
      this._loadDefaults();
      this.resourceTree.refresh();
      this.missionCtrl.render();
      this._generateScriptSilent();
    }
  }
}
