/**
 * main.js — Entry point for GMAT Web GUI (Modular Architecture)
 *
 * This file initializes the application using the modular component architecture.
 * The src/gui/ modules are copied to ./core/ during build.
 */

// Import from the core modules (src/gui/ is copied to ./core/ during build)
import { GmatApp } from './core/app/GmatApp.js';
import { OrbitViewer, ModelPreview } from './core/orbit/OrbitView.js';

// ============================================================================
// Session ID — unique per browser tab session
// ============================================================================

const SESSION_ID = sessionStorage.getItem('gmat-session-id') ||
  (() => {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    sessionStorage.setItem('gmat-session-id', id);
    return id;
  })();

// Make session ID available globally
window.GMAT_SESSION_ID = SESSION_ID;

// Fetch and display version info (hash, server ID, client session ID)
async function updateVersionInfo() {
  const el = document.getElementById('version-info');
  if (!el) return;

  try {
    const response = await fetch('/version');
    if (response.ok) {
      const data = await response.json();
      const commitUrl = `${data.repoCommitUrl}${data.hashFull}`;
      el.innerHTML = `[hash:<a href="${commitUrl}" target="_blank" rel="noopener">${data.hash}</a> srv:${data.srv} cli:${SESSION_ID}]`;
    } else {
      el.textContent = `[cli:${SESSION_ID}]`;
    }
  } catch (err) {
    el.textContent = `[cli:${SESSION_ID}]`;
  }
}

// Update version info on page load
updateVersionInfo();

// Register service worker to inject X-Session-ID header on all requests
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`./sw.js?sid=${SESSION_ID}`)
    .then(reg => {
      console.log(`[SW] Registered (scope: ${reg.scope})`);
      // If not controlled yet and SW just installed, reload to activate
      if (!navigator.serviceWorker.controller && reg.installing) {
        reg.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            console.log('[SW] Activated, reloading...');
            location.reload();
          }
        });
      }
    })
    .catch(err => console.warn('[SW] Registration failed:', err));
}

// ============================================================================
// Initialize Application
// ============================================================================

async function init() {
  console.log(`[GMAT] Session ID: ${SESSION_ID}`);
  // Create the main application instance
  const app = new GmatApp({
    tabBarEl: document.getElementById('tab-bar'),
    tabContentEl: document.getElementById('tab-content'),
    consoleOutputEl: document.getElementById('console-output'),
    consoleCountEl: document.getElementById('console-line-count'),
    resourcesPanelEl: document.getElementById('resources-panel'),
    missionPanelEl: document.getElementById('mission-panel'),
    statusEl: document.getElementById('status-indicator'),
  });

  // Make app available globally for debugging
  window.gmatApp = app;

  // Initialize the application
  try {
    await app.init();
    app.console.append(`Session ID: ${SESSION_ID}`);
  } catch (err) {
    console.error('Failed to initialize GMAT application:', err);
    document.getElementById('console-output').innerHTML =
      `<span class="err">Initialization error: ${err.message}</span>\n`;
  }

  // Wire up additional UI elements not handled by GmatApp
  initDialogs(app);
  initResizeHandles();
  initMenuItems(app);
  initConsoleClear(app);

  // Show welcome dialog on first visit
  const welcomed = sessionStorage.getItem('gmat-welcomed');
  if (!welcomed) {
    showWelcomeDialog();
    sessionStorage.setItem('gmat-welcomed', 'true');
  }
}

// ============================================================================
// Console Clear Button
// ============================================================================

function initConsoleClear(app) {
  document.getElementById('console-clear-btn')?.addEventListener('click', () => {
    app.console.clear();
  });
}

// ============================================================================
// Resize Handles
// ============================================================================

