#!/usr/bin/env node
/**
 * generate-ui.mjs — Build-time UI generator from ui-definition.yaml
 *
 * Converts a YAML UI definition into:
 *   - styles.css      (concatenated CSS from styles section)
 *   - ui-config.js    (ES module with UI structure)
 *   - index.html      (generated HTML)
 *
 * Usage:
 *   node generate-ui.mjs <yaml-file> [output-dir]
 *
 * Example:
 *   node generate-ui.mjs ui-definition.yaml /tmp/gmat
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// js-yaml is required - check if available
let yaml;
try {
  yaml = await import('js-yaml');
} catch (e) {
  console.error('Error: js-yaml is required. Install with: npm install js-yaml');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// =============================================================================
// CLI Arguments
// =============================================================================

const args = process.argv.slice(2);

if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: generate-ui.mjs <yaml-file> [output-dir]

Arguments:
  yaml-file    Path to ui-definition.yaml
  output-dir   Output directory (default: /tmp/gmat)

Options:
  --help, -h   Show this help message

Example:
  node generate-ui.mjs deployments/web/src/ui-definition.yaml /tmp/gmat
`);
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
}

const yamlFile = args[0];
// Default output to same directory as YAML file (src/)
const outputDir = args[1] || dirname(args[0]);

// =============================================================================
// Parse YAML
// =============================================================================

console.log(`[generate-ui] Reading: ${yamlFile}`);

if (!existsSync(yamlFile)) {
  console.error(`Error: File not found: ${yamlFile}`);
  process.exit(1);
}

const yamlContent = readFileSync(yamlFile, 'utf8');
let ui;

try {
  ui = yaml.load(yamlContent);
} catch (e) {
  console.error(`Error parsing YAML: ${e.message}`);
  process.exit(1);
}

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

// =============================================================================
// Generate CSS
// =============================================================================

function generateCSS(styles) {
  if (!styles || typeof styles !== 'object') {
    return '/* No styles defined */\n';
  }

  // Order matters for CSS - variables should come first
  const orderedKeys = ['variables', 'global'];
  const remainingKeys = Object.keys(styles).filter(k => !orderedKeys.includes(k));
  const allKeys = [...orderedKeys.filter(k => styles[k]), ...remainingKeys];

  let css = `/*
 * styles.css — Generated from ui-definition.yaml
 * Source: deployments/web/src/ui-definition.yaml
 * DO NOT EDIT — run: task web:ui:generate
 */

`;

  for (const key of allKeys) {
    const content = styles[key];
    if (typeof content === 'string') {
      css += `/* ========== ${key} ========== */\n`;
      css += content.trim() + '\n\n';
    }
  }

  return css;
}

// =============================================================================
// Generate JS Config
// =============================================================================

function generateJSConfig(ui) {
  const config = {
    meta: ui.meta || {},
    menuBar: ui.menuBar || {},
    toolbar: ui.toolbar || {},
    layout: ui.layout || {},
    panels: ui.panels || {},
    dialogs: ui.dialogs || {},
    keyboardShortcuts: ui.keyboardShortcuts || [],
    contextMenus: ui.contextMenus || {},
    celestialBodies: ui.celestialBodies || {},
  };

  return `/**
 * ui-config.js — Generated from ui-definition.yaml
 * Source: deployments/web/src/ui-definition.yaml
 * DO NOT EDIT — run: task web:ui:generate
 */

export const UI_CONFIG = ${JSON.stringify(config, null, 2)};

// Convenience exports
export const { meta, menuBar, toolbar, layout, panels, dialogs, keyboardShortcuts, contextMenus, celestialBodies } = UI_CONFIG;

export default UI_CONFIG;
`;
}

// =============================================================================
// Generate HTML (matching original structure for compatibility)
// =============================================================================

