const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
});
