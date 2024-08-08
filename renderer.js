document.getElementById('listPrinters').addEventListener('click', async () => {
    const printers = await window.electronAPI.listPrinters();
    const printersList = document.getElementById('printersList');
    printersList.innerHTML = ''; // Clear previous list
    printers.forEach(printer => {
        const li = document.createElement('li');
        li.textContent = `${printer.name} (${printer.displayName})`;
        printersList.appendChild(li);
    });
});
