/** Reusable automatic-activation horizontal tabs. */
export function mountTabs(root = document) {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  function activate(tab, focus = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      item.classList.toggle('selected', active);
      const panel = root.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !active;
      panel.classList.toggle('hidden', !active);
    }
    if (focus) tab.focus();
  }
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      const next = {ArrowRight:(index+1)%tabs.length, ArrowLeft:(index+tabs.length-1)%tabs.length, Home:0, End:tabs.length-1}[event.key];
      if (next === undefined) return;
      event.preventDefault(); activate(tabs[next], true);
    });
  }
  if (tabs.length) activate(tabs.find(t => t.classList.contains('selected')) || tabs[0]);
}