function generateHTML(ui) {
  const name = ui.name || 'GMAT Web GUI';
  const menuBar = ui.menuBar || {};
  const toolbar = ui.toolbar || {};
  const layout = ui.layout || {};

  // Generate menu bar HTML (using original class names: .menu-dropdown-item, <hr> separators)
  function renderMenuBar(menuBar) {
    if (!menuBar.items || !Array.isArray(menuBar.items)) return '';

    let html = '  <nav id="menu-bar">\n';
    for (const menu of menuBar.items) {
      const menuId = menu.label === 'Help' ? ' id="menu-help-top"' : '';
      html += `    <div class="menu-item"${menuId}>${menu.label}\n`;
      html += '      <div class="menu-dropdown">\n';
      for (const item of menu.items || []) {
        if (item.separator) {
          html += '        <hr>\n';
        } else {
          const shortcut = item.shortcut ? ` <span class="shortcut">${item.shortcut}</span>` : '';
          html += `        <div class="menu-dropdown-item" id="${item.id}">${item.label}${shortcut}</div>\n`;
        }
      }
      html += '      </div>\n';
      html += '    </div>\n';
    }
    html += '    <span id="version-info"></span>\n';
    html += '  </nav>\n';
    return html;
  }

  // Generate toolbar HTML (using original class names: .tb-btn, .tb-sep, #status-indicator)
  function renderToolbar(toolbar) {
    if (!toolbar.items || !Array.isArray(toolbar.items)) return '';

    let html = '  <div id="toolbar">\n';
    for (const btn of toolbar.items) {
      if (btn.separator) {
        html += '    <div class="tb-sep"></div>\n';
      } else if (btn.type === 'status') {
        // Status indicator
        const statusClass = btn.class ? ` class="${btn.class}"` : '';
        html += `    <span id="${btn.id}"${statusClass}>${btn.initialText || 'Ready'}</span>\n`;
      } else {
        const primary = btn.style === 'primary' ? ' primary' : '';
        const disabled = btn.disabled ? ' disabled' : '';
        const title = btn.title || btn.label;
        html += `    <button class="tb-btn${primary}" id="${btn.id}"${disabled} title="${title}">${btn.label}</button>\n`;
      }
    }
    html += '  </div>\n';
    return html;
  }

  // Generate left panel tabs (using original structure: button.left-tab, .left-panel-content)
  function renderLeftPanel(layout) {
    const leftPanel = layout.children?.find(c => c.id === 'left-panel');
    if (!leftPanel || !leftPanel.tabs) return '    <div id="left-tabs"></div>\n';

    let tabsHtml = '    <div id="left-tabs">\n';
    for (const tab of leftPanel.tabs) {
      const active = tab.default ? ' active' : '';
      tabsHtml += `      <button class="left-tab${active}" data-tab="${tab.id}">${tab.label}</button>\n`;
    }
    tabsHtml += '    </div>\n';

    let contentHtml = '';
    for (const tab of leftPanel.tabs) {
      const active = tab.default ? ' active' : '';
      const defaultContent = tab.id === 'output'
        ? '\n      <div style="padding:12px;color:var(--overlay0);font-size:12px;">Run a mission to see outputs here.</div>'
        : '';
      contentHtml += `    <div id="${tab.id}-panel" class="left-panel-content${active}">${defaultContent}</div>\n`;
    }

    return tabsHtml + contentHtml;
  }

  // Earth and Atmosphere shaders (required for 3D orbit viewer)
  const shaders = `
<!-- Earth vertex shader -->
<script id="earthVertex" type="x-shader/x-vertex">
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
</script>

<!-- Earth fragment shader -->
<script id="earthFragment" type="x-shader/x-fragment">
precision highp float;
uniform sampler2D uDayTexture;
uniform vec3 uSunDirection;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);
    float sunDot = dot(normal, uSunDirection);
    float dayFactor = smoothstep(-0.1, 0.2, sunDot);
    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    float lum = dot(dayColor, vec3(0.299, 0.587, 0.114));
    vec3 nightBase = dayColor * 0.015;
    float landMask = smoothstep(0.08, 0.18, lum) * smoothstep(0.6, 0.3, lum);
    vec2 gridUv = vUv * vec2(400.0, 200.0);
    vec2 cell = floor(gridUv);
    float hash = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
    float lightDot = step(0.72, hash) * landMask;
    vec3 nightColor = nightBase + vec3(1.0, 0.85, 0.55) * lightDot * 0.5;
    vec3 color = mix(nightColor, dayColor, dayFactor);
    float oceanMask = smoothstep(0.18, 0.06, lum);
    vec3 halfDir = normalize(uSunDirection + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 80.0);
    color += vec3(1.0, 0.97, 0.92) * spec * oceanMask * dayFactor * 0.6;
    float fresnel = 1.0 - dot(viewDir, normal);
    fresnel = pow(fresnel, 3.0);
    vec3 atmosColor = vec3(0.3, 0.6, 1.0);
    float twilightFactor = smoothstep(-0.1, 0.0, sunDot) * smoothstep(0.2, 0.05, sunDot);
    vec3 twilightColor = mix(atmosColor, vec3(0.9, 0.4, 0.1), twilightFactor * 0.6);
    color = mix(color, twilightColor, fresnel * 0.5 * smoothstep(-0.2, 0.3, sunDot));
    gl_FragColor = vec4(color, 1.0);
}
</script>

<!-- Atmosphere vertex shader -->
<script id="atmosVertex" type="x-shader/x-vertex">
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
</script>

<!-- Atmosphere fragment shader -->
<script id="atmosFragment" type="x-shader/x-fragment">
precision highp float;
uniform vec3 uSunDirection;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);
    float fresnel = dot(viewDir, normal);
    fresnel = pow(fresnel, 2.0);
    float sunFacing = dot(normal, uSunDirection);
    float intensity = sunFacing * 0.6 + 0.4;
    intensity = max(intensity, 0.0);
    float twilight = smoothstep(-0.2, 0.0, sunFacing) * smoothstep(0.3, 0.0, sunFacing);
    vec3 dayAtmos = vec3(0.3, 0.6, 1.0);
    vec3 twilightAtmos = vec3(0.8, 0.35, 0.05);
    vec3 atmosColor = mix(dayAtmos, twilightAtmos, twilight * 0.7);
    float alpha = fresnel * intensity * 0.65;
    gl_FragColor = vec4(atmosColor, alpha);
}
</script>
`;

  const html = `<!DOCTYPE html>
<!--
  index.html — Generated from ui-definition.yaml
  Source: deployments/web/src/ui-definition.yaml
  DO NOT EDIT — run: task web:ui:generate
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GMAT — Web GUI</title>
<link rel="icon" type="image/x-icon" href="./assets/GMAT.ico">
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.172.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.172.0/examples/jsm/"
  }
}
</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/default.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/matlab.min.js"></script>
<link rel="stylesheet" href="./styles.css">
</head>
<body>

<!-- Header: Menu Bar + Toolbar -->
<header id="app-header">
${renderMenuBar(menuBar)}${renderToolbar(toolbar)}  <input type="file" id="file-input" accept=".script,.gmat,.txt" style="display:none">
</header>

<!-- App Body: Left Panel + Resize + Main Content -->
<div id="app-body">
  <aside id="left-panel">
${renderLeftPanel(layout)}  </aside>
  <div class="resize-h" id="resize-h"></div>
  <main id="main-content">
    <div id="tab-bar"></div>
    <div id="tab-content"></div>
  </main>
</div>

<!-- Console Panel -->
<div id="resize-v"></div>
<div id="console-panel">
  <div id="console-header">
    Console Output
    <span class="spacer"></span>
    <span id="console-line-count">0 lines</span>
    <button id="console-clear-btn">Clear</button>
  </div>
  <div id="console-output"></div>
</div>

<!-- Welcome / About Dialog -->
<div class="dialog-overlay" id="dialog-overlay">
  <div class="dialog" id="dialog-content"></div>
</div>
${shaders}
<!-- Application JavaScript (ES Module) -->
<script type="module" src="./main.js"></script>
</body>
</html>
`;

  return html;
}

