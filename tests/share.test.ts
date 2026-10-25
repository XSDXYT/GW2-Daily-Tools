import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareModel } from '../src/lib/share';
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
});
test('preserved canvas renderer wraps Chinese and English without clipping any boss label', () => {
  for (const lang of ['en', 'zh'] as const) for (let i = 0; i < 12; i++) {
    for (const mode of i === 0 ? ['daily', 'cycle'] as const : ['daily'] as const) {
      const text: { value: string; x: number; y: number; size: number; width: number }[] = [];
      const canvas = { width: 0, height: 0, getContext: () => context };
      const context = {
        font: '12px sans-serif', fillStyle: '', strokeStyle: '', lineWidth: 1, textBaseline: 'top',
        measureText(value: string) { const size = Number(this.font.match(/(\d+)px/)![1]); return { width: [...value].reduce((sum, c) => sum + (c.charCodeAt(0) > 255 ? 1 : .57) * size, 0) }; },
        fillRect() {}, strokeRect() {},
        fillText(value: string, x: number, y: number) { text.push({ value, x, y, size: Number(this.font.match(/(\d+)px/)![1]), width: this.measureText(value).width }); }
      };
      const model = buildShareModel(mode, dayOffset('2026-10-15', i), lang);
      render(model, () => canvas as unknown as HTMLCanvasElement);
      assert.equal(canvas.width, mode === 'daily' ? 1100 : 1800);
      assert.ok(text.every(label => label.x + label.width <= canvas.width - 20 && label.y + label.size <= canvas.height));
      const combined = text.map(label => label.value).join('').replace(/\s/g, '');
      for (const day of model.days) for (const item of day.items) assert.ok(combined.includes(item.boss.replace(/\s/g, '')));
    }
  }
});
