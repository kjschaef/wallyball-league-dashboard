import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminLoginModal } from '../AdminLoginModal';

// Mock fetch
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

  it('should render when isOpen is true', () => {
    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    expect(screen.getByText('Admin Authentication Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Password')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onSuccess and clear password when submit is successful', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const passwordInput = screen.getByLabelText('Admin Password');
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(global.fetch).toHaveBeenCalledWith('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'secret123' }),
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    expect(passwordInput).toHaveValue('');
  });

  it('should display error message from API when submit fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Incorrect password' }),
    });

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const passwordInput = screen.getByLabelText('Admin Password');
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should display default error message when submit fails without specific error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const passwordInput = screen.getByLabelText('Admin Password');
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should display generic error message when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const passwordInput = screen.getByLabelText('Admin Password');
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should disable inputs and buttons while submitting', async () => {
    // Create a promise that won't resolve immediately to keep it in submitting state
    let resolveFetch: any;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    render(
      <AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const passwordInput = screen.getByLabelText('Admin Password');
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Verifying...');
    expect(cancelButton).toBeDisabled();

    // Resolve fetch to clean up
    resolveFetch({ ok: true });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent('Submit');
    });
  });
});
