/**
 * ContextMenu.js — Right-click context menu widget
 *
 * C++ reference: (none - web-only component)
 */

export class ContextMenu {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ctx-menu';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);
    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', () => this.hide(), true);
  }

  show(x, y, items) {
    this.el.innerHTML = '';
    for (const item of items) {
      if (item.separator) { this.el.appendChild(document.createElement('hr')); continue; }
      const div = document.createElement('div');
      div.className = 'ctx-menu-item' + (item.disabled ? ' disabled' : '');
      div.textContent = item.label;
      if (item.title) div.title = item.title;
      if (!item.disabled) div.addEventListener('click', e => { e.stopPropagation(); this.hide(); item.action(); });
      this.el.appendChild(div);
    }
    // Position within viewport
    this.el.style.display = 'block';
    const rect = this.el.getBoundingClientRect();
    this.el.style.left = Math.min(x, window.innerWidth - rect.width - 8) + 'px';
    this.el.style.top = Math.min(y, window.innerHeight - rect.height - 8) + 'px';
  }

  hide() { this.el.style.display = 'none'; }
}
