// Listen for new orders
window.electronAPI.onNewOrder((newOrder) => {
    console.log('New order received in renderer:', newOrder);
    // Implement the logic to handle the new order (e.g., display it or trigger a print)
});

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

document.addEventListener('DOMContentLoaded', async () => {
    await listPrinters();
    const selectedPrinter = await window.electronAPI.getSelectedPrinter();
    document.getElementById('selectedPrinter').textContent = selectedPrinter;
    const isPrintingEnabled = await window.electronAPI.isPrintingEnabled();
    document.getElementById('togglePrinting').checked = isPrintingEnabled;
    const paperSize = await window.electronAPI.getPaperSize();
    document.getElementById('paperSize').value = paperSize;
    const userMargin = await window.electronAPI.getUserMargin();
    console.log(userMargin);
    document.getElementById('marginLeft').value = userMargin.left || 0;
    document.getElementById('marginTop').value = userMargin.top || 0;
    document.getElementById('marginRight').value = userMargin.right || 0;
    document.getElementById('marginBottom').value = userMargin.bottom || 0;
});

document.getElementById('listPrinters').addEventListener('click', listPrinters);

document.getElementById('savePrinter').addEventListener('click', async () => {
    const printersDropdown = document.getElementById('printersDropdown');
    const selectedPrinter = printersDropdown.value;
    await window.electronAPI.savePrinter(selectedPrinter);
    document.getElementById('selectedPrinter').textContent = selectedPrinter;
});


document.getElementById('togglePrinting').addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    await window.electronAPI.togglePrinting(enabled);
});

document.getElementById('paperSize').addEventListener('change', async (event) => {
    const paperSize = event.target.value;
    await window.electronAPI.setPaperSize(paperSize);
});

document.getElementById('marginLeft').addEventListener('change', async (event) => {
    const margin = event.target.value;
    await window.electronAPI.setUserMargin(margin, 'left');
});

document.getElementById('marginTop').addEventListener('change', async (event) => {
    const margin = event.target.value;
    await window.electronAPI.setUserMargin(margin, 'top');
});

document.getElementById('marginRight').addEventListener('change', async (event) => {
    const margin = event.target.value;
    await window.electronAPI.setUserMargin(margin, 'right');
});

document.getElementById('marginBottom').addEventListener('change', async (event) => {
    const margin = event.target.value;
    await window.electronAPI.setUserMargin(margin, 'bottom');
});

document.getElementById('logoutButton').addEventListener('click', async () => {
    await window.electronAPI.logout();
});

