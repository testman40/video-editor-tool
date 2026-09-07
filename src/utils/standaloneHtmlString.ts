export async function getStandaloneHtmlContent(): Promise<string> {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const res = await fetch(`${cleanBase}standalone.html`);
    if (res.ok) {
      return await res.text();
    }
  } catch (e) {
    console.error('Failed to fetch standalone.html', e);
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>9:16 Shorts Video Editor</title></head><body><h1>9:16 Shorts Video Editor</h1></body></html>`;
}