// =============================================================================
// Write Output Files
// =============================================================================

console.log(`[generate-ui] Output directory: ${outputDir}`);

const yamlDir = dirname(yamlFile);
const cssPath = join(outputDir, 'styles.css');
const jsPath = join(outputDir, 'ui-config.js');
const htmlPath = join(outputDir, 'index.html');

// CSS: always generate from YAML
const css = generateCSS(ui.styles);
writeFileSync(cssPath, css);
console.log(`[generate-ui] Generated: ${cssPath} (${css.length} bytes)`);

// Generate and write JS config (always generated from YAML)
const jsConfig = generateJSConfig(ui);
writeFileSync(jsPath, jsConfig);
console.log(`[generate-ui] Generated: ${jsPath} (${jsConfig.length} bytes)`);

// HTML: always generate from YAML
const html = generateHTML(ui);
writeFileSync(htmlPath, html);
console.log(`[generate-ui] Generated: ${htmlPath} (${html.length} bytes)`);

// Only copy files if output directory differs from source directory
// (When outputting to src/, these files are already in place)
if (outputDir !== yamlDir) {
  // Copy additional files from YAML directory to output directory
  const filesToCopy = ['main.js', 'sw.js'];

  for (const file of filesToCopy) {
    const srcPath = join(yamlDir, file);
    if (existsSync(srcPath)) {
      const content = readFileSync(srcPath);
      const destPath = join(outputDir, file);
      writeFileSync(destPath, content);
      console.log(`[generate-ui] Copied: ${destPath}`);
    }
  }

  // Copy assets from src/assets/ to output/assets/
  const assetsDir = join(yamlDir, 'assets');
  const outputAssetsDir = join(outputDir, 'assets');
  const assetsToCopy = ['GMAT.ico'];

  if (existsSync(assetsDir)) {
    // Create output assets directory if needed
    if (!existsSync(outputAssetsDir)) {
      mkdirSync(outputAssetsDir, { recursive: true });
    }

    for (const file of assetsToCopy) {
      const srcPath = join(assetsDir, file);
      if (existsSync(srcPath)) {
        const content = readFileSync(srcPath);
        const destPath = join(outputAssetsDir, file);
        writeFileSync(destPath, content);
        console.log(`[generate-ui] Copied: ${destPath}`);
      }
    }
  }
}

console.log(`[generate-ui] Done! Open ${join(outputDir, 'index.html')} in a browser.`);
