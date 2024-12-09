require('dotenv').config();
const { execSync } = require('child_process');

try {
    console.log('Building for 64-bit Windows...');
    execSync('npx electron-builder --win --x64 --publish always', { stdio: 'inherit' });

    console.log('Building for 32-bit Windows...');
    execSync('npx electron-builder --win --ia32 --publish always', { stdio: 'inherit' });
} catch (error) {
    console.error('Error during the build process:', error);
    process.exit(1);
}
