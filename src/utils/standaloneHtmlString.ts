export async function getStandaloneHtmlContent(): Promise<string> {
  try {
    const res = await fetch('/standalone.html');
    if (res.ok) {
      return await res.text();
    }
  } catch (e) {
    console.error('Failed to fetch /standalone.html', e);
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>9:16 Shorts Video Editor</title></head><body><h1>9:16 Shorts Video Editor</h1></body></html>`;
}
