/* 纯静态页面渲染，不需要后端，也不请求外部 API。 */
(function () {
  'use strict';

  const R = globalThis.GW2_ROTATION;
  if (!R) throw new Error('请先加载 rotation.js');
  const I = globalThis.GW2_I18N;
  if (!I) throw new Error('Please load i18n.js before app.js');
  const t = I.t;
  const name = I.encounter;
  const page = document.body.dataset.page;
  let renderedUtcDate = '';
  let selectedDate = null;
  let renderedBountyDate = '';
  let renderedLanguage = '';
  let copyState = '';
  let copyBusy = false;

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function makeBossCard(item) {
    const row = element('article', `boss-row group-${item.group}`);
    row.setAttribute('data-number', `0${item.group}`);
    row.append(element('span', 'group-number', t('groupLabel', { n: item.group })));
    row.append(element('h3', 'boss-name', name(item, 'boss')));
    const instance = element('p', 'boss-instance');
    instance.append(element('span', 'instance-label', t('instancePrefix')));
    if (item.wing != null) instance.append(element('span', 'instance-wing', `W${item.wing}`));
    instance.append(document.createTextNode(name(item, 'instance')));
    row.append(instance);
    return row;
  }

  function renderToday(dateString) {
    document.querySelector('#today-date').textContent = `${I.dateLabel(dateString, true)} · UTC`;
    document.querySelector('#cycle-label').textContent = t('cycleLabel', { n: R.cycleIndex(dateString) + 1 });
    const grid = document.querySelector('#today-grid');
    grid.replaceChildren(...R.bountiesForDate(dateString).map(makeBossCard));
    document.querySelector('#bounty-date').value = dateString;
    document.querySelector('#today-heading').textContent = t(dateString === R.utcToday() ? 'today' : 'chosenDay');
    document.querySelector('#return-today').disabled = selectedDate === null;
    updateCopyUi();
  }

  function makeRotationCell(item) {
    const cell = element('td', `rotation-cell group-${item.group}`);
    cell.append(element('strong', 'rotation-boss', name(item, 'boss')));
    const details = element('div', 'rotation-instance');
    details.append(element('span', 'mini-wing', item.wing == null ? t('independent') : `W${item.wing}`), document.createTextNode(name(item, 'instance')));
    cell.append(details);
    if (item.bounty !== item.boss) cell.append(element('div', 'rotation-bounty', t('bountyLabel', { name: name(item, 'bounty') })));
    return cell;
  }

  function makeRotationMobileRow(item) {
    const row = element('div', `mobile-rotation-row group-${item.group}`);
    row.append(element('span', 'mobile-group', t('groupLabel', { n: item.group })));
    const main = element('div', 'mobile-rotation-row-main');
    main.append(element('strong', '', name(item, 'boss')), element('span', '', `${item.wing ? `W${item.wing} · ` : ''}${name(item, 'instance')}`));
    if (item.bounty !== item.boss) main.append(element('small', '', t('bountyLabel', { name: name(item, 'bounty') })));
    row.append(main);
    return row;
  }

  function renderRotation(dateString) {
    const start = R.currentCycleStart(dateString);
    const last = R.dayOffset(start, 11);
    document.querySelector('#period-label').textContent = t('periodLabel', { start, end: last });
    document.querySelector('#rotation-today').textContent = t('rotationToday', { n: R.cycleIndex(dateString) + 1 });
    const tbody = document.querySelector('#rotation-tbody');
    const mobile = document.querySelector('#mobile-rotation');
    const track = document.querySelector('#cycle-track');
    const steps = document.createDocumentFragment();
    const rows = document.createDocumentFragment();
    const cards = document.createDocumentFragment();

    for (let i = 0; i < 12; i++) {
      const date = R.dayOffset(start, i);
      const isToday = date === dateString;
      const items = R.bountiesForDate(date);
      const tr = document.createElement('tr');
      tr.id = `rotation-day-${i}`;
      if (isToday) tr.className = 'today-row';
      const step = element('button', 'cycle-step');
      step.type = 'button';
      step.append(element('span', '', I.language === 'zh' ? '天' : 'DAY'), element('strong', '', String(i + 1).padStart(2, '0')), element('span', '', isToday ? t('currentDay') : date.slice(5)));
      if (isToday) step.setAttribute('aria-current', 'date');
      step.setAttribute('aria-label', t('viewDay', { n: i + 1, date, today: isToday ? t('todaySuffix') : '' }));
      step.addEventListener('click', () => scrollToDay(i));
      steps.append(step);
      const th = element('th', 'day-heading');
      th.scope = 'row';
      th.append(element('span', 'day-number', t('day', { n: String(i + 1).padStart(2, '0') })), element('strong', 'day-date', date.slice(5)), element('span', 'day-week', I.dateLabel(date)));
      if (isToday) th.append(element('span', 'today-chip', t('currentDay')));
      tr.append(th);
      items.forEach((item) => tr.append(makeRotationCell(item)));
      rows.append(tr);

      const card = element('article', `mobile-rotation-day${isToday ? ' mobile-rotation-today' : ''}`);
      card.id = `mobile-day-${i}`;
      const heading = element('div', 'mobile-day-heading');
      const title = element('div');
      title.append(element('span', 'mobile-day-count', t('day', { n: String(i + 1).padStart(2, '0') })), element('strong', '', I.dateLabel(date)));
      heading.append(title);
      if (isToday) heading.append(element('span', 'today-chip', t('currentDay')));
      card.append(heading);
      items.forEach((item) => card.append(makeRotationMobileRow(item)));
      cards.append(card);
    }
    track.replaceChildren(steps);
    tbody.replaceChildren(rows);
    mobile.replaceChildren(cards);
  }

  function scrollToDay(index) {
    const prefix = matchMedia('(max-width: 780px)').matches ? '#mobile-day-' : '#rotation-day-';
    const target = document.querySelector(`${prefix}${index}`);
    if (!target) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' });
    target.classList.remove('row-highlight');
    void target.offsetWidth;
    target.classList.add('row-highlight');
  }

  function updateCountdown(now) {
    const counter = document.querySelector('#countdown');
    if (!counter) return;
    const remain = R.secondsUntilReset(now);
    const h = String(Math.floor(remain / 3600)).padStart(2, '0');
    const m = String(Math.floor((remain % 3600) / 60)).padStart(2, '0');
    const s = String(remain % 60).padStart(2, '0');
    counter.textContent = `${h}:${m}:${s}`;
  }

  function refresh() {
    const now = new Date();
    const utcDate = R.utcToday(now);
    const displayDate = selectedDate || utcDate;
    if (utcDate !== renderedUtcDate || I.language !== renderedLanguage || displayDate !== renderedBountyDate) {
      if (displayDate !== renderedBountyDate) copyState = '';
      if (page === 'today') renderToday(displayDate);
      if (page === 'rotation') renderRotation(utcDate);
      renderedUtcDate = utcDate;
      renderedBountyDate = displayDate;
      renderedLanguage = I.language;
    }
    updateCountdown(now);
  }

  const dateInput = document.querySelector('#bounty-date');
  if (dateInput) {
    dateInput.addEventListener('change', () => {
      const error = document.querySelector('#date-error');
      try {
        R.dayNumber(dateInput.value);
        selectedDate = dateInput.value;
        error.textContent = '';
        refresh();
        document.querySelector('#return-today').disabled = false;
      } catch (_) {
        dateInput.value = renderedBountyDate;
        error.textContent = t('invalidDate');
      }
    });
    document.querySelector('#return-today').addEventListener('click', () => {
      selectedDate = null;
      renderedBountyDate = '';
      document.querySelector('#date-error').textContent = '';
      refresh();
    });
  }

  document.querySelector('#share-daily')?.addEventListener('click', () => {
    refresh();
    globalThis.GW2_SHARE_IMAGE.open('daily', renderedBountyDate);
  });
  document.querySelector('#share-cycle')?.addEventListener('click', () => {
    refresh();
    globalThis.GW2_SHARE_IMAGE.open('cycle', renderedUtcDate);
  });

  function dailyCopyText(dateString) {
    const lines = [t(dateString === R.utcToday() ? 'copyHeading' : 'copyHeadingSelected', { date: dateString })];
    R.bountiesForDate(dateString).forEach((item, index) => {
      lines.push(t('copyBoss', { n: index + 1, name: name(item, 'boss') }),
        t('copyInstance', { name: `${item.wing == null ? '' : `W${item.wing} · `}${name(item, 'instance')}` }));
    });
    return lines.join('\n');
  }

  function updateCopyUi() {
    const button = document.querySelector('#copy-today');
    if (!button) return;
    button.disabled = copyBusy;
    button.textContent = t(copyBusy ? 'copying' : (selectedDate && selectedDate !== R.utcToday() ? 'copySelected' : 'copy'));
    const status = document.querySelector('#copy-status');
    status.dataset.error = String(copyState === 'manual');
    status.textContent = copyState === 'success' ? t('copySuccess') : copyState === 'manual' ? t('copyFailed') : '';
    const fallback = document.querySelector('#copy-fallback');
    fallback.hidden = copyState !== 'manual';
    if (copyState === 'manual') document.querySelector('#copy-text').value = dailyCopyText(selectedDate || R.utcToday());
  }

  function legacyCopy(text) {
    const field = document.querySelector('#copy-text');
    const fallback = document.querySelector('#copy-fallback');
    fallback.hidden = false;
    field.value = text;
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* 手动复制降级。 */ }
    if (copied) fallback.hidden = true;
    return copied;
  }

  const copyToday = document.querySelector('#copy-today');
  if (copyToday) {
    copyToday.addEventListener('click', async () => {
      // 使用点击瞬间的 UTC 日期，避免跨日后复制到昨日目标。
      refresh();
      const text = dailyCopyText(renderedBountyDate);
      copyBusy = true;
      copyState = '';
      updateCopyUi();
      document.querySelector('#language-toggle').disabled = true;
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        } else {
          copied = legacyCopy(text);
        }
      } catch (_) {
        copied = legacyCopy(text);
      } finally {
        copyBusy = false;
        document.querySelector('#language-toggle').disabled = false;
      }
      copyState = copied ? 'success' : 'manual';
      updateCopyUi();
      if (copied) copyToday.focus({ preventScroll: true });
    });
  }

  const jumpToday = document.querySelector('#jump-today');
  if (jumpToday) {
    jumpToday.addEventListener('click', () => {
      scrollToDay(R.cycleIndex(renderedUtcDate));
    });
  }

  I.onChange(() => {
    refresh();
    const error = document.querySelector('#date-error');
    if (error?.textContent) error.textContent = t('invalidDate');
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('focus', refresh);
  refresh();
  window.setInterval(refresh, 1000);
})();
