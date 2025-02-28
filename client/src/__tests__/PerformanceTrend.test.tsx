import { render, screen } from '@testing-library/react';
import { PerformanceTrend } from '../components/PerformanceTrend';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the API response data
const mockPerformanceData = [
  { date: '2023-01-01', winRate: 0.75 },
  { date: '2023-01-08', winRate: 0.80 },
  { date: '2023-01-15', winRate: 0.60 },
  { date: '2023-01-22', winRate: 0.90 },
];

// Mock the useQuery hook
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockReturnValue({
    data: mockPerformanceData,
    isLoading: false,
    isError: false,
  }),
}));

// Mock the recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="chart-line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Wrapper component with QueryClient provider
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('PerformanceTrend Component', () => {
  test('renders the performance chart', () => {
    render(<PerformanceTrend />, { wrapper: Wrapper });
    
    // Check for the chart title
    expect(screen.getByText('Team Performance Trend')).toBeInTheDocument();
    
    // Check for chart components
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-line')).toBeInTheDocument();
  });

  test('renders loading state when data is loading', () => {
    // Override the mock to show loading state
    require('@tanstack/react-query').useQuery.mockReturnValueOnce({
      isLoading: true,
      data: null,
      isError: false,
    });
    
    render(<PerformanceTrend />, { wrapper: Wrapper });
    
    // Check for loading indicator
    expect(screen.getByText(/loading performance data/i)).toBeInTheDocument();
  });

  test('renders error state when there is an error', () => {
    // Override the mock to show error state
    require('@tanstack/react-query').useQuery.mockReturnValueOnce({
      isLoading: false,
      data: null,
      isError: true,
      error: new Error('Failed to fetch data'),
    });
    
    render(<PerformanceTrend />, { wrapper: Wrapper });
    
    // Check for error message
    expect(screen.getByText(/error loading performance data/i)).toBeInTheDocument();
  });

  test('renders in export mode correctly', () => {
    render(<PerformanceTrend isExporting={true} />, { wrapper: Wrapper });
    
    // In export mode, we should have a specific class or style
    const chartContainer = screen.getByTestId('responsive-container').parentElement;
    expect(chartContainer).toHaveClass('export-mode');
  });
});