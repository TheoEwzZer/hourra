const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hhh', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  pickBackground: () => ipcRenderer.invoke('bg:pick'),
  exportBackup: (data) => ipcRenderer.invoke('backup:export', data),
  importBackup: () => ipcRenderer.invoke('backup:import'),
  openDataFolder: () => ipcRenderer.invoke('app:openDataFolder'),
});
