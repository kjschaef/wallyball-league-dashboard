/**
 * This module provides path alias resolution for tests
 * It maps module paths like @/components to their actual locations
 */

import { resolve as pathResolve } from 'path';
import { fileURLToPath } from 'url';
import Module from 'module';

// Get the directory name from the current file's URL
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Store the original Module._resolveFilename
const originalResolveFilename = Module._resolveFilename;

// Create a map of our path aliases
const pathAliases = {
  '@/': pathResolve(__dirname, '../client/src/'),
  '@db/': pathResolve(__dirname, '../db/'),
  '@db': pathResolve(__dirname, '../db/index.ts'),
  '@test/': pathResolve(__dirname, '../test/')
};

// Override Module._resolveFilename to handle our custom aliases
Module._resolveFilename = function(request, parent, isMain, options) {
  // Check if the request starts with any of our aliases
  for (const [alias, path] of Object.entries(pathAliases)) {
    if (request.startsWith(alias)) {
      // Replace the alias with the actual path
      const aliasedPath = request.replace(alias, path + '/');
      // Try to resolve the path (may throw if module doesn't exist)
      try {
        return originalResolveFilename(aliasedPath, parent, isMain, options);
      } catch (err) {
        // If it fails, try without the trailing slash
        try {
          return originalResolveFilename(request.replace(alias, path), parent, isMain, options);
        } catch (innerErr) {
          // If that also fails, continue to the next alias
          continue;
        }
      }
    }
  }
  
  // If no aliases matched or resolution failed, use the original resolver
  return originalResolveFilename(request, parent, isMain, options);
};

export default Module._resolveFilename;