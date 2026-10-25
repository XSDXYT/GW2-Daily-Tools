export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* Try the selection-based fallback. */ }
  const field = document.createElement('textarea');
  field.value = text;
  field.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none';
  document.body.append(field);
  const focused = document.activeElement;
  try { field.focus({ preventScroll: true }); field.select(); return document.execCommand('copy'); }
  catch { return false; }
  finally { field.remove(); if (focused instanceof HTMLElement) focused.focus({ preventScroll: true }); }
}
