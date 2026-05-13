/**
 * PanelActionBar.js — Action bar for configuration panels
 *
 * Provides the standard button bar at the bottom of config panels:
 * - Show Full Script (F7)
 * - Show Resource Script
 * - Ok
 * - Apply
 * - Cancel
 * - Help
 *
 * C++ reference: src/gui/app/GmatMainFrame.cpp
 */

/**
 * Create an action bar for a panel
 * @param {Object} options - Configuration options
 * @param {Function} options.onShowScript - Called when Show Full Script button clicked
 * @param {Function} options.onShowResourceScript - Called when Show Resource Script button clicked
 * @param {Function} options.onOk - Called when Ok button clicked
 * @param {Function} options.onApply - Called when Apply button clicked
 * @param {Function} options.onCancel - Called when Cancel button clicked
 * @param {Function} options.onHelp - Called when Help button clicked
 * @returns {HTMLElement} The action bar element
 */
export function createPanelActionBar(options = {}) {
  const bar = document.createElement('div');
  bar.className = 'panel-action-bar';

  const btnScript = document.createElement('button');
  btnScript.textContent = 'Show Full Script (F7)';
  if (options.onShowScript) {
    btnScript.addEventListener('click', options.onShowScript);
  }

  const btnResourceScript = document.createElement('button');
  btnResourceScript.textContent = 'Show Resource Script';
  if (options.onShowResourceScript) {
    btnResourceScript.addEventListener('click', options.onShowResourceScript);
  }

  const spacer = document.createElement('div');
  spacer.className = 'spacer';

  const btnOk = document.createElement('button');
  btnOk.textContent = 'Ok';
  if (options.onOk) {
    btnOk.addEventListener('click', options.onOk);
  }

  const btnApply = document.createElement('button');
  btnApply.textContent = 'Apply';
  if (options.onApply) {
    btnApply.addEventListener('click', options.onApply);
  }

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancel';
  if (options.onCancel) {
    btnCancel.addEventListener('click', options.onCancel);
  }

  const btnHelp = document.createElement('button');
  btnHelp.textContent = 'Help';
  if (options.onHelp) {
    btnHelp.addEventListener('click', options.onHelp);
  }

  bar.append(btnScript, btnResourceScript, spacer, btnOk, btnApply, btnCancel, btnHelp);
  return bar;
}

/**
 * Wrap a panel element with an action bar
 * @param {HTMLElement} panel - The panel content element
 * @param {Object} options - Action bar options (see createPanelActionBar)
 * @returns {HTMLElement} Wrapper containing panel and action bar
 */
export function wrapPanelWithActionBar(panel, options = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'panel-wrapper';
  wrapper.style.cssText = 'display:flex;flex-direction:column;height:100%;';

  wrapper.appendChild(panel);
  wrapper.appendChild(createPanelActionBar(options));

  return wrapper;
}
