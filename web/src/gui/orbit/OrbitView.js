/**
 * OrbitView.js — Three.js based 3D orbit visualization
 *
 * Contains:
 *   - OrbitViewer: Earth-centered orbit display with spacecraft trajectories
 *   - ModelPreview: 3D preview of spacecraft model files (.3ds)
 *
 * C++ reference: src/base/subscriber/OrbitView.cpp
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TDSLoader } from 'three/addons/loaders/TDSLoader.js';

/**
 * OrbitViewer — Earth-centered 3D orbit viewer
 */
export class OrbitViewer {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'orbit-viewer-wrap';
    this.el.innerHTML = '<div class="orbit-viewer-overlay"><strong>3D Orbit View</strong><br><span id="orbit-info"></span></div><div class="orbit-legend" style="display:none;"><div class="orbit-legend-title">Spacecraft</div><div class="orbit-legend-items"></div></div>';
    this.scene = null; this.camera = null; this.renderer = null;
    this.controls = null; this.earth = null;
    this.orbitLines = new Map();
    this.orbitColors = new Map();
    this.initialized = false;
    this.EARTH_RADIUS = 6371.0;
    this._animationId = null;
    this._isAnimating = false;
    this._lastEarthRotation = 0;
  }

  init(earthVertexShader, earthFragmentShader, atmosVertexShader, atmosFragmentShader) {
    if (this.initialized) return;
    this.initialized = true;

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.el.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 500);
    this.camera.position.set(0, 0.5, 4);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 100;
    this.controls.enablePan = false;

    // Earth texture
    const texLoader = new THREE.TextureLoader();
    const dayTex = texLoader.load('../three.js/textures/ModifiedBlueMarble.jpg');
    dayTex.colorSpace = THREE.SRGBColorSpace;
    dayTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    this.sunDirection = new THREE.Vector3(-1, 0.3, 0.5).normalize();

    // Earth mesh
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uDayTexture: { value: dayTex },
        uSunDirection: { value: new THREE.Vector3() },
      },
    });
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.scene.add(this.earth);

    // Atmosphere
    const atmosGeo = new THREE.SphereGeometry(1.04, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: atmosVertexShader,
      fragmentShader: atmosFragmentShader,
      uniforms: { uSunDirection: { value: new THREE.Vector3() } },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    this.atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.scene.add(this.atmosphere);

    // Stars
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 60 + Math.random() * 40;
      starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i*3+2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, sizeAttenuation: true })));

    // Axes helper (small, at origin) - stored in group for toggling
    this.axesGroup = new THREE.Group();
    const axLen = 1.5;
    const axesMat = [
      new THREE.LineBasicMaterial({ color: 0xff4444 }),
      new THREE.LineBasicMaterial({ color: 0x44ff44 }),
      new THREE.LineBasicMaterial({ color: 0x4444ff }),
    ];
    const axDirs = [new THREE.Vector3(axLen,0,0), new THREE.Vector3(0,axLen,0), new THREE.Vector3(0,0,axLen)];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), axDirs[i]]);
      this.axesGroup.add(new THREE.Line(g, axesMat[i]));
    }
    this.scene.add(this.axesGroup);

    // Grid helper (equatorial plane, initially hidden)
    this.gridHelper = new THREE.GridHelper(6, 30, 0x444488, 0x333366);
    this.gridHelper.material.opacity = 0.3;
    this.gridHelper.material.transparent = true;
    this.gridHelper.visible = false;
    this.scene.add(this.gridHelper);

    this._viewNormal = new THREE.Matrix3();
    this._resizeObs = new ResizeObserver(() => { this._resize(); this._requestRender(); });
    this._resizeObs.observe(this.el);
    this._resize();

    // On-demand rendering: render when controls change
    this.controls.addEventListener('change', () => this._requestRender());

    // Pause animation when tab is hidden
    this._onVisibilityChange = () => {
      if (document.hidden) {
        this._stopAnimation();
      } else {
        this._startAnimation();
      }
    };
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    // Start animation loop
    this._startAnimation();
  }

  _startAnimation() {
    if (this._isAnimating) return;
    this._isAnimating = true;
    this._lastEarthRotation = performance.now();
    this._animate();
  }

  _stopAnimation() {
    this._isAnimating = false;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  _requestRender() {
    if (!this._isAnimating) return;
    // Mark that we need a render (handled in _animate)
    this._needsRender = true;
  }

  addOrbitLine(name, positions, color = 0x00ff00) {
    this.removeOrbitLine(name);
    if (!positions || positions.length === 0) return;
    const s = 1.0 / this.EARTH_RADIUS;
    // GMAT EarthMJ2000Eq: X=equinox, Y=90deg in equatorial, Z=north pole
    // Three.js: Y=up => Three.x=GMAT.x, Three.y=GMAT.z, Three.z=-GMAT.y
    const pts = positions.map(p => new THREE.Vector3(p.x * s, p.z * s, -p.y * s));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.orbitLines.set(name, line);
    this.orbitColors.set(name, color);

    // Update info and legend
    const infoEl = this.el.querySelector('#orbit-info');
    if (infoEl) infoEl.textContent = `${this.orbitLines.size} orbit(s) plotted`;
    this._updateLegend();
    this._requestRender();
  }

  removeOrbitLine(name) {
    const line = this.orbitLines.get(name);
    if (line) { this.scene.remove(line); line.geometry.dispose(); line.material.dispose(); this.orbitLines.delete(name); this.orbitColors.delete(name); this._updateLegend(); this._requestRender(); }
  }

  clearAllOrbits() { for (const n of [...this.orbitLines.keys()]) this.removeOrbitLine(n); }

  clear() {
    this.clearAllOrbits();
  }

  /**
   * Parse GMAT report output and display trajectory
   * @param {string} reportText - Tab/space-separated report text with X, Y, Z columns
   * @param {Object} store - Optional GmatObjectStore to get spacecraft colors
   */
  setTrajectory(reportText, store = null) {
    if (!reportText || typeof reportText !== 'string') return;

    this.clearAllOrbits();

    // Parse report using same logic as GmatOutputParser
    const lines = reportText.trim().split('\n');
    const data = { headers: [], rows: [] };

    // Detect delimiter: comma if first non-comment line contains commas
    let delimiter = null;
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('%')) continue;
      delimiter = t.includes(',') ? ',' : /\s{2,}|\t/;
      break;
    }

    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('%')) continue;
      const fields = t.split(delimiter).map(s => s.trim()).filter(s => s);
      if (fields.length === 0) continue;
      // First non-comment line with non-numeric last field = headers
      // Use Number() instead of parseFloat() because parseFloat("01 Jan 2000") returns 1
      if (data.headers.length === 0 && isNaN(Number(fields[fields.length - 1]))) {
        data.headers = fields;
      } else {
        data.rows.push(fields.map(f => isNaN(Number(f)) ? f : Number(f)));
      }
    }

    if (data.rows.length === 0) return;

    // Extract positions for all spacecraft found in headers
    // Match pattern: DefaultSC.CoordSystem.X (any coordinate system)
    const scCols = new Map(); // scName -> {x, y, z}
    for (let i = 0; i < data.headers.length; i++) {
      const h = data.headers[i];
      const match = h.match(/^(\w+)\.\w+\.([XYZ])$/);
      if (match) {
        const scName = match[1];
        const axis = match[2].toLowerCase();
        if (!scCols.has(scName)) scCols.set(scName, {});
        scCols.get(scName)[axis] = i;
      }
    }

    // Add orbit line for each spacecraft with complete X, Y, Z columns
    const fallbackColors = [0xff0000, 0x00ff00, 0xffff00, 0x0000ff, 0xff00ff, 0x00ffff];
    let scIndex = 0;
    for (const [scName, cols] of scCols) {
      if (cols.x !== undefined && cols.y !== undefined && cols.z !== undefined) {
        const positions = data.rows.map(row => ({
          x: row[cols.x], y: row[cols.y], z: row[cols.z]
        })).filter(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));

        if (positions.length > 0) {
          // Get color from store if available, otherwise use fallback
          let colorHex = fallbackColors[scIndex % fallbackColors.length];
          if (store) {
            const scObj = store.getObject(scName);
            if (scObj && scObj.properties.OrbitColor) {
              colorHex = parseInt(scObj.properties.OrbitColor.replace('#', ''), 16);
            }
          }
          this.addOrbitLine(scName, positions, colorHex);
          scIndex++;
        }
      }
    }
  }

  /**
   * Load per-spacecraft ephemeris files and display trajectories
   * @param {Object} ephemerisFiles - Map of spacecraft name -> file content
   * @param {Object} store - Optional GmatObjectStore to get spacecraft colors
   */
  setEphemerisFiles(ephemerisFiles, store = null) {
    if (!ephemerisFiles || typeof ephemerisFiles !== 'object') return;

    this.clearAllOrbits();

    const fallbackColors = [0xff0000, 0x00ff00, 0xffff00, 0x0000ff, 0xff00ff, 0x00ffff];
    let scIndex = 0;

    for (const [scName, content] of Object.entries(ephemerisFiles)) {
      if (!content || typeof content !== 'string') continue;

      // Parse ephemeris file (single spacecraft, X/Y/Z columns)
      const lines = content.trim().split('\n');
      const data = { headers: [], rows: [] };

      // Detect delimiter: comma if first non-comment line contains commas
      let delimiter = null;
      for (const line of lines) {
        const t = line.trim();
        if (!t || t.startsWith('%')) continue;
        delimiter = t.includes(',') ? ',' : /\s{2,}|\t/;
        break;
      }

      for (const line of lines) {
        const t = line.trim();
        if (!t || t.startsWith('%')) continue;
        const fields = t.split(delimiter).map(s => s.trim()).filter(s => s);
        if (fields.length === 0) continue;
        // First non-comment line with non-numeric last field = headers
        // Use Number() instead of parseFloat() because parseFloat("01 Jan 2000") returns 1
        if (data.headers.length === 0 && isNaN(Number(fields[fields.length - 1]))) {
          data.headers = fields;
        } else {
          data.rows.push(fields.map(f => isNaN(Number(f)) ? f : Number(f)));
        }
      }

      if (data.rows.length === 0) continue;

      // Find X, Y, Z column indices (headers like "Sat.EarthMJ2000Eq.X")
      let xIdx = -1, yIdx = -1, zIdx = -1;
      for (let i = 0; i < data.headers.length; i++) {
        const h = data.headers[i];
        if (h.match(/\.X$/i)) xIdx = i;
        else if (h.match(/\.Y$/i)) yIdx = i;
        else if (h.match(/\.Z$/i)) zIdx = i;
      }

      if (xIdx === -1 || yIdx === -1 || zIdx === -1) continue;

      // Extract positions
      const positions = data.rows.map(row => ({
        x: row[xIdx], y: row[yIdx], z: row[zIdx]
      })).filter(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));

      if (positions.length > 0) {
        // Get color from store if available, otherwise use fallback
        let colorHex = fallbackColors[scIndex % fallbackColors.length];
        if (store) {
          const scObj = store.getObject(scName);
          if (scObj && scObj.properties.OrbitColor) {
            colorHex = parseInt(scObj.properties.OrbitColor.replace('#', ''), 16);
          }
        }
        this.addOrbitLine(scName, positions, colorHex);
        scIndex++;
      }
    }
  }

  resetView() {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 0.5, 4);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      this._requestRender();
    }
  }

  toggleGrid() {
    if (this.gridHelper) {
      this.gridHelper.visible = !this.gridHelper.visible;
      this._requestRender();
      return this.gridHelper.visible;
    }
    return false;
  }

  toggleAxes() {
    if (this.axesGroup) {
      this.axesGroup.visible = !this.axesGroup.visible;
      this._requestRender();
      return this.axesGroup.visible;
    }
    return false;
  }

  _updateLegend() {
    const legend = this.el.querySelector('.orbit-legend');
    const items = this.el.querySelector('.orbit-legend-items');
    if (!legend || !items) return;
    if (this.orbitLines.size === 0) {
      legend.style.display = 'none';
      return;
    }
    legend.style.display = 'block';
    let html = '';
    for (const [name, color] of this.orbitColors) {
      const hex = '#' + color.toString(16).padStart(6, '0');
      html += `<div class="orbit-legend-item"><span class="orbit-legend-color" style="background:${hex}"></span><span>${name}</span></div>`;
    }
    items.innerHTML = html;
  }

  _resize() {
    const rect = this.el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  _animate() {
    if (!this._isAnimating) return;
    this._animationId = requestAnimationFrame(() => this._animate());

    // Skip if not visible
    if (!this.el.offsetParent) return;

    // Update Earth rotation based on elapsed time (smooth even at lower frame rates)
    const now = performance.now();
    const delta = (now - this._lastEarthRotation) / 1000; // seconds
    this._lastEarthRotation = now;
    this.earth.rotation.y += delta * 0.018; // ~1 rotation per 6 minutes

    // Update sun direction in view space
    this._viewNormal.getNormalMatrix(this.camera.matrixWorldInverse);
    const viewSun = this.sunDirection.clone().applyMatrix3(this._viewNormal).normalize();
    this.earth.material.uniforms.uSunDirection.value.copy(viewSun);
    this.atmosphere.material.uniforms.uSunDirection.value.copy(viewSun);

    // Update controls (handles damping)
    this.controls.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this._stopAnimation();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    this._resizeObs.disconnect();
    this.clearAllOrbits();
    const gl = this.renderer.getContext();
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    this.renderer.dispose();
  }
}

