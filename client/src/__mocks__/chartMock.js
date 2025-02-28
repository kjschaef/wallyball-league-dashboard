/**
 * Mock implementation for Chart.js components in tests
 */
import React from 'react';

const ChartJS = {
  Chart: class {
    constructor() {}
    static register() {}
  },
  registerables: [],
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

export default ChartJS;