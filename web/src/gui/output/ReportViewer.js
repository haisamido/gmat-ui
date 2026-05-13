/**
 * ReportViewer.js — Tabbed display for GMAT output files
 *
 * Shows report file content in table or raw format, with download support.
 *
 * C++ reference: src/base/subscriber/ReportFile.cpp
 */

import { GmatOutputParser } from '../../base/subscriber/GmatOutputParser.js';

export class ReportViewer {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'report-viewer';
    this.files = {};
    this._render();
  }

  _render() {
    this.el.innerHTML = `
      <div class="report-toolbar">
        <label>File:</label>
        <select class="report-file-select"></select>
        <label style="margin-left:8px">View:</label>
        <select class="report-view-select">
          <option value="raw">Raw</option>
          <option value="table">Table</option>
        </select>
        <button class="report-download-btn">Download</button>
      </div>
      <div class="report-body"><div class="report-empty">No output files yet. Run a script to see results.</div></div>
    `;
    this.fileSelect = this.el.querySelector('.report-file-select');
    this.viewSelect = this.el.querySelector('.report-view-select');
    this.body = this.el.querySelector('.report-body');
    this.fileSelect.addEventListener('change', () => this._show());
    this.viewSelect.addEventListener('change', () => this._show());
    this.el.querySelector('.report-download-btn').addEventListener('click', () => this._download());
  }

  update(files) {
    this.files = files || {};
    const paths = Object.keys(this.files);
    this.fileSelect.innerHTML = '';
    if (paths.length === 0) {
      this.body.innerHTML = '<div class="report-empty">No output files produced by this run.</div>';
      return;
    }
    for (const p of paths) {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      this.fileSelect.appendChild(opt);
    }
    this._show();
  }

  _show() {
    const path = this.fileSelect.value;
    const text = this.files[path];
    if (!text) { this.body.innerHTML = '<div class="report-empty">Empty file.</div>'; return; }

    if (this.viewSelect.value === 'raw') {
      this.body.innerHTML = '';
      const pre = document.createElement('div');
      pre.className = 'report-raw';
      pre.textContent = text;
      this.body.appendChild(pre);
      return;
    }

    // Table view
    const data = GmatOutputParser.parseReport(text);
    if (data.headers.length === 0 && data.rows.length === 0) {
      // Not tabular — fall back to raw
      this.body.innerHTML = '';
      const pre = document.createElement('div');
      pre.className = 'report-raw';
      pre.textContent = text;
      this.body.appendChild(pre);
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'report-table-wrap';
    const table = document.createElement('table');
    table.className = 'report-table';

    if (data.headers.length > 0) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      for (const h of data.headers) {
        const th = document.createElement('th');
        th.textContent = h;
        tr.appendChild(th);
      }
      thead.appendChild(tr);
      table.appendChild(thead);
    }

    const tbody = document.createElement('tbody');
    for (const row of data.rows) {
      const tr = document.createElement('tr');
      for (const val of row) {
        const td = document.createElement('td');
        td.textContent = typeof val === 'number' ? val.toPrecision(15) : val;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);

    this.body.innerHTML = '';
    this.body.appendChild(wrap);
  }

  _download() {
    const path = this.fileSelect.value;
    const text = this.files[path];
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = path.split('/').pop();
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
