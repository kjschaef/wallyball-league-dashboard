// Mock for chart-related components
module.exports = {
  ResponsiveContainer: ({ children }) => children,
  LineChart: ({ children }) => children,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: ({ children }) => children,
  Bar: () => null,
  PieChart: ({ children }) => children,
  Pie: () => null,
  Cell: () => null,
  Scatter: () => null,
  ScatterChart: () => null,
  AreaChart: ({ children }) => children,
  Area: () => null
};