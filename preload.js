const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    listPrinters: () => ipcRenderer.invoke('list-printers')
});
