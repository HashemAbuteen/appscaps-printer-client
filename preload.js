const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    listPrinters: () => ipcRenderer.invoke('list-printers'),
    savePrinter: (printerName) => ipcRenderer.invoke('save-printer', printerName),
    testPrint: () => ipcRenderer.invoke('test-print')
});