function initResizeHandles() {
  // Horizontal resize (left panel)
  const resizeH = document.getElementById('resize-h');
  let isResizingH = false;

  resizeH?.addEventListener('mousedown', () => {
    isResizingH = true;
    resizeH.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizingH) {
      const newWidth = Math.max(180, Math.min(500, e.clientX));
      document.documentElement.style.setProperty('--left-width', newWidth + 'px');
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizingH) {
      isResizingH = false;
      resizeH?.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });

  // Vertical resize (console panel)
  const resizeV = document.getElementById('resize-v');
  let isResizingV = false;

  resizeV?.addEventListener('mousedown', () => {
    isResizingV = true;
    resizeV.classList.add('active');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizingV) {
      const newHeight = Math.max(28, Math.min(window.innerHeight - 200, window.innerHeight - e.clientY));
      document.documentElement.style.setProperty('--console-height', newHeight + 'px');
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizingV) {
      isResizingV = false;
      resizeV?.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// ============================================================================
// Menu Items
// ============================================================================

function initMenuItems(app) {
  // Help menu
  document.getElementById('menu-about')?.addEventListener('click', showAboutDialog);
  document.getElementById('menu-welcome')?.addEventListener('click', showWelcomeDialog);
  document.getElementById('menu-help-docs')?.addEventListener('click', () => {
    window.open('https://gmat.atlassian.net/wiki/', '_blank');
  });
  document.getElementById('menu-help-report')?.addEventListener('click', () => {
    window.open('https://github.com/nasa/GMAT/issues', '_blank');
  });
  document.getElementById('menu-help-console')?.addEventListener('click', () => {
    window.open('../index.html', '_blank');
  });
  document.getElementById('menu-help-earth')?.addEventListener('click', () => {
    window.open('../three.js/index.html', '_blank');
  });
  document.getElementById('menu-help-tutorials')?.addEventListener('click', () => {
    window.open('https://gmat.atlassian.net/wiki/spaces/GW/pages/11731071/GMAT+Tutorials', '_blank');
  });
  document.getElementById('menu-help-contents')?.addEventListener('click', () => {
    window.open('https://gmat.atlassian.net/wiki/spaces/GW/overview', '_blank');
  });

  // File menu
  document.getElementById('menu-new-mission')?.addEventListener('click', () => {
    if (confirm('Clear workspace and start new mission?')) {
      app.clear();
    }
  });
  document.getElementById('menu-new-script')?.addEventListener('click', () => {
    app.tabMgr.activate('script');
    if (app._scriptTextarea) {
      app._scriptTextarea.value = '';
    }
    app._currentFilename = 'gmat_script.script';
    app._updateScriptName('(new script)');
  });
  document.getElementById('menu-open-script')?.addEventListener('click', () => {
    app._openScript();
  });
  document.getElementById('menu-save-script')?.addEventListener('click', () => {
    app._saveScript();
  });
  document.getElementById('menu-save-script-as')?.addEventListener('click', () => {
    const newName = prompt('Save script as:', app._currentFilename);
    if (newName) {
      app._currentFilename = newName;
      app._saveScript();
    }
  });

  // Run menu
  document.getElementById('menu-run')?.addEventListener('click', () => {
    app.run();
  });
  document.getElementById('menu-stop')?.addEventListener('click', () => {
    app.runner.stop();
  });
  document.getElementById('menu-generate')?.addEventListener('click', () => {
    if (app._scriptTextarea) {
      app._scriptTextarea.value = app.generator.generate();
      app._syncHighlight();
    }
    app.tabMgr.activate('script');
  });

  // Window menu
  document.getElementById('menu-close-tab')?.addEventListener('click', () => {
    const activeId = app.tabMgr.getActiveTabId();
    if (activeId && activeId !== 'script' && activeId !== 'orbit') {
      app.tabMgr.closeTab(activeId);
    }
  });
  document.getElementById('menu-close-all')?.addEventListener('click', () => {
    app.tabMgr.closeAll();
  });
  document.getElementById('btn-close-all')?.addEventListener('click', () => {
    app.tabMgr.closeAll();
  });

  // Load Sample button
  document.getElementById('btn-example')?.addEventListener('click', () => {
    showExamplesDialog(app);
  });
}

// ============================================================================
// Dialogs
// ============================================================================

function initDialogs(app) {
  const overlay = document.getElementById('dialog-overlay');

  // Close dialog on backdrop click
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('visible');
    }
  });

  // Escape key closes dialog
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('visible')) {
      overlay.classList.remove('visible');
    }
  });
}

function showDialog(content) {
  const overlay = document.getElementById('dialog-overlay');
  const dialogContent = document.getElementById('dialog-content');
  if (overlay && dialogContent) {
    dialogContent.innerHTML = content;
    overlay.classList.add('visible');

    // Wire close button
    dialogContent.querySelector('.dialog-close')?.addEventListener('click', () => {
      overlay.classList.remove('visible');
    });
  }
}

