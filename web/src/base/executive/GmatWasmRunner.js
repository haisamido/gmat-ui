/**
 * GmatWasmRunner.js — WASM module lifecycle management
 *
 * Loads the GmatConsole WASM module and provides script execution.
 *
 * C++ reference: src/console/driver.cpp
 */

import { preprocessScript } from '../interpreter/WasmScriptPreprocessor.js';

export class GmatWasmRunner {
  constructor(opts = {}) {
    this.onStdout = opts.onStdout || (() => {});
    this.onStderr = opts.onStderr || (() => {});
    this.onStatus = opts.onStatus || (() => {});
    this.isRunning = false;
    this.moduleReady = false;
    this.lastModule = null;
    this._createModule = opts.createModule || null;
    this._locatePath = opts.locatePath || ((path) => '../' + path);
  }

  async init() {
    // Try global createGmatModule if not provided via constructor
    if (!this._createModule && typeof window !== 'undefined' && window.createGmatModule) {
      this._createModule = window.createGmatModule;
    }
    if (!this._createModule) {
      throw new Error('createModule function not provided (ensure GmatConsole.js is loaded)');
    }
    this.onStatus('loading');
    try {
      const mod = await this._createModule(this._config());
      try { mod.FS.stat('/application/bin/gmat_startup_file.txt'); } catch(e) {
        throw new Error('Startup file not found');
      }
      try { mod.FS.stat('/application/data'); } catch(e) {
        throw new Error('Data directory not found');
      }
      this.moduleReady = true;
      this.onStatus('ready');
    } catch(e) {
      this.onStatus('error');
      throw e;
    }
  }

  async runScript(scriptText) {
    if (!this.moduleReady || this.isRunning) return null;
    if (!this._createModule) return null;
    this.isRunning = true;
    this.onStatus('running');

    let exitCode = -1;
    const outputs = {};

    try {
      const mod = await this._createModule(this._config());
      this._setupFS(mod);

      // Strip unsupported object types (disabled plugins, GUI-only objects)
      const { script: cleanedScript, removed } = preprocessScript(scriptText);
      if (removed.length > 0) {
        this.onStdout('[Preprocessor] Stripped unsupported objects: ' + removed.join(', '));
      }

      // Create directories for output files referenced in script (ReportFile, EphemerisFile, etc.)
      this._createOutputDirs(mod, cleanedScript);

      mod.FS.writeFile('/tmp/user_script.gmat', cleanedScript);

      await new Promise(r => setTimeout(r, 50));

      try {
        exitCode = mod.callMain(['--run', '/tmp/user_script.gmat']);
      } catch(e) {
        if (e && typeof e.status === 'number') {
          exitCode = e.status;
        } else {
          const msg = e instanceof Error ? e.message
            : typeof e === 'number' ? 'C++ exception (ptr=' + e + ')'
            : String(e);
          this.onStderr('[GMAT error: ' + msg + ']');
          exitCode = -1;
        }
      }

      // Read output files from all locations where GMAT might write
      outputs.files = {};
      this._readFilesRecursive(mod, '/tmp', outputs.files);
      this._readFilesRecursive(mod, '/application/output', outputs.files);
      this._readFilesRecursive(mod, '/application/bin', outputs.files);

      // Clean up GMAT output: strip consecutive commas (GMAT adds extra commas due to fixed column width)
      for (const [path, content] of Object.entries(outputs.files)) {
        if (typeof content === 'string' && content.includes(',')) {
          outputs.files[path] = content.replace(/,{2,}/g, ',').replace(/,\s*\n/g, '\n');
        }
      }

      // Transform output paths to organized structure under /application/output/
      this._organizeOutputFiles(outputs.files);

      // Back-compat: keep outputs.report for orbit plotting
      // Look for gmat_output.txt in spacecraft directories or root output
      outputs.report = null;
      for (const path of Object.keys(outputs.files)) {
        if (path.endsWith('/gmat_output.txt')) {
          outputs.report = outputs.files[path];
          break;
        }
      }
      this.lastModule = mod;
    } catch(e) {
      this.onStderr('[Module error: ' + (e.message || e) + ']');
    }

    this.isRunning = false;
    this.onStatus(exitCode === 0 ? 'ready' : 'error');
    return { exitCode, outputs };
  }

