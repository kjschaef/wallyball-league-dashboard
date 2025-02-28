import { render, screen } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import userEvent from '@testing-library/user-event';

// Mock the wouter navigation
jest.mock('wouter', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid={`link-${href.replace('/', '')}`}>
      {children}
    </a>
  ),
  useLocation: () => ['/dashboard', jest.fn()],
  useRoute: () => [false],
}));

describe('Navbar', () => {
  test('renders all navigation links', () => {
    render(<Navbar />);
    
    // Check if the main navigation links are present
    expect(screen.getByTestId('link-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('link-results')).toBeInTheDocument();
    expect(screen.getByTestId('link-players')).toBeInTheDocument();
  });

  test('has accessible links', async () => {
    render(<Navbar />);
    
    // Check if links have proper attributes for accessibility
    const dashboardLink = screen.getByTestId('link-dashboard');
    
    // Links should be clickable
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    
    // Use userEvent to verify link can be focused on
    const user = userEvent.setup({ delay: null });
    await user.tab();
    
    // After tabbing, one of the links should be focused
    // The exact element depends on the tab order
    const activeElement = document.activeElement;
    expect(activeElement?.tagName.toLowerCase()).toBe('a');
  });

  test('has volleyball title/logo', () => {
    render(<Navbar />);
    
    // Look for the title or logo indicating it's a volleyball app
    // This test might need adjustment based on how the title is implemented
    expect(screen.getByText(/volleyball/i)).toBeInTheDocument();
  });
});