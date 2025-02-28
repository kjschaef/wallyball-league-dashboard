/**
 * Mock implementation for recharts components in tests
 * This implementation avoids using JSX syntax to ensure compatibility with Jest
 */

import React from 'react';

const Recharts = {
  ResponsiveContainer: function(props) {
    return React.createElement('div', { 'data-testid': 'responsive-container' }, props.children);
  },
  LineChart: function(props) {
    return React.createElement('div', { 'data-testid': 'line-chart' }, props.children);
  },
  Line: function() {
    return React.createElement('div', { 'data-testid': 'chart-line' });
  },
  XAxis: function() {
    return React.createElement('div', { 'data-testid': 'x-axis' });
  },
  YAxis: function() {
    return React.createElement('div', { 'data-testid': 'y-axis' });
  },
  CartesianGrid: function() {
    return React.createElement('div', { 'data-testid': 'cartesian-grid' });
  },
  Tooltip: function() {
    return React.createElement('div', { 'data-testid': 'tooltip' });
  },
  Legend: function() {
    return React.createElement('div', { 'data-testid': 'legend' });
  },
  PieChart: function(props) {
    return React.createElement('div', { 'data-testid': 'pie-chart' }, props.children);
  },
  Pie: function() {
    return React.createElement('div', { 'data-testid': 'pie' });
  },
  Cell: function() {
    return React.createElement('div', { 'data-testid': 'cell' });
  },
  BarChart: function(props) {
    return React.createElement('div', { 'data-testid': 'bar-chart' }, props.children);
  },
  Bar: function() {
    return React.createElement('div', { 'data-testid': 'bar' });
  }
};

export default Recharts;