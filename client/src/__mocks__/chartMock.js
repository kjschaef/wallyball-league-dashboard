/**
 * Mock implementation for Chart.js components in tests
 */

const React = require('react');

module.exports = {
  Line: function(props) {
    return React.createElement('canvas', { 'data-testid': 'chart-js-line', ...props });
  },
  Bar: function(props) {
    return React.createElement('canvas', { 'data-testid': 'chart-js-bar', ...props });
  },
  Pie: function(props) {
    return React.createElement('canvas', { 'data-testid': 'chart-js-pie', ...props });
  },
  Doughnut: function(props) {
    return React.createElement('canvas', { 'data-testid': 'chart-js-doughnut', ...props });
  }
};