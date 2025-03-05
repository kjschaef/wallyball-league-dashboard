/**
 * Custom module resolver to handle path aliases in tests
 * This file hooks into Node.js module loading system to resolve path aliases like @/components
 */

import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get current directory 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Create a path map for our aliases
const pathMap = {
  '@/': resolve(projectRoot, 'client/src/'),
  '@db/': resolve(projectRoot, 'db/'),
  '@db': resolve(projectRoot, 'db/index.ts'),
  '@test/': resolve(projectRoot, 'test/')
};

/**
 * Custom module resolver function
 * @param {string} specifier - The module path to resolve
 * @param {object} context - The context object
 * @param {Function} nextResolve - The next resolver in the chain
 * @returns {Promise<{url: string}>} The resolved URL
 */
export async function resolve(specifier, context, nextResolve) {
  // Check if the specifier starts with any of our aliases
  for (const [alias, path] of Object.entries(pathMap)) {
    if (specifier.startsWith(alias)) {
      // If it does, replace the alias with the actual path
      const newSpecifier = specifier.replace(alias, `${path}/`);
      // Try to resolve the new path
      try {
        return await nextResolve(newSpecifier, context);
      } catch (e) {
        // If it fails, try without the trailing slash
        try {
          return await nextResolve(specifier.replace(alias, path), context);
        } catch (innerErr) {
          // If that also fails, continue to the next alias
          continue;
        }
      }
    }
  }
  
  // If no aliases matched, use the default resolver
  return nextResolve(specifier, context);
}

// Allow importing packages from node_modules without specifying the full path
export function load(url, context, nextLoad) {
  return nextLoad(url, context);
}

// Set up a require function that uses our custom resolver
export const require = createRequire(import.meta.url);