  stop() {
    // WASM execution is synchronous, so stop is a placeholder.
    // The script runs to completion in a single call.
  }

  // Alias for runScript (used by GmatApp)
  run(scriptText) {
    return this.runScript(scriptText);
  }

  _config() {
    return {
      locateFile: this._locatePath,
      print: (text) => this.onStdout(text),
      printErr: (text) => this.onStderr(text),
      onAbort: (what) => this.onStderr('[ABORT] ' + what),
    };
  }

  _setupFS(mod) {
    for (const d of ['/application/output', '/application/docs', '/application/docs/help',
      '/application/userincludes', '/application/userfunctions',
      '/application/userfunctions/gmat', '/tmp']) {
      try { mod.FS.mkdir(d); } catch(e) {}
    }
    mod.FS.chdir('/application/bin');
  }

  /**
   * Create parent directories for output files referenced in the script
   * @param {Object} mod - Emscripten module with FS
   * @param {string} scriptText - GMAT script text
   */
  _createOutputDirs(mod, scriptText) {
    // Match Filename and ReportFile properties (for ReportFile, EphemerisFile, Solvers, etc.)
    const filenameMatches = scriptText.matchAll(/\.(Filename|ReportFile)\s*=\s*['"]?([^'"\s;]+)/gi);
    for (const match of filenameMatches) {
      const filepath = match[2];
      if (filepath.startsWith('/')) {
        // Create parent directories recursively
        const parts = filepath.split('/').slice(1, -1); // Remove empty first element and filename
        let path = '';
        for (const part of parts) {
          path += '/' + part;
          try { mod.FS.mkdir(path); } catch(e) { /* already exists */ }
        }
      }
    }
  }

  /**
   * Organize output files - move all files from /tmp/ to /application/output/
   * @param {Object} files - Object mapping paths to content (modified in place)
   */
  _organizeOutputFiles(files) {
    for (const path of Object.keys(files)) {
      // Remove internal GMAT files
      if (path.endsWith('.gmat') || path.includes('gmat_startup')) {
        delete files[path];
        continue;
      }
      // Move /tmp/Solvers/ to /application/output/Resources/Solvers/
      if (path.startsWith('/tmp/Solvers/')) {
        const newPath = '/application/output/Resources/Solvers' + path.slice(12); // Replace /tmp/Solvers with /application/output/Resources/Solvers
        files[newPath] = files[path];
        delete files[path];
        continue;
      }
      // Move all other /tmp/ files to /application/output/
      if (path.startsWith('/tmp/')) {
        const newPath = '/application/output' + path.slice(4); // Replace /tmp with /application/output
        files[newPath] = files[path];
        delete files[path];
      }
    }
  }

  /**
   * Recursively read all files from a directory
   * @param {Object} mod - Emscripten module with FS
   * @param {string} dir - Directory path to read
   * @param {Object} files - Object to store file contents (path -> content)
   */
  _readFilesRecursive(mod, dir, files) {
    try {
      const entries = mod.FS.readdir(dir).filter(f => f !== '.' && f !== '..');
      for (const name of entries) {
        const path = dir + '/' + name;
        try {
          const stat = mod.FS.stat(path);
          if (mod.FS.isFile(stat.mode)) {
            files[path] = mod.FS.readFile(path, { encoding: 'utf8' });
          } else if (mod.FS.isDir(stat.mode)) {
            // Recurse into subdirectories
            this._readFilesRecursive(mod, path, files);
          }
        } catch(_) {}
      }
    } catch(_) {}
  }
}
