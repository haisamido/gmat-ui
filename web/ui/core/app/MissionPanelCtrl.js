/**
 * MissionPanelCtrl.js — Mission Sequence panel controller
 *
 * C++ reference: src/gui/mission/MissionTree.cpp
 */

import { ContextMenu } from '../widgets/ContextMenu.js';

export class MissionPanelCtrl {
  constructor(containerEl, store, app) {
    this.el = containerEl;
    this.store = store;
    this.app = app;
    this.ctx = new ContextMenu();
    this.selectedIdx = -1;
    this.store.onChange((action) => {
      if (action === 'mission' || action === 'clear') this.render();
    });
  }

  render() {
    if (!this.el) return;
    this.el.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText = 'padding:6px 10px;font-size:11px;font-weight:600;color:var(--subtext0);border-bottom:1px solid var(--border)';
    header.textContent = 'Mission Sequence';
    this.el.appendChild(header);

    const list = document.createElement('div');
    list.className = 'mission-list';

    this.store.missionSequence.forEach((cmd, i) => {
      const item = document.createElement('div');
      item.className = 'mission-item' + (i === this.selectedIdx ? ' selected' : '');
      item.innerHTML = `<span class="cmd-type">${cmd.type}</span><span class="cmd-detail">${this._detail(cmd)}</span>`;

      item.addEventListener('click', () => {
        this.el.querySelectorAll('.mission-item.selected').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedIdx = i;
      });

      item.addEventListener('dblclick', () => this._editCommand(i));

      item.addEventListener('contextmenu', e => {
        e.preventDefault();
        this.selectedIdx = i;
        this.render();
        this.ctx.show(e.clientX, e.clientY, [
          { label: 'Insert Before', action: () => this._showInsertMenu(e.clientX, e.clientY + 20, i, 'before') },
          { label: 'Insert After', action: () => this._showInsertMenu(e.clientX, e.clientY + 20, i, 'after') },
          { separator: true },
          { label: 'Move Up', action: () => this._move(i, -1), disabled: i === 0 },
          { label: 'Move Down', action: () => this._move(i, 1), disabled: i >= this.store.missionSequence.length - 1 },
          { separator: true },
          { label: 'Delete Command', action: () => { this.store.removeCommand(i); this.selectedIdx = -1; }},
        ]);
      });
      list.appendChild(item);
    });

    this.el.appendChild(list);

    // Add command button
    const addBtn = document.createElement('button');
    addBtn.className = 'mission-add-btn';
    addBtn.textContent = '+ Add Command';
    addBtn.addEventListener('click', e => {
      e.stopPropagation();
      this._showInsertMenu(e.clientX, e.clientY, this.store.missionSequence.length, 'at');
    });
    this.el.appendChild(addBtn);
  }

