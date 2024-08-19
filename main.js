const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { subscribeToNewOrders } = require('./graphqlClient');
const { createHash } = require('crypto');


let selectedPrinter = null;
let isPrintingEnabled = false;

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

    win.loadFile('login.html');
}

const printOrder = (url) => {
    if (!selectedPrinter) {
        console.error('No printer selected');
        return;
    }

    if (!isPrintingEnabled) {
        console.error('Printing is disabled');
        return;
    }

    // URL of the page to print
    const urlToPrint = url;

    // Create a hidden window to load and print the web page
    const printWin = new BrowserWindow({ show: false });

    printWin.loadURL(urlToPrint);

    printWin.webContents.on('did-finish-load', () => {
        let receiptBoxDetected = false;

        const checkForReceiptBox = setInterval(() => {
            printWin.webContents.executeJavaScript(`
                document.getElementById('receipt-box') !== null
            `).then(result => {
                if (result) {
                    receiptBoxDetected = true;
                    clearInterval(checkForReceiptBox);
                    clearTimeout(timeout); // Clear timeout if receipt-box is detected

                    setTimeout(() => {
                        // Print the entire webpage without background colors and images
                        printWin.webContents.print({
                            deviceName: selectedPrinter,
                            silent: true,
                            printBackground: false // This ensures no background colors or images are printed
                        }, (success, errorType) => {
                            if (!success) console.error(errorType);
                            else console.log('Print initiated successfully');
                            printWin.close();  // Close the hidden window after printing
                        });
                    }, 5000);
                }
            });
        }, 1000); // Check every 1 second

        // Timeout after 30 seconds
        const timeout = setTimeout(() => {
            if (!receiptBoxDetected) {
                clearInterval(checkForReceiptBox);
                console.error('Error: receipt-box div did not appear within 30 seconds.');
                printWin.close();  // Close the hidden window
            }
        }, 30000); // 30 seconds timeout
    });
}

ipcMain.handle('login', (event, username, password) => {
    if (username === 'admin' && password === 'password') {
        const win = BrowserWindow.getAllWindows()[0];
        win.loadFile('index.html');
        const token = "yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IndhbGVlZCIsImlkIjoiNjVmZTgwOGU0Njg4ZjAzZjBkNDA5Yzk1Iiwicm9sZSI6IkFkbWluIiwibmFtZSI6IldhbGVlZCIsInNob3BJZCI6IjY1ZjY5ZDZmYWNkNTFjYTdlOGJlZmY5MCIsImlhdCI6MTcyNDA3MDY4MH0.vYy7vx6vibAvOK4iZ2SE620MYhwTz6LnuvViNLGQGlI"; // Replace with the actual workplaceId
        subscribeToNewOrders(token, (newOrder) => {
            console.log('New order received:', newOrder);
            const key = createHash("sha256")
                .update(newOrder.order.clientName + newOrder.order.clientPhone)
                .digest("hex")
                .substring(0, 5);
            // const url = `https://appscaps.tech/order?id=${newOrder.id}&key=${key}&workPlaceId=${newOrder.workPlaceId}`;
            const url = `http://appscaps.tech/order?id=${newOrder.id}&key=${key}&workPlaceId=${newOrder.workPlaceId}`;
            console.log('Printing order:', url);
            printOrder(url);
        });
        return true;
    }
    return false;
});

ipcMain.handle('list-printers', async (event) => {
    const win = BrowserWindow.getAllWindows()[0];
    const printers = await win.webContents.getPrintersAsync();
    return printers;
});

ipcMain.handle('save-printer', async (event, printerName) => {
    selectedPrinter = printerName;
    console.log(`Selected printer: ${selectedPrinter}`);
});

ipcMain.handle('toggle-printing', (event, enabled) => {
    isPrintingEnabled = enabled;
    console.log(`Printing enabled: ${isPrintingEnabled}`);
});

ipcMain.handle('test-print', async (event) =>{
    printOrder('https://appscaps.tech/order?id=66b100a89cc4af05055b09f3&key=129bf&workPlaceId=664dd0c4a2657fe6fcdb5b19');
});

ipcMain.handle('print-order', async (event, url) => {
    printOrder(url);
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
