/**
 * UIConsole.js — Console output panel for GMAT messages
 *
 * C++ reference: src/gui/output/MessageWindow.cpp
 */

export class UIConsole {
  constructor(outputEl, countEl) {
    this.el = outputEl;
    this.countEl = countEl;
    this.lines = 0;
  }

  append(text, cls) {
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text + '\n';
    this.el.appendChild(span);
    this.el.scrollTop = this.el.scrollHeight;
    this.lines++;
    if (this.countEl) {
      this.countEl.textContent = this.lines + ' lines';
    }
  }

  clear() {
    this.el.innerHTML = '';
    this.lines = 0;
    if (this.countEl) {
      this.countEl.textContent = '0 lines';
    }
  }

  error(text) {
    this.append(text, 'err');
  }

  warn(text) {
    this.append(text, 'warn');
  }

  info(text) {
    this.append(text, 'info');
  }
}
