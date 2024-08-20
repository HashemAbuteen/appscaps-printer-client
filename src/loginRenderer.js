document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const success = await window.electronAPI.login(username, password);
    if (!success) {
        alert('Invalid credentials');
    }
});