  _showInsertMenu(x, y, idx, mode) {
    const insert = (cmd) => {
      const pos = mode === 'before' ? idx : mode === 'after' ? idx + 1 : idx;
      this.store.missionSequence.splice(pos, 0, cmd);
      this.store._notify('mission', null);
    };

    const scs = this.store.getAllByType('Spacecraft');
    const sc = scs.length ? scs[0].name : 'DefaultSC';
    const props = this.store.getAllByType('Propagator');
    const prop = props.length ? props[0].name : 'Prop';
    const burns = this.store.getAllByType('ImpulsiveBurn');
    const burn = burns.length ? burns[0].name : 'ImpBurn';
    const subs = [...this.store.getAllByType('ReportFile'), ...this.store.getAllByType('OrbitView'), ...this.store.getAllByType('XYPlot')];
    const sub = subs.length ? subs[0].name : '';
    const dcs = this.store.getAllByType('DifferentialCorrector');
    const dc = dcs.length ? dcs[0].name : 'DC';
    const opts = this.store.getAllByType('VF13ad');
    const opt = opts.length ? opts[0].name : 'VF13ad';

    this.ctx.show(x, y, [
      { label: 'Propagate', action: () => insert({ type: 'Propagate', propagator: prop, spacecraft: sc, stopCondition: { param: sc + '.ElapsedDays', value: 1 }}) },
      { label: 'Maneuver', action: () => insert({ type: 'Maneuver', burn, spacecraft: sc }) },
      { separator: true },
      { label: 'Target', action: () => insert({ type: 'Target', solver: dc }) },
      { label: 'Vary', action: () => insert({ type: 'Vary', solver: dc, variable: burn + '.Element1', initialValue: 0, perturbation: 0.0001, lower: -9.999e300, upper: 9.999e300, maxStep: 0.1 }) },
      { label: 'Achieve', action: () => insert({ type: 'Achieve', solver: dc, goal: sc + '.Earth.RMAG', value: 42165, tolerance: 0.1 }) },
      { label: 'EndTarget', action: () => insert({ type: 'EndTarget' }) },
      { separator: true },
      { label: 'Optimize', action: () => insert({ type: 'Optimize', solver: opt }) },
      { label: 'Minimize', action: () => insert({ type: 'Minimize', solver: opt, objective: sc + '.ECC' }) },
      { label: 'NonlinearConstraint', action: () => insert({ type: 'NonlinearConstraint', solver: opt, constraint: sc + '.SMA', comparator: '>=', value: 7000 }) },
      { label: 'EndOptimize', action: () => insert({ type: 'EndOptimize' }) },
      { separator: true },
      { label: 'If', action: () => insert({ type: 'If', condition: sc + '.ElapsedDays > 0' }) },
      { label: 'Else', action: () => insert({ type: 'Else' }) },
      { label: 'EndIf', action: () => insert({ type: 'EndIf' }) },
      { label: 'For', action: () => insert({ type: 'For', variable: 'I', start: 1, step: 1, end: 10 }) },
      { label: 'EndFor', action: () => insert({ type: 'EndFor' }) },
      { label: 'While', action: () => insert({ type: 'While', condition: sc + '.ElapsedDays < 10' }) },
      { label: 'EndWhile', action: () => insert({ type: 'EndWhile' }) },
      { separator: true },
      { label: 'Report', action: () => insert({ type: 'Report', reportFile: sub || 'Report', parameters: [sc + '.UTCGregorian', sc + '.EarthMJ2000Eq.X'] }) },
      { label: 'Toggle', action: () => insert({ type: 'Toggle', subscriber: sub, state: 'On' }) },
      { label: 'PenUp', action: () => insert({ type: 'PenUp', subscriber: sub }) },
      { label: 'PenDown', action: () => insert({ type: 'PenDown', subscriber: sub }) },
      { label: 'MarkPoint', action: () => insert({ type: 'MarkPoint', subscriber: sub }) },
      { label: 'ClearPlot', action: () => insert({ type: 'ClearPlot', subscriber: sub }) },
      { separator: true },
      { label: 'Assignment (GMAT)', action: () => insert({ type: 'Assignment', lhs: sc + '.Element1', rhs: '0' }) },
      { label: 'Stop', action: () => insert({ type: 'Stop' }) },
      { label: 'BeginFiniteBurn', action: () => insert({ type: 'BeginFiniteBurn', burn: 'FinBurn', spacecraft: sc }) },
      { label: 'EndFiniteBurn', action: () => insert({ type: 'EndFiniteBurn', burn: 'FinBurn', spacecraft: sc }) },
    ]);
  }

