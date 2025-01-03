const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    login: (username, password) => ipcRenderer.invoke('login', username, password),
    logout: () => ipcRenderer.invoke('logout'),
    listPrinters: () => ipcRenderer.invoke('list-printers'),
    savePrinter: (printerName) => ipcRenderer.invoke('save-printer', printerName),
    togglePrinting: (enabled) => ipcRenderer.invoke('toggle-printing', enabled),
    onNewOrder: (callback) => ipcRenderer.on('new-order', (event, newOrder) => callback(newOrder)),
    getSelectedPrinter: () => ipcRenderer.invoke('get-selected-printer'),
    isPrintingEnabled: () => ipcRenderer.invoke('is-printing-enabled'),
    setPaperSize: (paperSize) => ipcRenderer.invoke('set-paper-size', paperSize),
    getPaperSize: () => ipcRenderer.invoke('get-paper-size'),
    setUserMargin: (margin, direction) => ipcRenderer.invoke('set-user-margin', margin, direction),
    getUserMargin: () => ipcRenderer.invoke('get-user-margin'),
    getUserFontSize: () => ipcRenderer.invoke('get-user-font-size'),
    setUserFontSize: (fontSize) => ipcRenderer.invoke('set-user-font-size', fontSize),
    printTest: () => ipcRenderer.invoke('print-test'),
});
