import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareModel, dailyCopyText } from '../src/lib/share';
import { buildDailyFractalModel } from '../src/lib/daily-fractals';
import { render } from '../src/lib/canvas-renderer';
import { dayOffset } from '../src/domain/dates';

test('share models retain their language, chosen date and all 48 cycle targets', () => {
  const daily = buildShareModel('daily', '2026-10-25', 'zh', '2026-10-24');
  const cycle = buildShareModel('cycle', '2026-10-25', 'en', '2026-10-25');
  assert.equal(daily.days[0].items[2].boss, '李部长');
  assert.match(daily.filename, /2026-10-25-zh\.png$/);
  assert.equal(cycle.start, '2026-10-15');
  assert.equal(cycle.end, '2026-10-26');
  assert.equal(cycle.days.flatMap(row => row.items).length, 48);
  assert.equal(cycle.days.filter(row => row.isToday).length, 1);
  assert.equal(cycle.fractals, null);
  assert.equal(daily.subtitle, '2026-10-25 UTC');
  assert.equal(daily.raidCycle, '轮换第 11 / 12 天');
});

test('daily copy and PNG models share the chosen date, language, groups and full fractal content', () => {
  for (const lang of ['en', 'zh'] as const) {
    const model = buildShareModel('daily', '2026-10-26', lang, '2026-10-25');
    const fractals = model.fractals!;
    assert.deepEqual(fractals, buildDailyFractalModel('2026-10-26', lang));
    assert.deepEqual(fractals.sections.map(group => [group.id, group.items.length]), [['cm', 7], ['daily', 3], ['recommended', 3]]);
    assert.deepEqual(fractals.sections[2].items.map(item => item.scale), [5, 47, 68]);
    assert.notDeepEqual(fractals, buildDailyFractalModel('2026-10-25', lang));
    const text = dailyCopyText('2026-10-26', lang, '2026-10-25');
    assert.ok(text.includes('2026-10-26 UTC'));
    assert.ok(text.includes(model.raidTitle));
    assert.ok(text.includes(fractals.title));
    for (const group of fractals.sections) {
      assert.ok(text.includes(group.title));
      for (const item of group.items) {
        assert.ok(text.includes(`${item.scale} · ${item.name}`));
        assert.ok(text.includes(item.ar));
        for (const instability of item.instabilities) assert.ok(text.includes(instability));
      }
    }
    assert.equal(fractals.sections[0].items.find(item => item.scale === 97)?.badges.length, 1);
    assert.deepEqual(fractals.sections[1].items.find(item => item.scale === 97)?.badges, ['CM']);
    assert.equal(buildDailyFractalModel('2026-09-28', lang).sections[0].items.length, 6);
  }
});

test('old dates keep raid sharing available with an explicit fractal coverage message', () => {
  for (const lang of ['en', 'zh'] as const) {
    const model = buildShareModel('daily', '2026-09-14', lang);
    assert.equal(model.days[0].items.length, 4);
    assert.equal(model.fractals!.sections.length, 0);
    assert.ok(model.fractals!.unavailable.includes('2026-09-15'));
    assert.ok(dailyCopyText('2026-09-14', lang).includes(model.fractals!.unavailable));
  }
});

test('canvas renders every raid and fractal in both languages without clipping', () => {
  for (const lang of ['en', 'zh'] as const) for (let i = -1; i < 15; i++) {
    for (const mode of i === 0 ? ['daily', 'cycle'] as const : ['daily'] as const) {
      const text: { value: string; x: number; y: number; size: number; width: number }[] = [];
      const canvas = { width: 0, height: 0, getContext: () => context };
      const context = {
        font: '12px sans-serif', fillStyle: '', strokeStyle: '', lineWidth: 1, textBaseline: 'top',
        measureText(value: string) { const size = Number(this.font.match(/(\d+)px/)![1]); return { width: [...value].reduce((sum, c) => sum + (c.charCodeAt(0) > 255 ? 1 : .57) * size, 0) }; },
        fillRect() {}, strokeRect() {},
        fillText(value: string, x: number, y: number) { text.push({ value, x, y, size: Number(this.font.match(/(\d+)px/)![1]), width: this.measureText(value).width }); }
      };
      const model = buildShareModel(mode, i === -1 ? '2026-09-14' : dayOffset('2026-10-15', i), lang);
      render(model, () => canvas as unknown as HTMLCanvasElement);
      assert.equal(canvas.width, mode === 'daily' ? 1100 : 1800);
      assert.ok(text.every(label => label.x + label.width <= canvas.width - 20 && label.y + label.size <= canvas.height));
      const combined = text.map(label => label.value).join('').replace(/\s/g, '');
      for (const day of model.days) for (const item of day.items) assert.ok(combined.includes(item.boss.replace(/\s/g, '')));
      if (model.fractals) {
        const raidHeading = text.find(label => label.value === model.raidTitle)!;
        const cycle = text.find(label => label.value === model.raidCycle)!;
        assert.ok(cycle.x > raidHeading.x + raidHeading.width && Math.abs(cycle.y - raidHeading.y) < 12);
        assert.equal(model.subtitle, `${model.start} UTC`);
        assert.ok(!text.some(label => /\d{2}:\d{2}:\d{2}/.test(label.value)));
        assert.ok(combined.includes(model.raidTitle.replace(/\s/g, '')));
        assert.ok(combined.includes(model.fractals.title.replace(/\s/g, '')));
        assert.ok(combined.includes(model.fractals.note.replace(/\s/g, '')));
        if (model.fractals.unavailable) assert.ok(combined.includes(model.fractals.unavailable.replace(/\s/g, '')));
        for (const group of model.fractals.sections) {
          assert.ok(combined.includes(group.title.replace(/\s/g, '')));
          for (const item of group.items) {
            assert.ok(combined.includes(`${item.scale}·${item.name}`.replace(/\s/g, '')));
            assert.ok(combined.includes(item.ar.replace(/\s/g, '')));
            for (const instability of item.instabilities) assert.ok(combined.includes(instability.replace(/\s/g, '')));
          }
        }
        const fractalStart = text.find(label => label.value === model.fractals!.title)!.y;
        const names = new Set(model.fractals.sections.flatMap(group => group.items.map(item => `${item.scale} · ${item.name}`)));
        const rowStarts = text.filter(label => label.y > fractalStart && names.has(label.value));
        for (let j = 0; j < rowStarts.length - 1; j++) {
          const labels = text.filter(label => label.y >= rowStarts[j].y && label.y < rowStarts[j + 1].y);
          assert.ok(labels.every(label => label.y + label.size < rowStarts[j + 1].y));
        }
      }
    }
  }
});
