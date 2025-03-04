import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard Component', () => {
  it('renders the title and value correctly', () => {
    render(<StatCard title="Total Wins" value="42" />);
    
    expect(screen.getByText('Total Wins')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <StatCard 
        title="Win Rate" 
        value="65%" 
        description="Percentage of games won"
      />
    );
    
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Percentage of games won')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <StatCard 
        title="Test" 
        value="Value" 
        className="custom-class"
      />
    );
    
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('custom-class');
  });
});