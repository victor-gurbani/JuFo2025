const fs = require('fs');
const path = require('path');
const bytenode = require('bytenode');
const v8 = require('v8');

// Enable code cache
v8.setFlagsFromString('--no-lazy');

// Files to compile
const filesToCompile = [
  './server.js',
  './routes/admin.js',
  './routes/teacher.js',
  './routes/guard.js',
  './routes/cards.js',
  './middleware/checkPermission.js',
  './utils/imageProcessor.js'
];

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create subdirectories
['routes', 'middleware', 'utils'].forEach(dir => {
  const fullDir = path.join(distDir, dir);
  if (!fs.existsSync(fullDir)) {
    fs.mkdirSync(fullDir, { recursive: true });
  }
});

// Compile each file
filesToCompile.forEach(file => {
  const outputFile = path.join(
    distDir, 
    file.replace('.js', '.jsc')
  );
  
  console.log(`Compiling ${file} to ${outputFile}`);
  bytenode.compileFile({
    filename: file,
    output: outputFile,
    compileAsModule: true
  });
});

// Create launcher script
const launcherContent = `
const bytenode = require('bytenode');
const v8 = require('v8');
const path = require('path');

// Enable code cache
v8.setFlagsFromString('--no-lazy');

// Load database module which is not compiled
const sqlite3 = require('sqlite3').verbose();

// Load compiled server
require(path.join(__dirname, 'server.jsc'));
`;

fs.writeFileSync(path.join(distDir, 'index.js'), launcherContent);

console.log('Compilation complete! Run with: node dist/index.js');