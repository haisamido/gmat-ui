/**
 * PanelHelpers.js — Shared utility functions for panel widgets
 *
 * C++ reference: (none - web-only component)
 */

/**
 * Wire a dual-list widget for transferring items between available/selected
 */
export function wireDualList(el, prefix, store, objName, prop) {
  const availBox = el.querySelector(`[${prefix}-avail]`);
  const selBox = el.querySelector(`[${prefix}-sel]`);
  if (!availBox || !selBox) return;

  function handleClick(box, e) {
    const item = e.target.closest('.list-item');
    if (!item) return;
    if (e.ctrlKey || e.metaKey) { item.classList.toggle('selected'); }
    else { box.querySelectorAll('.list-item').forEach(i => i.classList.remove('selected')); item.classList.add('selected'); }
  }
  availBox.addEventListener('click', e => handleClick(availBox, e));
  selBox.addEventListener('click', e => handleClick(selBox, e));

  el.querySelector(`[${prefix}-add]`)?.addEventListener('click', () => {
    const items = availBox.querySelectorAll('.list-item.selected');
    if (!items.length) return;
    const cur = store.getObject(objName).properties[prop] || [];
    items.forEach(item => { cur.push(item.dataset.val); item.classList.remove('selected'); selBox.appendChild(item); });
    store.setProperty(objName, prop, cur);
  });
  el.querySelector(`[${prefix}-rem]`)?.addEventListener('click', () => {
    const items = selBox.querySelectorAll('.list-item.selected');
    if (!items.length) return;
    const cur = store.getObject(objName).properties[prop] || [];
    items.forEach(item => {
      const idx = cur.indexOf(item.dataset.val);
      if (idx >= 0) cur.splice(idx, 1);
      item.classList.remove('selected');
      availBox.appendChild(item);
    });
    store.setProperty(objName, prop, cur);
  });
  // Select All button
  el.querySelector(`[${prefix}-add-all]`)?.addEventListener('click', () => {
    const items = availBox.querySelectorAll('.list-item');
    if (!items.length) return;
    const cur = store.getObject(objName).properties[prop] || [];
    items.forEach(item => { cur.push(item.dataset.val); item.classList.remove('selected'); selBox.appendChild(item); });
    store.setProperty(objName, prop, cur);
  });
  // Remove All button
  el.querySelector(`[${prefix}-rem-all]`)?.addEventListener('click', () => {
    const items = selBox.querySelectorAll('.list-item');
    if (!items.length) return;
    items.forEach(item => { item.classList.remove('selected'); availBox.appendChild(item); });
    store.setProperty(objName, prop, []);
  });
}

/**
 * Create a file list widget with add/remove buttons
 */
export function createFileListWidget(files, { addLabel = 'Add', removeLabel = 'Remove' } = {}) {
  const container = document.createElement('div');
  container.className = 'file-list-container';
  const list = document.createElement('div');
  list.className = 'file-list';
  const items = [...files];
  const renderList = () => {
    list.innerHTML = '';
    items.forEach((f, i) => {
      const d = document.createElement('div');
      d.textContent = f;
      d.addEventListener('click', (e) => {
        if (!e.ctrlKey && !e.metaKey) list.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
        d.classList.toggle('selected');
      });
      list.appendChild(d);
    });
  };
  renderList();
  const btns = document.createElement('div');
  btns.className = 'file-list-btns';
  const addBtn = document.createElement('button');
  addBtn.textContent = addLabel;
  addBtn.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        items.push(fileInput.files[0].name);
        renderList();
      }
      fileInput.remove();
    });
    fileInput.addEventListener('cancel', () => fileInput.remove());
    fileInput.click();
  });
  const removeBtn = document.createElement('button');
  removeBtn.textContent = removeLabel;
  removeBtn.addEventListener('click', () => {
    const selected = list.querySelectorAll('.selected');
    const indices = new Set();
    selected.forEach(s => {
      const idx = Array.from(list.children).indexOf(s);
      if (idx >= 0) indices.add(idx);
    });
    if (indices.size === 0) return;
    for (let i = items.length - 1; i >= 0; i--) {
      if (indices.has(i)) items.splice(i, 1);
    }
    renderList();
  });
  btns.appendChild(addBtn);
  btns.appendChild(removeBtn);
  container.appendChild(list);
  container.appendChild(btns);
  return container;
}

/**
 * Bind all data-p inputs to store property changes
 */
export function bindInputsToStore(el, store, objName) {
  el.querySelectorAll('[data-p]').forEach(inp => {
    inp.addEventListener('change', () => {
      let v = inp.value;
      if (inp.type === 'number') v = parseFloat(v);
      else if (v === 'true') v = true;
      else if (v === 'false') v = false;
      store.setProperty(objName, inp.dataset.p, v);
    });
  });
}

/**
 * Wire file browse buttons to use native file picker
 */
export function wireFileBrowseButtons(el) {
  el.querySelectorAll('[data-file-browse]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prop = btn.dataset.fileBrowse;
      const input = el.querySelector(`[data-p="${prop}"]`);
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          const filename = fileInput.files[0].name;
          if (input) { input.value = filename; input.dispatchEvent(new Event('change')); }
        }
        fileInput.remove();
      });
      fileInput.addEventListener('cancel', () => fileInput.remove());
      fileInput.click();
    });
  });
}
