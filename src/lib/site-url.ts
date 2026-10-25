/** Use the deployed directory, so Pages repository names and custom domains both work. */
export function siteSource(pageUrl: string | undefined = globalThis.location?.href): string {
  if (!pageUrl) return 'GW2 Daily Tools';
  try {
    const directory = new URL('.', pageUrl);
    if (directory.protocol !== 'http:' && directory.protocol !== 'https:') return 'GW2 Daily Tools';
    return directory.host + decodeURI(directory.pathname);
  } catch { return 'GW2 Daily Tools'; }
}
