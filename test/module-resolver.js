/**
 * Custom module resolver to handle path aliases in tests
 * This file hooks into Node.js module loading system to resolve path aliases like @/components
 */

import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Define extensions to try
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Create a path map for our aliases
const pathMap = {
  '@/': resolve(projectRoot, 'client/src/'),
  '@db/': resolve(projectRoot, 'db/'),
  '@db': resolve(projectRoot, 'db/index.ts'),
  '@test/': resolve(projectRoot, 'test/')
};

// Define mocks for UI components and utilities
const mockedModules = {
  '@/lib/utils': 'export const cn = (...inputs) => inputs.filter(Boolean).join(" ");',
  '@/components/ui/button': 'export const Button = ({ children, variant, className, onClick, disabled }) => ({ type: "Button", props: { children, variant, className, onClick, disabled } });',
  '@/components/ui/scroll-area': 'export const ScrollArea = ({ children }) => ({ type: "ScrollArea", props: { children } });'
};

/**
 * Check if a file exists with any of the supported extensions
 * @param {string} path - Base path to check
 * @returns {string|null} - Full path with extension if found, null otherwise
 */
function resolveWithExtensions(path) {
  // First check if the exact path exists
  if (fs.existsSync(path)) {
    return path;
  }
  
  // Then try with each extension
  for (const ext of extensions) {
    const pathWithExt = `${path}${ext}`;
    if (fs.existsSync(pathWithExt)) {
      return pathWithExt;
    }
  }
  
  // Check for index files in directories
  for (const ext of extensions) {
    const indexPath = resolve(path, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

/**
 * Create a data URL for mocked module content
 * @param {string} content - The module content
 * @returns {string} - A data URL containing the module content
 */
function createDataUrl(content) {
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(content)}`;
}

/**
 * Custom module resolver function
 * @param {string} specifier - The module path to resolve
 * @param {object} context - The context object
 * @param {Function} nextResolve - The next resolver in the chain
 * @returns {Promise<{url: string}>} The resolved URL
 */
export async function resolve(specifier, context, nextResolve) {
  // Check for mocked modules first
  if (mockedModules[specifier]) {
    return {
      url: createDataUrl(mockedModules[specifier]),
      shortCircuit: true
    };
  }
  
  // Check if the specifier starts with any of our aliases
  for (const [alias, path] of Object.entries(pathMap)) {
    if (specifier.startsWith(alias)) {
      // If it does, replace the alias with the actual path
      const relativePath = specifier.replace(alias, '');
      const basePath = resolve(path, relativePath);
      
      // Try to resolve with extensions
      const resolvedPath = resolveWithExtensions(basePath);
      if (resolvedPath) {
        // Convert to URL format (file://)
        return nextResolve(`file://${resolvedPath}`, context);
      }
      
      // If we can't resolve the path directly, check if it's a directory
      if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
        // Try to find an index file
        for (const ext of extensions) {
          const indexPath = resolve(basePath, `index${ext}`);
          if (fs.existsSync(indexPath)) {
            return nextResolve(`file://${indexPath}`, context);
          }
        }
      }
    }
  }
  
  // If no aliases matched, use the default resolver
  return nextResolve(specifier, context);
}

/**
 * Custom module loader function
 * @param {string} url - The URL to load
 * @param {object} context - The context object
 * @param {Function} nextLoad - The next loader in the chain
 * @returns {Promise<{format: string, source: string}>} The loaded module
 */
export function load(url, context, nextLoad) {
  // Handle data URLs for mocked modules
  if (url.startsWith('data:')) {
    const source = decodeURIComponent(url.split(',')[1]);
    return {
      format: 'module',
      source,
      shortCircuit: true
    };
  }
  
  // Otherwise, use the default loader
  return nextLoad(url, context);
}

// Set up a require function that uses our custom resolver
export const require = createRequire(import.meta.url);