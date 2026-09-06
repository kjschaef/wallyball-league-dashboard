import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Navbar } from '@/app/components/Navbar';
import { useAdmin } from '@/app/components/AdminProvider';
import { usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('@/app/components/AdminProvider', () => ({
  useAdmin: jest.fn(),
}));

describe('Navbar Component', () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
    (useAdmin as jest.Mock).mockReturnValue({
      isAdmin: false,
      login: mockLogin,
      logout: mockLogout,
    });
  });

  it('renders brand title linking to home', () => {
    render(<Navbar />);
    const brandLink = screen.getByRole('link', { name: 'Wallyball League' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  describe('Non-Admin (Guest) State', () => {
    it('renders standard desktop links and excludes Matches from mobile and Settings from both', () => {
      render(<Navbar />);

      const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
      const mobileNav = screen.getByRole('navigation', { name: 'Mobile Navigation' });

      // Desktop navigation assertions
      expect(within(desktopNav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
      expect(within(desktopNav).getByRole('link', { name: 'Matches' })).toHaveAttribute('href', '/games');
      expect(within(desktopNav).getByRole('link', { name: 'Results' })).toHaveAttribute('href', '/results');
      expect(within(desktopNav).getByRole('link', { name: 'Signups' })).toHaveAttribute('href', '/signups');
      expect(within(desktopNav).queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();

      // Mobile navigation assertions
      expect(within(mobileNav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
      expect(within(mobileNav).getByRole('link', { name: 'Results' })).toHaveAttribute('href', '/results');
      expect(within(mobileNav).getByRole('link', { name: 'Signups' })).toHaveAttribute('href', '/signups');
      // Matches should be excluded on mobile
      expect(within(mobileNav).queryByRole('link', { name: 'Matches' })).not.toBeInTheDocument();
      // Settings should be hidden on mobile when not admin
      expect(within(mobileNav).queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();

      // Admin toggle should show "Admin Login"
      expect(screen.getByRole('button', { name: /Admin Login/i })).toBeInTheDocument();
    });

    it('triggers login when Admin Login button is clicked', () => {
      render(<Navbar />);
      const adminButton = screen.getByRole('button', { name: /Admin Login/i });
      fireEvent.click(adminButton);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Admin Mode Active', () => {
    beforeEach(() => {
      (useAdmin as jest.Mock).mockReturnValue({
        isAdmin: true,
        login: mockLogin,
        logout: mockLogout,
      });
    });

    it('renders Settings in both desktop and mobile navigation', () => {
      render(<Navbar />);

      const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
      const mobileNav = screen.getByRole('navigation', { name: 'Mobile Navigation' });

      expect(within(desktopNav).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
      expect(within(mobileNav).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');

      // Admin toggle shows "Admin Mode On"
      const adminButton = screen.getByRole('button', { name: /Admin Mode On/i });
      expect(adminButton).toBeInTheDocument();

      // Clicking triggers logout
      fireEvent.click(adminButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Active Page Indicator', () => {
    it('applies aria-current="page" to active route links', () => {
      (usePathname as jest.Mock).mockReturnValue('/results');
      render(<Navbar />);

      const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
      const mobileNav = screen.getByRole('navigation', { name: 'Mobile Navigation' });

      const desktopResultsLink = within(desktopNav).getByRole('link', { name: 'Results' });
      const mobileResultsLink = within(mobileNav).getByRole('link', { name: 'Results' });
      const desktopDashboardLink = within(desktopNav).getByRole('link', { name: 'Dashboard' });

      expect(desktopResultsLink).toHaveAttribute('aria-current', 'page');
      expect(mobileResultsLink).toHaveAttribute('aria-current', 'page');
      expect(desktopDashboardLink).not.toHaveAttribute('aria-current');
    });
  });
});
