const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup({ language = 'en', nativeShare = false, encodingFails = false, shareError = null } = {}) {
  const elements = {};
  for (const id of ['share-dialog', 'close-share', 'image-status', 'share-preview', 'save-image', 'share-image', 'language-toggle']) {
    elements['#' + id] = {
      hidden: true, open: false, handlers: {}, textContent: '',
      addEventListener(name, callback) { this.handlers[name] = callback; },
      setAttribute(name, value) { this[name] = value; },
      removeAttribute(name) { delete this[name]; },
      showModal() { this.open = true; },
      close() { this.open = false; this.handlers.close?.(); }
    };
  }
  const requests = [], revoked = [], canvases = [];
  function canvas() {
    const target = { width: 0, height: 0, text: [] };
    const ctx = {
      font: '12px sans-serif',
      measureText(text) {
        const size = Number(this.font.match(/(\d+)px/)?.[1] || 12);
        return { width: [...String(text)].reduce((total, c) => total + (c.charCodeAt(0) > 255 ? 1 : .57) * size, 0) };
      },
      fillRect() {}, strokeRect() {},
      fillText(text, x, y) { target.text.push({ text, x, y, width: this.measureText(text).width, size: Number(this.font.match(/(\d+)px/)?.[1] || 12) }); }
    };
    target.getContext = () => ctx;
    target.toBlob = callback => callback(encodingFails ? null : new Blob(['PNG'], { type: 'image/png' }));
    canvases.push(target);
    return target;
  }
  const context = vm.createContext({
    document: {
      documentElement: {}, fonts: { ready: Promise.resolve() },
      querySelector: selector => elements[selector] || null, querySelectorAll: () => [],
      createElement(tag) { assert.equal(tag, 'canvas'); return canvas(); }
    },
    localStorage: { getItem: () => language, setItem() {} },
    window: { addEventListener() {} },
    navigator: nativeShare ? {
      canShare: () => true,
      async share(payload) { requests.push(payload); if (shareError) throw Object.assign(new Error('share error'), { name: shareError }); }
    } : {},
    Blob, File,
    URL: { createObjectURL: () => 'blob:preview-' + canvases.length, revokeObjectURL: url => revoked.push(url) }
  });
  for (const script of ['data.js', 'rotation.js', 'encounters-zh.js', 'i18n.js', 'share-image.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', script), 'utf8'), context);
  }
  return { api: context.GW2_SHARE_IMAGE, I: context.GW2_I18N, R: context.GW2_ROTATION, canvas, elements, requests, revoked, canvases };
}

test('daily images use the specified date and cycle exports include all 12 dates and 48 targets', () => {
  const { api } = setup();
  const daily = api.buildModel('daily', '2026-10-15', '2026-10-24');
  assert.equal(daily.days.length, 1);
  assert.equal(daily.days[0].items[0].boss, 'Legendary Icebrood Construct');
  assert.equal(daily.filename, 'gw2-daily-2026-10-15-en.png');
  const cycle = api.buildModel('cycle', '2026-10-24', '2026-10-24');
  assert.equal(cycle.start, '2026-10-15'); assert.equal(cycle.end, '2026-10-26');
  assert.equal(cycle.days.length, 12);
  assert.equal(cycle.days.flatMap(day => day.items).length, 48);
  assert.equal(cycle.days.filter(day => day.isToday).length, 1);
  assert.equal(cycle.days.find(day => day.isToday).date, '2026-10-24');
  assert.match(cycle.filename, /2026-10-15_2026-10-26-en\.png/);
  assert.equal(api.buildModel('cycle', '2026-10-27').start, '2026-10-27');
  assert.throws(() => api.buildModel('daily', '2026-02-30'));
  assert.throws(() => api.buildModel('invalid', '2026-10-24'));
});

test('image model retains one language even after the site language changes', () => {
  const { api, I } = setup({ language: 'zh' });
  const model = api.buildModel('daily', '2026-10-25');
  assert.equal(model.days[0].items[2].instance, '凯宁瞭望台');
  I.setLanguage('en');
  assert.equal(model.days[0].items[2].boss, '李部长');
  assert.match(model.filename, /-zh\.png$/);
  assert.equal(api.buildModel('daily', '2026-10-25').language, 'en');
});

test('long English and Chinese labels wrap without truncation and stay inside every exported canvas', () => {
  const { api, I, R, canvas } = setup();
  for (const lang of ['en', 'zh']) {
    I.setLanguage(lang);
    for (let i = 0; i < 12; i++) {
      const date = R.dayOffset('2026-10-15', i);
      for (const mode of ['daily', ...(i === 0 ? ['cycle'] : [])]) {
        const model = api.buildModel(mode, date, '2026-10-24');
        const image = api.render(model, canvas);
        assert.equal(image.width, mode === 'daily' ? 1100 : 1800);
        assert.ok(image.height > 400 && image.height < 10000);
        for (const label of image.text) {
          assert.ok(label.x + label.width <= image.width - 20, `${lang}: ${label.text} overflows horizontally`);
          assert.ok(label.y + label.size <= image.height, `${lang}: ${label.text} overflows vertically`);
        }
        const text = image.text.map(x => x.text).join('').replace(/\s/g, '');
        for (const day of model.days) {
          for (const item of day.items) assert.ok(text.includes(item.boss.replace(/\s/g, '')), `${item.boss} is missing`);
        }
      }
    }
  }
});

test('a PNG preview and download remain available without native file sharing', async () => {
  const { api, elements } = setup();
  await api.open('daily', '2026-10-15');
  assert.equal(elements['#share-dialog'].open, true);
  assert.equal(elements['#share-preview'].hidden, false);
  assert.match(elements['#share-preview'].alt, /2026-10-15/);
  assert.equal(elements['#save-image'].hidden, false);
  assert.match(elements['#save-image'].download, /gw2-daily-2026-10-15/);
  assert.equal(elements['#share-image'].hidden, true);
  assert.match(elements['#image-status'].textContent, /Image ready/);
});

test('file sharing starts only on a separate click and cancellation keeps the download', async () => {
  const app = setup({ nativeShare: true, shareError: 'AbortError' });
  await app.api.open('cycle', '2026-10-24');
  assert.equal(app.requests.length, 0);
  assert.equal(app.elements['#share-image'].hidden, false);
  await app.elements['#share-image'].handlers.click();
  assert.equal(app.requests.length, 1);
  assert.equal(app.requests[0].files[0].type, 'image/png');
  assert.match(app.requests[0].files[0].name, /2026-10-15_2026-10-26/);
  assert.match(app.elements['#image-status'].textContent, /cancelled/);
  assert.equal(app.elements['#save-image'].hidden, false);
});

test('failed generation and early close never leave stale images or active download links', async () => {
  const failed = setup({ encodingFails: true });
  await failed.api.open('daily', '2026-10-15');
  assert.match(failed.elements['#image-status'].textContent, /Could not create/);
  assert.equal(failed.elements['#save-image'].hidden, true);
  const app = setup();
  const pending = app.api.open('daily', '2026-10-15');
  app.elements['#share-dialog'].close();
  await pending;
  assert.equal(app.elements['#share-preview'].src, undefined);
  assert.equal(app.elements['#save-image'].href, undefined);
  await app.api.open('daily', '2026-10-20');
  assert.match(app.elements['#save-image'].download, /2026-10-20/);
  app.elements['#share-dialog'].close();
  assert.equal(app.revoked.length, 1);
});
