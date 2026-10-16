const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

// Interface en français : les champs date s'affichent en JJ/MM/AAAA (et non MM/JJ/AAAA)
app.commandLine.appendSwitch('lang', 'fr-FR');

const dataDir = () => app.getPath('userData');
const dataFile = () => path.join(dataDir(), 'hourra-data.json');
// Ancienne version (« HipHipHip v2 ») : on récupère ses données au premier lancement
const legacyFile = () => path.join(app.getPath('appData'), 'HipHipHip v2', 'hiphiphip-data.json');
const bgDir = () => path.join(dataDir(), 'backgrounds');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'Hourra',
    icon: path.join(__dirname, 'renderer', 'assets', 'icon.png'),
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Les liens externes s'ouvrent dans le navigateur, jamais dans l'app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

function writeAtomic(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, file);
}

ipcMain.handle('data:load', () => {
  try {
    if (!fs.existsSync(dataFile()) && fs.existsSync(legacyFile())) {
      fs.mkdirSync(dataDir(), { recursive: true });
      fs.copyFileSync(legacyFile(), dataFile());
    }
    if (!fs.existsSync(dataFile())) return null;
    return JSON.parse(fs.readFileSync(dataFile(), 'utf8'));
  } catch (err) {
    // Fichier corrompu : on garde une copie et on repart de zéro
    try { fs.copyFileSync(dataFile(), dataFile() + '.corrupt-' + Date.now()); } catch {}
    return null;
  }
});

ipcMain.handle('data:save', (_e, data) => {
  fs.mkdirSync(dataDir(), { recursive: true });
  writeAtomic(dataFile(), JSON.stringify(data));
  return true;
});

ipcMain.handle('bg:pick', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Choisis ton fond d\'écran',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif'] }],
  });
  if (canceled || !filePaths[0]) return null;
  fs.mkdirSync(bgDir(), { recursive: true });
  const src = filePaths[0];
  const dest = path.join(bgDir(), Date.now() + path.extname(src).toLowerCase());
  fs.copyFileSync(src, dest);
  return { url: pathToFileURL(dest).href, name: path.basename(src) };
});

ipcMain.handle('backup:export', async (_e, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Exporter mes données',
    defaultPath: 'hourra-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json',
    filters: [{ name: 'Sauvegarde Hourra', extensions: ['json'] }],
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return true;
});

ipcMain.handle('backup:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Importer une sauvegarde',
    properties: ['openFile'],
    filters: [{ name: 'Sauvegarde Hourra', extensions: ['json'] }],
  });
  if (canceled || !filePaths[0]) return null;
  return JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
});

ipcMain.handle('app:openDataFolder', () => shell.openPath(dataDir()));

/** Mises à jour automatiques depuis les releases GitHub (version installée uniquement, pas la portable). */
function checkForUpdates() {
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR) return;
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.on('error', () => {}); // hors-ligne : on ignore, l'app marche sans internet
    autoUpdater.checkForUpdatesAndNotify({
      title: 'Hourra est à jour 🎉',
      body: 'La version {version} sera installée à la prochaine fermeture de l\'app.',
    }).catch(() => {});
  } catch {
    // module absent : pas de mise à jour automatique
  }
}

app.whenReady().then(() => {
  createWindow();
  checkForUpdates();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