  _move(idx, dir) {
    const seq = this.store.missionSequence;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= seq.length) return;
    [seq[idx], seq[newIdx]] = [seq[newIdx], seq[idx]];
    this.selectedIdx = newIdx;
    this.store._notify('mission', null);
  }

  _detail(cmd) {
    switch (cmd.type) {
      case 'Propagate': {
        const sc = Array.isArray(cmd.spacecraft) ? cmd.spacecraft.join(', ') : cmd.spacecraft;
        return `${cmd.propagator}(${sc}) {${cmd.stopCondition.param} = ${cmd.stopCondition.value}}`;
      }
      case 'Maneuver': return `${cmd.burn}(${cmd.spacecraft})`;
      case 'Target': return cmd.solver || '';
      case 'Vary': return `${cmd.solver}(${cmd.variable})`;
      case 'Achieve': return `${cmd.solver}(${cmd.goal} = ${cmd.value})`;
      case 'Optimize': return cmd.solver || '';
      case 'Minimize': return `${cmd.solver}(${cmd.objective})`;
      case 'NonlinearConstraint': return `${cmd.solver}(${cmd.constraint} ${cmd.comparator} ${cmd.value})`;
      case 'If': return cmd.condition || '';
      case 'For': return `${cmd.variable} = ${cmd.start}:${cmd.step}:${cmd.end}`;
      case 'While': return cmd.condition || '';
      case 'Report': return `${cmd.reportFile} ${(cmd.parameters||[]).join(' ')}`;
      case 'Toggle': return `${cmd.subscriber} ${cmd.state}`;
      case 'Assignment': return `${cmd.lhs} = ${cmd.rhs}`;
      case 'BeginFiniteBurn': case 'EndFiniteBurn': return `${cmd.burn}(${cmd.spacecraft})`;
      case 'PenUp': case 'PenDown': case 'MarkPoint': case 'ClearPlot': return cmd.subscriber || '';
      default: return '';
    }
  }

  _editCommand(idx) {
    const cmd = this.store.missionSequence[idx];
    if (!cmd) return;

    // Get available objects for dropdowns
    const scs = this.store.getAllByType('Spacecraft').map(o => o.name);
    const burns = this.store.getAllByType('ImpulsiveBurn').map(o => o.name);
    const finBurns = this.store.getAllByType('FiniteBurn').map(o => o.name);
    const props = this.store.getAllByType('Propagator').map(o => o.name);
    const dcs = this.store.getAllByType('DifferentialCorrector').map(o => o.name);
    const opts = this.store.getAllByType('VF13ad').map(o => o.name);
    const solvers = [...dcs, ...opts];
    const subs = [...this.store.getAllByType('ReportFile'), ...this.store.getAllByType('OrbitView'), ...this.store.getAllByType('XYPlot')].map(o => o.name);

    const makeSelect = (options, selected) => {
      return `<select class="dialog-select">${options.map(o => `<option${o === selected ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
    };

    let html = '';
    switch (cmd.type) {
      case 'Maneuver':
        html = `
          <div class="form-grid">
            <label>Burn:</label>${makeSelect(burns, cmd.burn)}
            <label>Spacecraft:</label>${makeSelect(scs, cmd.spacecraft)}
          </div>`;
        break;
      case 'Propagate':
        html = `
          <div class="form-grid">
            <label>Propagator:</label>${makeSelect(props, cmd.propagator)}
            <label>Spacecraft:</label>${makeSelect(scs, Array.isArray(cmd.spacecraft) ? cmd.spacecraft[0] : cmd.spacecraft)}
            <label>Stop Parameter:</label><input type="text" class="dialog-input" value="${cmd.stopCondition?.param || ''}" data-field="stopParam">
            <label>Stop Value:</label><input type="number" class="dialog-input" value="${cmd.stopCondition?.value || 1}" data-field="stopValue">
          </div>`;
        break;
      case 'Target':
        html = `<div class="form-grid"><label>Solver:</label>${makeSelect(dcs, cmd.solver)}</div>`;
        break;
      case 'Vary':
        html = `
          <div class="form-grid">
            <label>Solver:</label>${makeSelect(solvers, cmd.solver)}
            <label>Variable:</label><input type="text" class="dialog-input" value="${cmd.variable || ''}" data-field="variable">
            <label>Initial Value:</label><input type="number" class="dialog-input" value="${cmd.initialValue || 0}" data-field="initialValue">
            <label>Perturbation:</label><input type="number" class="dialog-input" value="${cmd.perturbation || 0.0001}" data-field="perturbation" step="0.0001">
            <label>Max Step:</label><input type="number" class="dialog-input" value="${cmd.maxStep || 0.1}" data-field="maxStep" step="0.01">
          </div>`;
        break;
      case 'Achieve':
        html = `
          <div class="form-grid">
            <label>Solver:</label>${makeSelect(dcs, cmd.solver)}
            <label>Goal:</label><input type="text" class="dialog-input" value="${cmd.goal || ''}" data-field="goal">
            <label>Value:</label><input type="number" class="dialog-input" value="${cmd.value || 0}" data-field="value">
            <label>Tolerance:</label><input type="number" class="dialog-input" value="${cmd.tolerance || 0.1}" data-field="tolerance" step="0.01">
          </div>`;
        break;
      case 'Optimize':
        html = `<div class="form-grid"><label>Solver:</label>${makeSelect(opts, cmd.solver)}</div>`;
        break;
      case 'Minimize':
        html = `
          <div class="form-grid">
            <label>Solver:</label>${makeSelect(opts, cmd.solver)}
            <label>Objective:</label><input type="text" class="dialog-input" value="${cmd.objective || ''}" data-field="objective" style="width:200px">
          </div>`;
        break;
      case 'NonlinearConstraint':
        html = `
          <div class="form-grid">
            <label>Solver:</label>${makeSelect(opts, cmd.solver)}
            <label>Constraint:</label><input type="text" class="dialog-input" value="${cmd.constraint || ''}" data-field="constraint">
            <label>Comparator:</label><select class="dialog-select" data-field="comparator">
              <option${cmd.comparator === '>=' ? ' selected' : ''}>&gt;=</option>
              <option${cmd.comparator === '<=' ? ' selected' : ''}>&lt;=</option>
              <option${cmd.comparator === '=' ? ' selected' : ''}>=</option>
            </select>
            <label>Value:</label><input type="number" class="dialog-input" value="${cmd.value || 0}" data-field="value">
          </div>`;
        break;
      case 'If': case 'While':
        html = `<div class="form-grid"><label>Condition:</label><input type="text" class="dialog-input" value="${cmd.condition || ''}" data-field="condition" style="width:300px"></div>`;
        break;
      case 'For':
        html = `
          <div class="form-grid">
            <label>Variable:</label><input type="text" class="dialog-input" value="${cmd.variable || 'I'}" data-field="variable">
            <label>Start:</label><input type="number" class="dialog-input" value="${cmd.start || 1}" data-field="start">
            <label>Step:</label><input type="number" class="dialog-input" value="${cmd.step || 1}" data-field="step">
            <label>End:</label><input type="number" class="dialog-input" value="${cmd.end || 10}" data-field="end">
          </div>`;
        break;
      case 'Report':
        html = `
          <div class="form-grid">
            <label>Report File:</label>${makeSelect(subs.filter(s => this.store.getObject(s)?.type === 'ReportFile'), cmd.reportFile)}
            <label>Parameters:</label><input type="text" class="dialog-input" value="${(cmd.parameters||[]).join(' ')}" data-field="parameters" style="width:300px">
          </div>`;
        break;
      case 'Toggle':
        html = `
          <div class="form-grid">
            <label>Subscriber:</label>${makeSelect(subs, cmd.subscriber)}
            <label>State:</label><select class="dialog-select" data-field="state"><option${cmd.state === 'On' ? ' selected' : ''}>On</option><option${cmd.state === 'Off' ? ' selected' : ''}>Off</option></select>
          </div>`;
        break;
      case 'Assignment':
        html = `
          <div class="form-grid">
            <label>Variable (LHS):</label><input type="text" class="dialog-input" value="${cmd.lhs || ''}" data-field="lhs">
            <label>Expression (RHS):</label><input type="text" class="dialog-input" value="${cmd.rhs || ''}" data-field="rhs" style="width:200px">
          </div>`;
        break;
      case 'BeginFiniteBurn': case 'EndFiniteBurn':
        html = `
          <div class="form-grid">
            <label>Burn:</label>${makeSelect(finBurns, cmd.burn)}
            <label>Spacecraft:</label>${makeSelect(scs, cmd.spacecraft)}
          </div>`;
        break;
      case 'PenUp': case 'PenDown': case 'MarkPoint': case 'ClearPlot':
        html = `<div class="form-grid"><label>Subscriber:</label>${makeSelect(subs, cmd.subscriber)}</div>`;
        break;
      default:
        return; // No editable fields for EndTarget, Else, EndIf, EndFor, EndWhile, Stop
    }

    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay visible';
    dialog.innerHTML = `
      <div class="dialog" style="min-width:400px">
        <h3>Edit ${cmd.type} Command</h3>
        ${html}
        <div class="dialog-buttons">
          <button class="btn-secondary" data-action="cancel">Cancel</button>
          <button class="btn-primary" data-action="ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(dialog);

    const close = () => dialog.remove();
    dialog.querySelector('[data-action="cancel"]').onclick = close;
    dialog.querySelector('[data-action="ok"]').onclick = () => {
      this._applyCommandEdit(cmd, dialog);
      this.store._notify('mission', null);
      close();
    };
  }

  _applyCommandEdit(cmd, dialog) {
    const selects = dialog.querySelectorAll('select');

    switch (cmd.type) {
      case 'Maneuver':
        cmd.burn = selects[0].value;
        cmd.spacecraft = selects[1].value;
        break;
      case 'Propagate':
        cmd.propagator = selects[0].value;
        cmd.spacecraft = selects[1].value;
        cmd.stopCondition = {
          param: dialog.querySelector('[data-field="stopParam"]').value,
          value: parseFloat(dialog.querySelector('[data-field="stopValue"]').value)
        };
        break;
      case 'Target':
        cmd.solver = selects[0].value;
        break;
      case 'Vary':
        cmd.solver = selects[0].value;
        cmd.variable = dialog.querySelector('[data-field="variable"]').value;
        cmd.initialValue = parseFloat(dialog.querySelector('[data-field="initialValue"]').value);
        cmd.perturbation = parseFloat(dialog.querySelector('[data-field="perturbation"]').value);
        cmd.maxStep = parseFloat(dialog.querySelector('[data-field="maxStep"]').value);
        break;
      case 'Achieve':
        cmd.solver = selects[0].value;
        cmd.goal = dialog.querySelector('[data-field="goal"]').value;
        cmd.value = parseFloat(dialog.querySelector('[data-field="value"]').value);
        cmd.tolerance = parseFloat(dialog.querySelector('[data-field="tolerance"]').value);
        break;
      case 'Optimize':
        cmd.solver = selects[0].value;
        break;
      case 'Minimize':
        cmd.solver = selects[0].value;
        cmd.objective = dialog.querySelector('[data-field="objective"]').value;
        break;
      case 'NonlinearConstraint':
        cmd.solver = selects[0].value;
        cmd.constraint = dialog.querySelector('[data-field="constraint"]').value;
        cmd.comparator = dialog.querySelector('[data-field="comparator"]').value;
        cmd.value = parseFloat(dialog.querySelector('[data-field="value"]').value);
        break;
      case 'If': case 'While':
        cmd.condition = dialog.querySelector('[data-field="condition"]').value;
        break;
      case 'For':
        cmd.variable = dialog.querySelector('[data-field="variable"]').value;
        cmd.start = parseFloat(dialog.querySelector('[data-field="start"]').value);
        cmd.step = parseFloat(dialog.querySelector('[data-field="step"]').value);
        cmd.end = parseFloat(dialog.querySelector('[data-field="end"]').value);
        break;
      case 'Report':
        cmd.reportFile = selects[0].value;
        cmd.parameters = dialog.querySelector('[data-field="parameters"]').value.split(/\s+/).filter(Boolean);
        break;
      case 'Toggle':
        cmd.subscriber = selects[0].value;
        cmd.state = dialog.querySelector('[data-field="state"]').value;
        break;
      case 'Assignment':
        cmd.lhs = dialog.querySelector('[data-field="lhs"]').value;
        cmd.rhs = dialog.querySelector('[data-field="rhs"]').value;
        break;
      case 'BeginFiniteBurn': case 'EndFiniteBurn':
        cmd.burn = selects[0].value;
        cmd.spacecraft = selects[1].value;
        break;
      case 'PenUp': case 'PenDown': case 'MarkPoint': case 'ClearPlot':
        cmd.subscriber = selects[0].value;
        break;
    }
  }
}
