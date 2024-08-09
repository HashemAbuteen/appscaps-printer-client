const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let selectedPrinter = null;

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile('index.html');
}

ipcMain.handle('list-printers', async (event) => {
    const win = BrowserWindow.getAllWindows()[0];
    const printers = await win.webContents.getPrintersAsync();
    return printers;
});

ipcMain.handle('save-printer', async (event, printerName) => {
    selectedPrinter = printerName;
    console.log(`Selected printer: ${selectedPrinter}`);
});

ipcMain.handle('test-print', async (event) => {
    if (!selectedPrinter) {
        console.error('No printer selected');
        return;
    }

    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.print({ deviceName: selectedPrinter, silent: true, }, (success, errorType) => {
        if (!success) console.error(errorType);
        else console.log('Print initiated successfully');
    });
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
