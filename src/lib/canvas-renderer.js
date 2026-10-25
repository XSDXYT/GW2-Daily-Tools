// Canvas share images use localized snapshots, independent of viewport and scroll position.
const colors = ['#c6b47d', '#9db0c1', '#9cb99b', '#c39b84'];
const font = '"Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
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
    let layout, contentBottom, fractalLayout, dailyHeader;
    if (model.mode === 'daily') {
      const raidY = 211;
      ctx.font = `600 28px ${font}`;
      const raidTitleWidth = ctx.measureText(model.raidTitle).width;
      ctx.font = `20px ${font}`;
      const badgeWidth = ctx.measureText(model.raidCycle).width + 24;
      dailyHeader = { raidY, badgeWidth, badgeX: margin + raidTitleWidth + 20, cardsTop: raidY + 52 };
      const cardWidth = (inner - 22) / 2;
      layout = model.days[0].items.map(item => {
        ctx.font = `600 28px ${font}`;
        const boss = wrapText(ctx, item.boss, cardWidth - 56);
        ctx.font = `22px ${font}`;
        const instance = wrapText(ctx, item.instance, cardWidth - 56);
        return { item, boss, instance, height: 92 + boss.length * 38 + instance.length * 30 };
      });
      contentBottom = dailyHeader.cardsTop + Math.max(layout[0].height, layout[1].height) + 16 + Math.max(layout[2].height, layout[3].height);
      if (model.fractals) {
        const start = contentBottom + 32;
        ctx.font = `20px ${font}`;
        const note = wrapText(ctx, model.fractals.note, inner);
        let y = start + 44 + note.length * 28 + 16;
        const groups = model.fractals.sections.map(group => {
          const top = y;
          y += 44;
          const rows = group.items.map(item => {
            ctx.font = `600 24px ${font}`;
            const name = wrapText(ctx, `${item.scale} · ${item.name}`, 354);
            ctx.font = `18px ${font}`;
            const meta = wrapText(ctx, [item.ar, ...item.badges].join(' · '), 354);
            ctx.font = `20px ${font}`;
            const instabilities = wrapText(ctx, item.instabilities.join(' / ') || item.noInstabilities, inner - 426);
            const height = Math.max(name.length * 32 + 4 + meta.length * 25, instabilities.length * 28) + 24;
            const row = { name, meta, instabilities, height, top: y };
            y += height;
            return row;
          });
          y += 16;
          return { title: group.title, top, rows };
        });
        ctx.font = `22px ${font}`;
        const unavailable = model.fractals.unavailable ? wrapText(ctx, model.fractals.unavailable, inner - 36) : [];
        if (unavailable.length) y += unavailable.length * 32 + 28;
        ctx.font = `18px ${font}`;
        const attribution = wrapText(ctx, model.fractals.attribution, inner);
        fractalLayout = { start, note, groups, unavailable, attribution, attributionTop: y };
        contentBottom = y + attribution.length * 26;
      }
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
    ctx.font = `600 20px ${font}`; ctx.fillText('GW2 Daily Tools', margin + 58, 31);
    ctx.font = `600 ${model.mode === 'cycle' ? 48 : 46}px ${font}`;
    lines(ctx, [model.title], margin, 88, 58, '#f1eee2');
    ctx.font = `24px ${font}`;
    lines(ctx, [model.subtitle], margin, 158, 34, '#c9cdbb');
    if (model.mode === 'daily') {
      const cardWidth = (inner - 22) / 2;
      ctx.font = `600 28px ${font}`;
      lines(ctx, [model.raidTitle], margin, dailyHeader.raidY, 38, '#edcf97');
      ctx.fillStyle = '#ccad7312'; ctx.fillRect(dailyHeader.badgeX, dailyHeader.raidY - 2, dailyHeader.badgeWidth, 36);
      ctx.strokeStyle = '#ccad7366'; ctx.strokeRect(dailyHeader.badgeX, dailyHeader.raidY - 2, dailyHeader.badgeWidth, 36);
      ctx.font = `20px ${font}`;
      lines(ctx, [model.raidCycle], dailyHeader.badgeX + 12, dailyHeader.raidY + 5, 28, '#edcf97');
      let y = dailyHeader.cardsTop;
      for (let row = 0; row < 2; row++) {
        const pair = layout.slice(row * 2, row * 2 + 2);
        const height = Math.max(...pair.map(card => card.height));
        pair.forEach((card, col) => {
          const x = margin + col * (cardWidth + 22);
          ctx.fillStyle = '#1b261e'; ctx.fillRect(x, y, cardWidth, height);
          ctx.strokeStyle = '#354036'; ctx.lineWidth = 1; ctx.strokeRect(x, y, cardWidth, height);
          ctx.fillStyle = colors[card.item.group - 1]; ctx.fillRect(x, y, cardWidth, 3);
          ctx.font = `20px ${font}`; lines(ctx, [card.item.label], x + 28, y + 18, 28, colors[card.item.group - 1]);
          ctx.font = `600 28px ${font}`;
          const bossBottom = lines(ctx, card.boss, x + 28, y + 54, 38, '#f3f2e6');
          ctx.font = `22px ${font}`; lines(ctx, card.instance, x + 28, bossBottom + 12, 30, '#d9dfd0');
        });
        y += height + 16;
      }
      if (fractalLayout) {
        ctx.font = `600 30px ${font}`;
        lines(ctx, [model.fractals.title], margin, fractalLayout.start, 40, '#edcf97');
        ctx.font = `20px ${font}`;
        const noteBottom = lines(ctx, fractalLayout.note, margin, fractalLayout.start + 44, 28, '#a4ada3');
        if (fractalLayout.unavailable.length) {
          ctx.font = `22px ${font}`;
          lines(ctx, fractalLayout.unavailable, margin + 18, noteBottom + 28, 32, '#d9dfd0');
        }
        for (const group of fractalLayout.groups) {
          ctx.font = `600 25px ${font}`;
          lines(ctx, [group.title], margin, group.top, 34, '#edcf97');
          group.rows.forEach((row, index) => {
            ctx.fillStyle = index % 2 ? '#172119' : '#1b261e';
            ctx.fillRect(margin, row.top, inner, row.height);
            ctx.strokeStyle = '#354036'; ctx.lineWidth = 1;
            ctx.strokeRect(margin, row.top, inner, row.height);
            ctx.font = `600 24px ${font}`;
            const nameBottom = lines(ctx, row.name, margin + 18, row.top + 12, 32, '#f3f2e6');
            ctx.font = `18px ${font}`;
            lines(ctx, row.meta, margin + 18, nameBottom + 4, 25, '#a4ada3');
            ctx.font = `20px ${font}`;
            lines(ctx, row.instabilities, margin + 408, row.top + 12, 28, '#d9dfd0');
          });
        }
        ctx.font = `18px ${font}`;
        lines(ctx, fractalLayout.attribution, margin, fractalLayout.attributionTop, 26, '#a4ada3');
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


export { render, wrapText };
