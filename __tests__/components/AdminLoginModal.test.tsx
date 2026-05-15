import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminLoginModal } from '@/app/components/AdminLoginModal';

describe('AdminLoginModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<AdminLoginModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    expect(screen.queryByText('Admin Authentication Required')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    expect(screen.getByText('Admin Authentication Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X icon is clicked', () => {
    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('submits the form successfully and calls onSuccess', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Admin Password'), { target: { value: 'secret' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secret' }),
    }));

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Admin Password')).toHaveValue(''); // Password should be cleared on success
  });

  it('displays an error message when authentication fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Incorrect password' })
    });

    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Admin Password'), { target: { value: 'wrong' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(await screen.findByText('Incorrect password')).toBeInTheDocument();
  });

  it('displays a fallback error message when authentication fails without a specific error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Admin Password'), { target: { value: 'wrong' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Invalid password')).toBeInTheDocument();
  });

  it('displays an error message when the fetch request throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Admin Password'), { target: { value: 'secret' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('An error occurred. Please try again.')).toBeInTheDocument();
  });

  it('disables buttons while submitting', async () => {
    // Return a promise that doesn't resolve immediately to keep it in submitting state
    let resolveFetch!: (value: unknown) => void;
    const fetchPromise = new Promise(resolve => {
        resolveFetch = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

    render(<AdminLoginModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText('Admin Password'), { target: { value: 'secret' } });

    // Use act to trigger the click which will set isSubmitting to true
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });

    // Check if buttons are disabled
    expect(screen.getByRole('button', { name: 'Verifying...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    // Now resolve the fetch promise
    await act(async () => {
        resolveFetch({ ok: true, json: async () => ({}) });
    });
  });
});