/**
 * ModelPreview — 3D preview of spacecraft model files (.3ds)
 */
export class ModelPreview {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x11111b);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    this.camera.position.set(0, 1, 3);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(2, 4, 3);
    this.scene.add(dirLight);

    // Grid
    const grid = new THREE.GridHelper(4, 20, 0x444466, 0x333355);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    this.scene.add(grid);

    // Body axes — RGB = XYZ convention (matches wxWidgets VisualModelCanvas::DrawAxes)
    const axLen = 1.8;
    const axColors = [0xff0000, 0x00ff00, 0x0000ff];
    const axDirs = [new THREE.Vector3(axLen,0,0), new THREE.Vector3(0,axLen,0), new THREE.Vector3(0,0,axLen)];
    const axLabels = ['+X', '+Y', '+Z'];
    for (let i = 0; i < 3; i++) {
      // Axis line
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), axDirs[i]]);
      const mat = new THREE.LineBasicMaterial({ color: axColors[i], linewidth: 2 });
      this.scene.add(new THREE.Line(geo, mat));
      // Arrowhead cone at tip
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.15, 8),
        new THREE.MeshBasicMaterial({ color: axColors[i] })
      );
      cone.position.copy(axDirs[i]);
      if (i === 0) cone.rotation.z = -Math.PI / 2;       // +X
      else if (i === 2) cone.rotation.x = Math.PI / 2;   // +Z
      // +Y default cone orientation is already up
      this.scene.add(cone);
      // Label sprite
      this.scene.add(this._makeLabel(axLabels[i], axColors[i], axDirs[i].clone().multiplyScalar(1.15)));
    }

    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);
    this._autoScale = 1;
    this._userScale = 1;
    this._disposed = false;
    this._needsRender = true;
    this._hasModel = false;
    this.onModelChange = null;
    this._animationId = null;

    // Wireframe Earth for size reference (initially hidden)
    const earthGeo = new THREE.SphereGeometry(1.0, 24, 16);
    const earthMat = new THREE.MeshBasicMaterial({
      color: 0x3344aa,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.visible = false;
    this.scene.add(this.earthMesh);

    this._resizeObs = new ResizeObserver(() => { this._resize(); this._requestRender(); });
    this._resizeObs.observe(container);
    this._resize();

    // On-demand rendering: render when controls change or damping needs update
    this.controls.addEventListener('change', () => this._requestRender());

    // Initial render
    this._requestRender();
  }

  _requestRender() {
    if (this._disposed || this._animationId) return;
    this._needsRender = true;
    this._animationId = requestAnimationFrame(() => {
      this._animationId = null;
      if (this._disposed) return;
      if (!this.container.offsetParent) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      // If damping is active, keep rendering until it settles
      if (this.controls.enableDamping && this._needsRender) {
        this._needsRender = false;
        this._requestRender();
      }
    });
  }

  loadModel(filename, basePath = './models/') {
    this._clearModel();
    const loader = new TDSLoader();
    loader.setResourcePath(basePath);
    loader.load(basePath + filename, (obj) => {
      this._onModelLoaded(obj);
    }, undefined, (err) => {
      console.warn('ModelPreview: failed to load', filename, err);
      this._showPlaceholder('Model not available');
    });
  }

  loadModelFromFile(file) {
    this._clearModel();
    const reader = new FileReader();
    reader.onload = (e) => {
      const loader = new TDSLoader();
      const obj = loader.parse(e.target.result);
      this._onModelLoaded(obj);
    };
    reader.onerror = () => {
      console.warn('ModelPreview: failed to read file', file.name);
      this._showPlaceholder('Failed to read file');
    };
    reader.readAsArrayBuffer(file);
  }

  _onModelLoaded(obj) {
    // Center and auto-scale
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    obj.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    this._autoScale = maxDim > 0 ? 1.5 / maxDim : 1;
    this._baseAutoScale = this._autoScale;
    this.modelGroup.add(obj);
    this._applyTransform();
    this._hasModel = true;

    // Point camera at model
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Render the new model
    this._requestRender();

    // Notify listeners
    if (this.onModelChange) this.onModelChange(true);
  }

  _clearModel() {
    while (this.modelGroup.children.length > 0) {
      const child = this.modelGroup.children[0];
      this.modelGroup.remove(child);
      child.traverse(node => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) node.material.forEach(m => m.dispose());
          else node.material.dispose();
        }
      });
    }
    this._hasModel = false;
    // Remove placeholder if any
    const ph = this.container.querySelector('.model-preview-placeholder');
    if (ph) ph.remove();
    // Notify listeners
    if (this.onModelChange) this.onModelChange(false);
  }

  _showPlaceholder(msg) {
    let ph = this.container.querySelector('.model-preview-placeholder');
    if (!ph) {
      ph = document.createElement('div');
      ph.className = 'model-preview-placeholder';
      this.container.appendChild(ph);
    }
    ph.textContent = msg;
  }

  setRotation(xDeg, yDeg, zDeg) {
    this.modelGroup.rotation.set(
      xDeg * Math.PI / 180,
      yDeg * Math.PI / 180,
      zDeg * Math.PI / 180
    );
    this._requestRender();
  }

  setTranslation(x, y, z) {
    this.modelGroup.position.set(x, y, z);
    this._requestRender();
  }

  setScale(s) {
    this._userScale = s;
    this._applyTransform();
    this._requestRender();
  }

  _applyTransform() {
    const s = this._autoScale * this._userScale;
    this.modelGroup.scale.set(s, s, s);
  }

  toggleEarth() {
    this.earthMesh.visible = !this.earthMesh.visible;
    this._requestRender();
    return this.earthMesh.visible;
  }

  recenter() {
    this.modelGroup.position.set(0, 0, 0);
    this._requestRender();
    return { x: 0, y: 0, z: 0 };
  }

  autoscale() {
    this._userScale = 1;
    this._applyTransform();
    this._requestRender();
    return 1;
  }

  hasModel() {
    return this._hasModel;
  }

  dispose() {
    this._disposed = true;
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
    this._resizeObs.disconnect();
    this._clearModel();
    // Force WebGL context loss to immediately release the context
    const gl = this.renderer.getContext();
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  _resize() {
    const rect = this.container.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  _makeLabel(text, color, position) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 16);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(position);
    sprite.scale.set(0.5, 0.25, 1);
    return sprite;
  }
}
