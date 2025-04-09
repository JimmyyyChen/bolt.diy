/**
 * This script is executed after the build to ensure proper Netlify compatibility
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('Running Netlify post-build script...');

// Ensure server.js exists for Netlify function to import
const SERVER_BUILD_DIR = join(process.cwd(), 'build', 'server');
const SERVER_JS_PATH = join(SERVER_BUILD_DIR, 'server.js');

// Create build/server directory if it doesn't exist
if (!existsSync(SERVER_BUILD_DIR)) {
  console.log('Creating build/server directory...');
  mkdirSync(SERVER_BUILD_DIR, { recursive: true });
}

// Write server.js file
console.log(`Writing server.js to ${SERVER_JS_PATH}...`);
writeFileSync(SERVER_JS_PATH, 'export { default } from "./index.js";\n');

console.log('Netlify post-build completed successfully'); 