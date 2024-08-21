const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});


const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { subscribeToNewOrders } = require('./graphqlClient');
const { createHash } = require('crypto');
const { ApolloClient, gql, InMemoryCache, HttpLink } = require('apollo-boost');

async function loadStore() {
    const { default: Store } = await import('electron-store');
    return new Store();
}

const client = new ApolloClient({
    link: new HttpLink({
        uri: 'https://api.appscaps.tech/graphql',
        fetch: fetch,
    }),
    cache: new InMemoryCache(),
});

let selectedPrinter = null;
let isPrintingEnabled = false;
let store;
let unsubscribe;
let paperSize = '80mm';
let userMargin = {};

async function createWindow() {
    store = await loadStore();
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const token = store.get('authToken');
    if (token) {
        subscribe(token);
        win.loadFile('src/index.html');
    } else {
        win.loadFile('src/login.html');
    }
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

    const urlToPrint = url;
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

                    printWin.webContents.executeJavaScript(`
                        (function() {
                            const receiptBox = document.getElementById('receipt-box');
                            if (receiptBox) {
                                return receiptBox.offsetHeight; // Height in pixels
                            } else {
                                return document.body.scrollHeight; // Fallback to entire page height
                            }
                        })();
                    `).then((contentHeightInPixels) => {
                        if (contentHeightInPixels) {
                            // convert height from pixel to microns
                            const contentHeightInMicrons = contentHeightInPixels * 25400 / 96;

                            let pageSize = {
                                width: 80 * 1000,
                                height: contentHeightInMicrons,
                            }
                            if(paperSize === '57mm'){
                                pageSize.width = 57 * 1000;
                            }
                            if (paperSize === '80mm') {
                                pageSize.width = 80 * 1000;
                            }if(paperSize === '76mm'){
                                pageSize.width = 76 * 1000;
                            }
                            if (paperSize === '110mm') {
                                pageSize.width = 110 * 1000;
                            }
                            printWin.webContents.print({
                                pageSize,
                                margins: {
                                    marginType: 'custom',
                                    ...userMargin,
                                },
                                scaleFactor: 0.5,
                                deviceName: selectedPrinter,
                                silent: true,
                                printBackground: false // No background colors or images
                            }, (success, errorType) => {
                                if (!success) console.error(errorType);
                                else console.log('Print initiated successfully');
                                printWin.close();
                            });
                        } else {
                            console.error('Failed to calculate content height.');
                            printWin.close();
                        }
                    }).catch((error) => {
                        console.error('Error while executing JavaScript to calculate height:', error);
                        printWin.close();
                    });
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

const LOGIN_MUTATION = gql`
    mutation Login($username: String!, $password: String!) {
        Login(username: $username, password: $password) {
            errorMsg
            loginCred {
                token
                role
                name
                id
            }
            result
        }
    }
`;


async function login(username, password) {
    try {
        const response = await client.mutate({
            mutation: LOGIN_MUTATION,
            variables: { username, password },
        });

        const { Login } = response.data;

        if (Login.result) {
            store.set('authToken', Login.loginCred.token); // Store the token
            return { success: true, token: Login.loginCred.token };
        } else {
            return { success: false, errorMsg: Login.errorMsg };
        }
    } catch (error) {
        console.error('Login request failed', error);
        return { success: false, errorMsg: 'Request failed' };
    }
}

const subscribe = (token)=> {
    unsubscribe = subscribeToNewOrders(token, (newOrder) => {
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
}


ipcMain.handle('login', async (event, username, password) => {
    const loginResult = await login(username, password);
    if (loginResult.success) {
        const win = BrowserWindow.getAllWindows()[0];
        win.loadFile('src/index.html');
        subscribe(loginResult.token);
        return true;
    } else {
        return false;
    }
});

ipcMain.handle('logout', async (event) => {
    console.log('Logging out');
    store.delete('authToken');
    if (unsubscribe) {
        unsubscribe();
    }
    const win = BrowserWindow.getAllWindows()[0];
    win.loadFile('src/login.html');
});

ipcMain.handle('list-printers', async (event) => {
    const win = BrowserWindow.getAllWindows()[0];
    const printers = await win.webContents.getPrintersAsync();
    return printers;
});

ipcMain.handle('save-printer', async (event, printerName) => {
    selectedPrinter = printerName;
    store.set('selectedPrinter', selectedPrinter);
    console.log(`Selected printer: ${selectedPrinter}`);
});

ipcMain.handle('toggle-printing', (event, enabled) => {
    isPrintingEnabled = enabled;
    store.set('isPrintingEnabled', isPrintingEnabled);
    console.log(`Printing enabled: ${isPrintingEnabled}`);
});

ipcMain.handle('get-selected-printer', async (event) => {
    selectedPrinter = store.get('selectedPrinter');
    return selectedPrinter;
});

ipcMain.handle('is-printing-enabled', async (event) => {
    isPrintingEnabled = store.get('isPrintingEnabled');
    return isPrintingEnabled;
});

ipcMain.handle('test-print', async (event) =>{
    printOrder('https://appscaps.tech/order?id=66b100a89cc4af05055b09f3&key=129bf&workPlaceId=664dd0c4a2657fe6fcdb5b19');
});

ipcMain.handle('print-order', async (event, url) => {
    printOrder(url);
});

ipcMain.handle('set-paper-size', async (event, size) => {
    paperSize = size;
    store.set('paperSize', paperSize);
});

ipcMain.handle('get-paper-size', async (event) => {
    paperSize = store.get('paperSize') || '80mm';
    return paperSize;
});

ipcMain.handle('set-user-margin', async (event, margin, direction) => {
    userMargin[direction] = margin;
    store.set('userMargin', userMargin);
});

ipcMain.handle('get-user-margin', async (event) => {
    userMargin = store.get('userMargin') || {};
    return userMargin;
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