function showAboutDialog() {
  showDialog(`
    <h2>About GMAT Web GUI</h2>
    <p>General Mission Analysis Tool (GMAT) is an open-source space mission design tool developed by NASA.</p>
    <p>This web interface runs GMAT entirely in the browser using WebAssembly.</p>
    <div class="dialog-section">
      <h3>Links</h3>
      <div class="dialog-links">
        <a href="https://gmatcentral.org" target="_blank">GMAT Central</a>
        <a href="https://github.com/nasa/GMAT" target="_blank">GitHub</a>
        <a href="https://gmat.atlassian.net/wiki/" target="_blank">Documentation</a>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="dialog-close">Close</button>
    </div>
    <div class="version-info">GMAT Web GUI — Modular Architecture<br>Session: ${SESSION_ID}</div>
  `);
}

function showWelcomeDialog() {
  showDialog(`
    <h2>Welcome to GMAT Web GUI</h2>
    <p>This is a web-based interface for the General Mission Analysis Tool (GMAT).</p>
    <div class="dialog-section">
      <h3>Getting Started</h3>
      <p>• Use the <strong>Resources</strong> panel to create spacecraft, propagators, and other objects</p>
      <p>• Use the <strong>Mission</strong> panel to build your mission sequence</p>
      <p>• Click <strong>Generate Script</strong> to see the GMAT script</p>
      <p>• Click <strong>Run</strong> (or press F5) to execute the mission</p>
    </div>
    <div class="dialog-section">
      <h3>Quick Links</h3>
      <div class="dialog-links">
        <a href="https://gmat.atlassian.net/wiki/spaces/GW/pages/11731071/GMAT+Tutorials" target="_blank">Tutorials</a>
        <a href="https://gmat.atlassian.net/wiki/spaces/GW/overview" target="_blank">User Guide</a>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="dialog-close">Get Started</button>
    </div>
  `);
}

// Sample scripts list is loaded dynamically from samples.json (generated at build time)
async function showExamplesDialog(app) {
  // Fetch the list of available samples
  let scripts = [];
  try {
    const response = await fetch('./samples/samples.json');
    if (response.ok) {
      scripts = await response.json();
    }
  } catch (err) {
    console.warn('Failed to load samples.json:', err);
  }

  if (scripts.length === 0) {
    showDialog(`
      <h2>Load Sample</h2>
      <p>No sample scripts available.</p>
      <div class="dialog-footer">
        <button class="dialog-close">Close</button>
      </div>
    `);
    return;
  }

  const listItems = scripts.map(file => `
    <div class="example-item" data-file="${file}">
      <span class="example-icon">\u{1F4C4}</span>${file}
    </div>
  `).join('');

  showDialog(`
    <h2>Load Sample</h2>
    <div class="example-list">
      ${listItems}
    </div>
    <div class="dialog-footer">
      <button class="dialog-close">Cancel</button>
    </div>
  `);

  // Wire up example item clicks
  const overlay = document.getElementById('dialog-overlay');
  document.querySelectorAll('.example-item').forEach(item => {
    item.addEventListener('click', async () => {
      const file = item.dataset.file;
      try {
        const response = await fetch(`./samples/${file}`);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        const script = await response.text();
        // Use _loadScriptText to parse and populate GUI
        app._loadScriptText(script, file);
        app.tabMgr.activate('script');
        overlay?.classList.remove('visible');
      } catch (err) {
        app.console.error(`[Failed to load example: ${err.message}]`);
      }
    });
  });
}

// ============================================================================
// Start the Application
// ============================================================================

// Load GmatConsole.js dynamically (it's in the parent directory)
// This must be loaded BEFORE initializing the app so createGmatModule is available
const wasmScript = document.createElement('script');
wasmScript.src = '../GmatConsole.js';
wasmScript.onload = () => {
  init().catch(err => {
    console.error('Application initialization failed:', err);
    const consoleOutput = document.getElementById('console-output');
    if (consoleOutput) {
      consoleOutput.innerHTML = `<span class="err">Failed to initialize: ${err.message}</span>\n`;
    }
  });
};
wasmScript.onerror = () => {
  console.warn('Failed to load GmatConsole.js - initializing UI without WASM');
  const consoleOutput = document.getElementById('console-output');
  if (consoleOutput) {
    consoleOutput.innerHTML = `<span class="warn">[WASM not loaded - ensure GmatConsole.js exists in parent directory]</span>\n`;
  }
  // Still initialize UI without WASM
  init().catch(() => {});
};
document.body.appendChild(wasmScript);
