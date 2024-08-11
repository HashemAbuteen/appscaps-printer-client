const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    login: (username, password) => ipcRenderer.invoke('login', username, password),
    listPrinters: () => ipcRenderer.invoke('list-printers'),
    savePrinter: (printerName) => ipcRenderer.invoke('save-printer', printerName),
    togglePrinting: (enabled) => ipcRenderer.invoke('toggle-printing', enabled),
    testPrint: () => ipcRenderer.invoke('test-print')
});
