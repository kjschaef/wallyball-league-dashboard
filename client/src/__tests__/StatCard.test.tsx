import { render, screen } from '@testing-library/react';
import { StatCard } from '../components/StatCard';
import { Award } from 'lucide-react';

describe('StatCard', () => {
  test('renders with all properties correctly', () => {
    render(
      <StatCard
        title="Win Rate"
        value="75%"
        description="Last 20 matches"
        icon={<Award data-testid="test-icon" />}
        className="custom-class"
      />
    );

    // Check if all parts are rendered correctly
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Last 20 matches')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  test('renders without optional properties', () => {
    render(
      <StatCard
        title="Points"
        value={120}
      />
    );

    // Should render title and value
    expect(screen.getByText('Points')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    
    // No description or icon should be rendered
    const cardElement = screen.getByText('Points').closest('div');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement?.textContent).not.toContain('undefined');
  });

  test('applies custom class name', () => {
    render(
      <StatCard
        title="Games"
        value="10"
        className="test-custom-class"
      />
    );

    // The root element should have the custom class
    const cardElement = screen.getByText('Games').closest('div');
    expect(cardElement).toHaveClass('test-custom-class');
  });
});