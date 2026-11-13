import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mountTabs } from '../src/tabs.js';

// Small event/attribute fixture, not a browser or accessibility-tree emulator.
function fixture(initial = 0) {
  const root = { activeElement: null };
  function element(attributes = {}, classes = []) {
    const values = new Map(Object.entries(attributes));
    const tokens = new Set(classes);
    const listeners = new Map();
    return {
      hidden: false,
      tabIndex: 0,
      getAttribute: name => values.get(name) ?? null,
      setAttribute: (name, value) => values.set(name, String(value)),
      classList: {
        contains: name => tokens.has(name),
        toggle(name, force) {
          if (force) tokens.add(name); else tokens.delete(name);
        },
      },
      addEventListener: (name, callback) => listeners.set(name, callback),
      focus() { root.activeElement = this; },
      dispatch(type, key) {
        let prevented = false;
        listeners.get(type)?.({ key, preventDefault() { prevented = true; } });
        return prevented;
      },
    };
  }
  const names = ['experiment', 'ask', 'learn'];
  const panels = names.map(name => element({ id: name, 'aria-labelledby': `tab-${name}` }));
  const tabs = names.map((name, index) => element({ id: `tab-${name}`, 'aria-controls': name }, index === initial ? ['selected'] : []));
  root.querySelectorAll = selector => {
    assert.equal(selector, '[role="tab"]');
    return tabs;
  };
  root.getElementById = id => panels.find(panel => panel.getAttribute('id') === id);
  return { root, tabs, panels };
}

function selected({ tabs, panels }, index) {
  tabs.forEach((tab, i) => {
    const active = i === index;
    assert.equal(tab.getAttribute('aria-selected'), String(active));
    assert.equal(tab.tabIndex, active ? 0 : -1);
    assert.equal(tab.classList.contains('selected'), active);
    assert.equal(panels[i].hidden, !active);
    assert.equal(panels[i].classList.contains('hidden'), !active);
    assert.equal(tab.getAttribute('aria-controls'), panels[i].getAttribute('id'));
    assert.equal(panels[i].getAttribute('aria-labelledby'), tab.getAttribute('id'));
  });
}

test('tabs initialize selected panel without moving focus', () => {
  const f = fixture(1);
  mountTabs(f.root);
  selected(f, 1);
  assert.equal(f.root.activeElement, null);
});

test('tabs fall back to first panel when no selected class exists', () => {
  const f = fixture(-1);
  mountTabs(f.root);
  selected(f, 0);
});

test('Arrow keys wrap and move focus with selected panel', () => {
  const f = fixture();
  mountTabs(f.root);
  for (const [from, key, to] of [[0, 'ArrowLeft', 2], [2, 'ArrowRight', 0], [0, 'ArrowRight', 1], [1, 'ArrowLeft', 0]]) {
    assert.equal(f.tabs[from].dispatch('keydown', key), true);
    selected(f, to);
    assert.equal(f.root.activeElement, f.tabs[to]);
  }
});

test('Home and End select endpoints and focus them', () => {
  const f = fixture(1);
  mountTabs(f.root);
  assert.equal(f.tabs[1].dispatch('keydown', 'End'), true);
  selected(f, 2);
  assert.equal(f.root.activeElement, f.tabs[2]);
  assert.equal(f.tabs[2].dispatch('keydown', 'Home'), true);
  selected(f, 0);
  assert.equal(f.root.activeElement, f.tabs[0]);
});

test('click activates a panel and unrelated keys preserve state and default action', () => {
  const f = fixture();
  mountTabs(f.root);
  f.tabs[2].dispatch('click');
  selected(f, 2);
  for (const key of ['Tab', 'Escape', 'ArrowDown', 'a']) {
    assert.equal(f.tabs[2].dispatch('keydown', key), false);
    selected(f, 2);
  }
});

test('empty tab collections mount safely', () => {
  mountTabs({ querySelectorAll: () => [] });
});

test('authored tabs and panels have reciprocal accessible associations', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const tags = [...html.matchAll(/<[^!/>][^>]*>/g)].map(match => {
    const attributes = {};
    for (const [, name, value] of match[0].matchAll(/([\w-]+)="([^"]*)"/g)) attributes[name] = value;
    return attributes;
  });
  const tabs = tags.filter(tag => tag.role === 'tab');
  assert.equal(tabs.length, 3);
  assert.equal(new Set(tags.filter(tag => tag.id).map(tag => tag.id)).size, tags.filter(tag => tag.id).length);
  for (const tab of tabs) {
    const panel = tags.find(tag => tag.id === tab['aria-controls']);
    assert.ok(panel, `missing panel for ${tab.id}`);
    assert.equal(panel.role, 'tabpanel');
    assert.equal(panel['aria-labelledby'], tab.id);
  }
});
