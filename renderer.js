async function listPrinters() {
    const printers = await window.electronAPI.listPrinters();
    const printersDropdown = document.getElementById('printersDropdown');
    printersDropdown.innerHTML = ''; // Clear previous options
    printers.forEach(printer => {
        const option = document.createElement('option');
        option.value = printer.name;
        option.textContent = `${printer.name} (${printer.displayName})`;
        printersDropdown.appendChild(option);
    });
}

document.getElementById('listPrinters').addEventListener('click', listPrinters);

// Call listPrinters on initialization
document.addEventListener('DOMContentLoaded', listPrinters);

document.getElementById('savePrinter').addEventListener('click', async () => {
    const printersDropdown = document.getElementById('printersDropdown');
    const selectedPrinter = printersDropdown.value;
    await window.electronAPI.savePrinter(selectedPrinter);
    document.getElementById('selectedPrinter').textContent = selectedPrinter;
});

document.getElementById('testPrint').addEventListener('click', async () => {
    await window.electronAPI.testPrint();
});
