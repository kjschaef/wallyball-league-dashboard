/**
 * This module provides path alias resolution for tests
 * It maps module paths like @/components to their actual locations
 */

import { resolve as pathResolve } from 'path';
import { fileURLToPath } from 'url';
import Module from 'module';
import fs from 'fs';

// Get the directory name from the current file's URL
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = pathResolve(__dirname, '..');

// Store the original Module._resolveFilename
const originalResolveFilename = Module._resolveFilename;

// Define extensions to try
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Create a map of our path aliases
const pathAliases = {
  '@/': pathResolve(rootDir, 'client/src/'),
  '@db/': pathResolve(rootDir, 'db/'),
  '@db': pathResolve(rootDir, 'db/index.ts'),
  '@test/': pathResolve(rootDir, 'test/')
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
    const indexPath = pathResolve(path, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }
  
  return null;
}

// Create a mock implementation for common dependencies
const mocks = {
  '@/lib/utils': {
    cn: (...inputs) => inputs.filter(Boolean).join(' ')
  },
  '@/components/ui/button': {
    Button: ({ children, variant, className, onClick, disabled }) => ({
      type: 'Button',
      props: { children, variant, className, onClick, disabled }
    })
  },
  '@/components/ui/scroll-area': {
    ScrollArea: ({ children }) => ({
      type: 'ScrollArea',
      props: { children }
    })
  }
};

// Override Module._resolveFilename to handle our custom aliases
Module._resolveFilename = function(request, parent, isMain, options) {
  // Check for mocks first
  if (mocks[request]) {
    return request; // Return the request as is, we'll handle it in Module._load
  }
  
  // Check if the request starts with any of our aliases
  for (const [alias, path] of Object.entries(pathAliases)) {
    if (request.startsWith(alias)) {
      // Replace the alias with the actual path
      const relativePath = request.replace(alias, '');
      const basePath = pathResolve(path, relativePath);
      
      // Try to resolve with extensions
      const resolvedPath = resolveWithExtensions(basePath);
      if (resolvedPath) {
        return resolvedPath;
      }
    }
  }
  
  // If no aliases matched or resolution failed, use the original resolver
  return originalResolveFilename(request, parent, isMain, options);
};

// Also override Module._load to handle our mocks
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (mocks[request]) {
    return mocks[request];
  }
  return originalLoad(request, parent, isMain);
};

export default Module._resolveFilename;