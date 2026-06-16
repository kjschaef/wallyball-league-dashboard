import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminLoginModal } from '@/app/components/AdminLoginModal';

// Mock fetch globally
global.fetch = jest.fn();

describe('AdminLoginModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AdminLoginModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render correctly when isOpen is true', () => {
    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    expect(screen.getByText('Admin Authentication Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should update password state on input change', () => {
    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    const input = screen.getByLabelText('Admin Password');
    fireEvent.change(input, { target: { value: 'testpass' } });
    expect(input).toHaveValue('testpass');
  });

  it('should successfully submit and call onSuccess', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByLabelText('Admin Password');
    fireEvent.change(input, { target: { value: 'correctpass' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: 'Verifying...' })).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'correctpass' }),
      }));
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    // Password should be cleared
    expect(input).toHaveValue('');
  });

  it('should display error message on API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Custom error message' }),
    });

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByLabelText('Admin Password');
    fireEvent.change(input, { target: { value: 'wrongpass' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should display default error message when API returns no explicit error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByLabelText('Admin Password');
    fireEvent.change(input, { target: { value: 'wrongpass' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
  });

  it('should display generic error message on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByLabelText('Admin Password');
    fireEvent.change(input, { target: { value: 'anypass' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });
});
