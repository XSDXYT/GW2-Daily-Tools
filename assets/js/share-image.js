/* 使用本站数据绘制独立 PNG 分享图；无外部图片、字体或截图服务依赖。 */
(function () {
  'use strict';
  const R = globalThis.GW2_ROTATION;
  const I = globalThis.GW2_I18N;
  const colors = ['#c6b47d', '#9db0c1', '#9cb99b', '#c39b84'];
  const font = '"Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';

  // Freeze localized strings at generation time so an open preview remains one coherent image.
  function buildModel(mode, date, today = R.utcToday()) {
    if (!['daily', 'cycle'].includes(mode)) throw new RangeError('Invalid image mode');
    R.dayNumber(date);
    R.dayNumber(today);
    const start = mode === 'cycle' ? R.currentCycleStart(date) : date;
    const end = mode === 'cycle' ? R.dayOffset(start, 11) : start;
    R.dayNumber(end);
    const days = Array.from({ length: mode === 'cycle' ? 12 : 1 }, (_, index) => {
      const day = R.dayOffset(start, index);
      return {
        date: day, day: I.t('day', { n: String(R.cycleIndex(day) + 1).padStart(2, '0') }),
        isToday: day === today,
        items: R.bountiesForDate(day).map(item => ({
          group: item.group, label: I.t('groupLabel', { n: item.group }),
          boss: I.encounter(item, 'boss'),
          instance: `${item.wing == null ? '' : `W${item.wing} · `}${I.encounter(item, 'instance')}`,
          bounty: item.bounty !== item.boss ? I.t('bountyLabel', { name: I.encounter(item, 'bounty') }) : ''
        }))
      };
    });
    return {
      mode, language: I.language, start, end, days,
      title: I.t(mode === 'cycle' ? 'exportCycleTitle' : 'exportDailyTitle'),
      subtitle: mode === 'cycle' ? I.t('exportCycleSubtitle', { start, end }) : I.t('exportDailySubtitle', { date, n: R.cycleIndex(date) + 1 }),
      footer: I.t('exportFooter'), todayLabel: I.t('currentDay'), instanceLabel: I.t('instanceColumn'),
      columns: [I.t('dateColumn'), ...[1, 2, 3, 4].map(n => I.t('groupLabel', { n }))],
      source: 'xsdxyt.github.io/GW2-Daily-Raids/',
      alt: mode === 'cycle' ? I.t('exportAltCycle', { start, end }) : I.t('exportAltDaily', { date }),
      filename: `gw2-${mode === 'cycle' ? 'rotation' : 'daily'}-${start}${mode === 'cycle' ? `_${end}` : ''}-${I.language}.png`
    };
  }

  // English words wrap at spaces; overlong words and Chinese names wrap by Unicode character.
  function wrapText(ctx, value, width) {
    const tokens = String(value).match(/\s+|[A-Za-z0-9'’()\-]+|[^\s]/gu) || [];
    const lines = [];
    let line = '';
    for (const token of tokens) {
      if (ctx.measureText(line + token).width <= width) { line += token; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
      if (ctx.measureText(token).width <= width) { line = token.trimStart(); continue; }
      for (const char of Array.from(token)) {
        if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = ''; }
        line += char;
      }
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines.length ? lines : [''];
  }

  function lines(ctx, content, x, y, height, color) {
    ctx.fillStyle = color;
    for (const text of content) { ctx.fillText(text, x, y); y += height; }
    return y;
  }

  function render(model, makeCanvas = () => document.createElement('canvas')) {
    const canvas = makeCanvas();
    canvas.width = model.mode === 'cycle' ? 1800 : 1100;
    canvas.height = 1;
    let ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable');
    const width = canvas.width, margin = 48, inner = width - margin * 2;
    let layout, contentBottom;
    if (model.mode === 'daily') {
      const cardWidth = (inner - 22) / 2;
      layout = model.days[0].items.map(item => {
        ctx.font = `600 32px ${font}`;
        const boss = wrapText(ctx, item.boss, cardWidth - 56);
        ctx.font = `23px ${font}`;
        const instance = wrapText(ctx, item.instance, cardWidth - 56);
        return { item, boss, instance, height: 138 + boss.length * 43 + instance.length * 33 };
      });
      contentBottom = 225 + Math.max(layout[0].height, layout[1].height) + 22 + Math.max(layout[2].height, layout[3].height);
    } else {
      const cellWidth = (inner - 170) / 4;
      layout = model.days.map(day => {
        const cells = day.items.map(item => {
          ctx.font = `600 26px ${font}`;
          const boss = wrapText(ctx, item.boss, cellWidth - 38);
          ctx.font = `21px ${font}`;
          const instance = wrapText(ctx, item.instance, cellWidth - 38);
          ctx.font = `18px ${font}`;
          const bounty = item.bounty ? wrapText(ctx, item.bounty, cellWidth - 38) : [];
          return { item, boss, instance, bounty, height: 36 + boss.length * 35 + 12 + instance.length * 29 + (bounty.length ? 10 + bounty.length * 25 : 0) };
        });
        return { day, cells, height: Math.max(138, ...cells.map(cell => cell.height)) };
      });
      contentBottom = 270 + layout.reduce((height, row) => height + row.height, 0);
    }
    canvas.height = Math.ceil(contentBottom + 132);
    ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#101715'; ctx.fillRect(0, 0, width, canvas.height);
    ctx.fillStyle = '#ccad73'; ctx.fillRect(margin, 42, 42, 3);
    ctx.font = `600 20px ${font}`; ctx.fillText('GW2 RAID', margin + 58, 31);
    ctx.font = `600 ${model.mode === 'cycle' ? 48 : 46}px ${font}`;
    lines(ctx, [model.title], margin, 88, 58, '#f1eee2');
    ctx.font = `24px ${font}`;
    lines(ctx, [model.subtitle], margin, 158, 34, '#c9cdbb');
    if (model.mode === 'daily') {
      const cardWidth = (inner - 22) / 2;
      let y = 225;
      for (let row = 0; row < 2; row++) {
        const pair = layout.slice(row * 2, row * 2 + 2);
        const height = Math.max(...pair.map(card => card.height));
        pair.forEach((card, col) => {
          const x = margin + col * (cardWidth + 22);
          ctx.fillStyle = '#1b261e'; ctx.fillRect(x, y, cardWidth, height);
          ctx.strokeStyle = '#354036'; ctx.lineWidth = 1; ctx.strokeRect(x, y, cardWidth, height);
          ctx.fillStyle = colors[card.item.group - 1]; ctx.fillRect(x, y, cardWidth, 3);
          ctx.font = `20px ${font}`; lines(ctx, [card.item.label], x + 28, y + 25, 28, colors[card.item.group - 1]);
          ctx.font = `600 32px ${font}`;
          const bossBottom = lines(ctx, card.boss, x + 28, y + 70, 43, '#f3f2e6');
          ctx.font = `18px ${font}`; lines(ctx, [model.instanceLabel], x + 28, bossBottom + 16, 26, '#a4ada3');
          ctx.font = `23px ${font}`; lines(ctx, card.instance, x + 28, bossBottom + 48, 33, '#d9dfd0');
        });
        y += height + 22;
      }
    } else {
      const cellWidth = (inner - 170) / 4;
      let y = 215;
      ctx.fillStyle = '#293224'; ctx.fillRect(margin, y, inner, 55);
      ctx.font = `21px ${font}`;
      model.columns.forEach((label, index) => lines(ctx, [label], margin + (index ? 170 + (index - 1) * cellWidth : 0) + 18, y + 16, 28, index ? colors[index - 1] : '#d3d5c4'));
      y += 55;
      layout.forEach((row, index) => {
        ctx.fillStyle = row.day.isToday ? '#323428' : index % 2 ? '#1c251c' : '#182119';
        ctx.fillRect(margin, y, inner, row.height);
        ctx.strokeStyle = '#354036'; ctx.lineWidth = 1; ctx.strokeRect(margin, y, inner, row.height);
        if (row.day.isToday) { ctx.fillStyle = '#ccad73'; ctx.fillRect(margin, y, 4, row.height); }
        ctx.font = `19px ${font}`; lines(ctx, [row.day.day], margin + 18, y + 20, 28, '#ccad73');
        ctx.font = `25px ${font}`; lines(ctx, [row.day.date.slice(5)], margin + 18, y + 56, 32, '#ececdc');
        if (row.day.isToday) { ctx.font = `18px ${font}`; lines(ctx, [model.todayLabel], margin + 18, y + 96, 25, '#edcf97'); }
        row.cells.forEach((cell, col) => {
          const x = margin + 170 + col * cellWidth;
          ctx.strokeRect(x, y, cellWidth, row.height);
          ctx.font = `600 26px ${font}`;
          let bottom = lines(ctx, cell.boss, x + 18, y + 18, 35, '#efeedf');
          ctx.font = `21px ${font}`; bottom = lines(ctx, cell.instance, x + 18, bottom + 12, 29, '#bdc9b2');
          if (cell.bounty.length) { ctx.font = `18px ${font}`; lines(ctx, cell.bounty, x + 18, bottom + 10, 25, '#98a68f'); }
        });
        y += row.height;
      });
    }
    ctx.fillStyle = '#354036'; ctx.fillRect(margin, contentBottom + 32, inner, 1);
    ctx.font = `18px ${font}`; lines(ctx, [model.footer], margin, contentBottom + 52, 26, '#a4ada3');
    ctx.font = `17px ${font}`; lines(ctx, [model.source], margin, contentBottom + 83, 24, '#ccad73');
    return canvas;
  }

  const dialog = document.querySelector('#share-dialog');
  let objectUrl = '', file = null, ticket = 0;
  function cleanup() {
    ticket++;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = ''; file = null;
    document.querySelector('#share-preview')?.removeAttribute('src');
    const save = document.querySelector('#save-image');
    if (save) { save.removeAttribute('href'); save.hidden = true; }
    const share = document.querySelector('#share-image');
    if (share) share.hidden = true;
  }
  async function open(mode, date) {
    const model = buildModel(mode, date);
    cleanup();
    const currentTicket = ticket;
    const status = document.querySelector('#image-status');
    const preview = document.querySelector('#share-preview');
    const save = document.querySelector('#save-image');
    const share = document.querySelector('#share-image');
    preview.hidden = true;
    status.textContent = I.t('imageGenerating');
    if (!dialog.open) dialog.showModal();
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      if (currentTicket !== ticket) return;
      const canvas = render(model);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG encoding failed')), 'image/png'));
      if (currentTicket !== ticket) return;
      objectUrl = URL.createObjectURL(blob);
      preview.src = objectUrl; preview.alt = model.alt; preview.hidden = false;
      save.href = objectUrl; save.download = model.filename; save.hidden = false;
      file = typeof File === 'function' ? new File([blob], model.filename, { type: 'image/png' }) : null;
      try { share.hidden = !(file && navigator.share && navigator.canShare?.({ files: [file] })); } catch (_) { share.hidden = true; }
      share.disabled = false;
      status.textContent = I.t('imageReady');
    } catch (_) {
      if (currentTicket === ticket) status.textContent = I.t('imageFailed');
    }
  }
  if (dialog) {
    document.querySelector('#close-share').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', cleanup);
    document.querySelector('#share-image').addEventListener('click', async () => {
      if (!file) return;
      const button = document.querySelector('#share-image');
      const currentTicket = ticket;
      button.disabled = true;
      try {
        // Separate click keeps transient user activation for the native share sheet.
        await navigator.share({ files: [file] });
        if (ticket === currentTicket) document.querySelector('#image-status').textContent = I.t('shareDone');
      } catch (error) {
        if (ticket === currentTicket) document.querySelector('#image-status').textContent = I.t(error.name === 'AbortError' ? 'shareCancelled' : 'shareFailed');
      } finally { button.disabled = false; }
    });
  }
  globalThis.GW2_SHARE_IMAGE = Object.freeze({ buildModel, wrapText, render, open });
})();
