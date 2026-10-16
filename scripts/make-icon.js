// Génère build/icon.png (512 px) et src/renderer/assets/icon.png à partir du logo SVG, via Electron.
// Usage : npm run icon
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const SIZE = 512;
const root = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'src', 'renderer', 'assets', 'logo.svg'), 'utf8')
  .replace('<svg ', `<svg width="${SIZE}" height="${SIZE}" `);

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: SIZE, height: SIZE, show: false, frame: false, transparent: true, webPreferences: { offscreen: true } });
  const html = `<html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise((r) => setTimeout(r, 600));
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE });
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  fs.writeFileSync(path.join(root, 'build', 'icon.png'), img.resize({ width: SIZE, height: SIZE }).toPNG());
  fs.writeFileSync(path.join(root, 'src', 'renderer', 'assets', 'icon.png'), img.resize({ width: 256, height: 256 }).toPNG());
  console.log('Icône générée');
  app.quit();
});
