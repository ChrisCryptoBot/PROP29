import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Evacuation from '../Evacuation';
import EvacuationAuth from '../modules/EvacuationAuth';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Emergency Evacuation Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('EvacuationAuth', () => {
    it('renders authentication form correctly', () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      expect(screen.getByText('Emergency Access Required')).toBeInTheDocument();
      expect(screen.getByLabelText('Administrator Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Access Evacuation Controls/i })).toBeInTheDocument();
    });

    it('handles successful authentication', async () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Administrator Password');
      const submitButton = screen.getByRole('button', { name: /Access Evacuation Controls/i });

      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('evacuationAuth', 'true');
        expect(mockNavigate).toHaveBeenCalledWith('/evacuation');
      });
    });

    it('handles failed authentication', async () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Administrator Password');
      const submitButton = screen.getByRole('button', { name: /Access Evacuation Controls/i });

      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid password. Access denied.')).toBeInTheDocument();
      });
    });

    it('shows loading state during authentication', async () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Administrator Password');
      const submitButton = screen.getByRole('button', { name: /Access Evacuation Controls/i });

      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Verifying Access...')).toBeInTheDocument();
    });

    it('toggles password visibility', () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Administrator Password');
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      expect(passwordInput).toHaveAttribute('type', 'password');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Evacuation', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('true'); // Authenticated
    });

    it('renders evacuation dashboard when authenticated', () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('Emergency Evacuation')).toBeInTheDocument();
      expect(screen.getByText('Emergency Controls')).toBeInTheDocument();
      expect(screen.getByText('Floor Status')).toBeInTheDocument();
      expect(screen.getByText('Staff Deployment')).toBeInTheDocument();
    });

    it('shows authentication required when not authenticated', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('handles emergency control actions', async () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      const allCallButton = screen.getByText('All-Call');
      
      fireEvent.click(allCallButton);

      await waitFor(() => {
        expect(screen.getByText('All-call announcement initiated')).toBeInTheDocument();
      });
    });

    it('handles broadcast announcement', async () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      const announcementInput = screen.getByPlaceholderText('Type announcement to all guests and staff...');
      const broadcastButton = screen.getByText('Broadcast Now');

      fireEvent.change(announcementInput, { target: { value: 'Test announcement' } });
      fireEvent.click(broadcastButton);

      await waitFor(() => {
        expect(screen.getByText(/Broadcast: Test announcement/)).toBeInTheDocument();
      });
    });

    it('handles evacuation start and end', async () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      const startButton = screen.getByText('Start Evacuation');
      
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Emergency evacuation initiated')).toBeInTheDocument();
        expect(screen.getByText('End Evacuation')).toBeInTheDocument();
      });

      // Mock window.confirm to return true
      window.confirm = vi.fn(() => true);

      const endButton = screen.getByText('End Evacuation');
      fireEvent.click(endButton);

      await waitFor(() => {
        expect(screen.getByText('Evacuation completed - All clear')).toBeInTheDocument();
      });
    });

    it('displays evacuation metrics correctly', () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('247')).toBeInTheDocument(); // Evacuated
      expect(screen.getByText('89')).toBeInTheDocument(); // In Progress
      expect(screen.getByText('556')).toBeInTheDocument(); // Remaining
      expect(screen.getByText('12')).toBeInTheDocument(); // Staff Deployed
    });

    it('shows floor evacuation status', () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('Ground Floor')).toBeInTheDocument();
      expect(screen.getByText('Floor 2-5')).toBeInTheDocument();
      expect(screen.getByText('Floor 6-10')).toBeInTheDocument();
    });

    it('displays staff deployment information', () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('Sarah Miller')).toBeInTheDocument();
      expect(screen.getByText('James Davis')).toBeInTheDocument();
      expect(screen.getByText('Lisa Wang')).toBeInTheDocument();
      expect(screen.getByText('Mike Rodriguez')).toBeInTheDocument();
    });

    it('shows evacuation timeline', () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('Fire alarm triggered - Floor 11 East Wing')).toBeInTheDocument();
      expect(screen.getByText('Automatic evacuation protocol initiated')).toBeInTheDocument();
      expect(screen.getByText('Floors 2-10 evacuation in progress')).toBeInTheDocument();
    });

    it('displays guest assistance needs', () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('Room 318')).toBeInTheDocument();
      expect(screen.getByText('Wheelchair user')).toBeInTheDocument();
      expect(screen.getByText('Room 425')).toBeInTheDocument();
      expect(screen.getByText('Elderly guest, slow mobility')).toBeInTheDocument();
    });

    it('shows evacuation routes status', () => {
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      expect(screen.getByText('Stairwell A')).toBeInTheDocument();
      expect(screen.getByText('Stairwell B')).toBeInTheDocument();
      expect(screen.getByText('Stairwell C')).toBeInTheDocument();
      expect(screen.getByText('Emergency Exit')).toBeInTheDocument();
    });

    it('handles error states gracefully', async () => {
      // Mock console.error to avoid error logs in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <Evacuation />
        </TestWrapper>
      );

      // Simulate an error by triggering an invalid action
      const unlockButton = screen.getByText('Unlock Exits');
      
      // Mock an error response
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      fireEvent.click(unlockButton);

      await waitFor(() => {
        // Error should be displayed
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Administrator Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Access Evacuation Controls/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Administrator Password');
      const submitButton = screen.getByRole('button', { name: /Access Evacuation Controls/i });

      // Tab navigation should work
      passwordInput.focus();
      expect(document.activeElement).toBe(passwordInput);

      fireEvent.keyDown(passwordInput, { key: 'Tab' });
      expect(document.activeElement).toBe(submitButton);
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Administrator Password');
      const submitButton = screen.getByRole('button', { name: /Access Evacuation Controls/i });

      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles invalid form submissions', () => {
      render(
        <TestWrapper>
          <EvacuationAuth />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /Access Evacuation Controls/i });

      fireEvent.click(submitButton);

      // Button should be disabled when password is empty
      expect(submitButton).toBeDisabled();
    });
  });
});

// Integration Tests
describe('Emergency Evacuation Integration', () => {
  it('completes full authentication flow', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { rerender } = render(
      <TestWrapper>
        <EvacuationAuth />
      </TestWrapper>
    );

    // Start with auth form
    expect(screen.getByText('Emergency Access Required')).toBeInTheDocument();

    // Authenticate
    const passwordInput = screen.getByLabelText('Administrator Password');
    const submitButton = screen.getByRole('button', { name: /Access Evacuation Controls/i });

    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/evacuation');
    });

    // Simulate navigation to evacuation dashboard
    localStorageMock.getItem.mockReturnValue('true');
    
    rerender(
      <TestWrapper>
        <Evacuation />
      </TestWrapper>
    );

    // Should show evacuation dashboard
    expect(screen.getByText('Emergency Evacuation')).toBeInTheDocument();
  });
});


