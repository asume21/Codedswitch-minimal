const { execSync } = require('child_process');
const { platform, arch } = require('os');

console.log('Running custom build script for Render...');

// Install the correct esbuild binary for the current platform
try {
  const platformName = platform() === 'win32' ? 'windows' : platform() === 'darwin' ? 'darwin' : 'linux';
  const archName = arch() === 'x64' ? '64' : '32';
  const pkg = `@esbuild/${platformName}-${archName}`;
  console.log(`Installing ${pkg}...`);
  execSync(`npm install --no-save ${pkg}`, { stdio: 'inherit' });
  
  // Run the build
  console.log('Running build...');
  execSync('vite build --base=/', { stdio: 'inherit' });
  
  // Copy necessary files
  console.log('Copying additional files...');
  const fs = require('fs');
  fs.copyFileSync('public/_redirects', 'dist/_redirects');
  if (fs.existsSync('static.json')) {
    fs.copyFileSync('static.json', 'dist/static.json');
  }
  
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
