const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    login: (username, password) => ipcRenderer.invoke('login', username, password),
    logout: () => ipcRenderer.invoke('logout'),
    listPrinters: () => ipcRenderer.invoke('list-printers'),
    savePrinter: (printerName) => ipcRenderer.invoke('save-printer', printerName),
    togglePrinting: (enabled) => ipcRenderer.invoke('toggle-printing', enabled),
    testPrint: () => ipcRenderer.invoke('test-print'),
    onNewOrder: (callback) => ipcRenderer.on('new-order', (event, newOrder) => callback(newOrder)),
    getSelectedPrinter: () => ipcRenderer.invoke('get-selected-printer'),
    isPrintingEnabled: () => ipcRenderer.invoke('is-printing-enabled'),
});
