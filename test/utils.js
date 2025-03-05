/**
 * Basic utility functions for testing
 */

/**
 * Add two numbers together
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - The sum of a and b
 */
export function addNumbers(a, b) {
  return a + b;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - The input string
 * @returns {string} - The capitalized string
 */
export function capitalizeString(str) {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Filter an array based on a predicate function
 * @param {Array} arr - The array to filter
 * @param {Function} predicate - The predicate function
 * @returns {Array} - The filtered array
 */
export function filterArray(arr, predicate) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(predicate);
}