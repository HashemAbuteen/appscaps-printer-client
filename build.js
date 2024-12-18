require('dotenv').config();
const { execSync } = require('child_process');

try {
    console.log('Building...');
    execSync('npx electron-builder --win --publish always', { stdio: 'inherit' });
} catch (error) {
    console.error('Error during the build process:', error);
    process.exit(1);
}
