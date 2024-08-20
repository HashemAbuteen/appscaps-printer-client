require('dotenv').config();
const { execSync } = require('child_process');

execSync('npx electron-builder --publish always', { stdio: 'inherit' });
