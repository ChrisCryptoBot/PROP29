import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import GuestSafetyAuth from '../modules/GuestSafetyAuth';
import GuestSafety from '../modules/GuestSafety';

// Mock the BackToDashboardButton as it's an external dependency
jest.mock('../../components/UI/BackToDashboardButton', () => {
  return ({ label = 'Back to Dashboard' }) => (
    <button data-testid="back-to-dashboard-button">{label}</button>
  );
});

// Mock the UI components
jest.mock('../../components/UI/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className} data-testid="card-title">{children}</h3>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

jest.mock('../../components/UI/Button', () => ({
  Button: ({ children, onClick, className, variant }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    className?: string; 
    variant?: string;
  }) => (
    <button onClick={onClick} className={className} data-testid="button" data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock('../../components/UI/Badge', () => ({
  Badge: ({ children, variant, size }: { 
    children: React.ReactNode; 
    variant?: string; 
    size?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} data-size={size}>
      {children}
    </span>
  ),
}));

// Mock WebSocket provider
jest.mock('../../components/UI/WebSocketProvider', () => ({
  useWebSocket: () => ({
    subscribe: jest.fn(() => jest.fn()),
    unsubscribe: jest.fn(),
  }),
}));

// Mock API service
jest.mock('../../services/ApiService', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock toast utilities
jest.mock('../../utils/toast', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showLoading: jest.fn(),
  dismissLoadingAndShowSuccess: jest.fn(),
  dismissLoadingAndShowError: jest.fn(),
}));

// Mock the useNavigate hook
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('GuestSafetyAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUsedNavigate.mockClear();
  });

  it('renders the authentication form', () => {
    render(
      <BrowserRouter>
        <GuestSafetyAuth />
      </BrowserRouter>
    );
    expect(screen.getByText(/Secure Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Administrator Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Access Guest Safety/i })).toBeInTheDocument();
  });

  it('shows an error for invalid password', async () => {
    render(
      <BrowserRouter>
        <GuestSafetyAuth />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Guest Safety/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid password\. Access denied\./i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Administrator Password/i)).toHaveValue('');
  });

  it('navigates to guest safety on successful authentication', async () => {
    render(
      <MemoryRouter initialEntries={['/modules/GuestSafetyAuth']}>
        <Routes>
          <Route path="/modules/GuestSafetyAuth" element={<GuestSafetyAuth />} />
          <Route path="/modules/guest-safety" element={<div>Guest Safety Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Guest Safety/i }));

    await waitFor(() => {
      expect(localStorage.getItem('admin_guestsafety_authenticated')).toBe('true');
      expect(screen.getByText(/Guest Safety Page/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during authentication', async () => {
    render(
      <BrowserRouter>
        <GuestSafetyAuth />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Guest Safety/i }));

    expect(screen.getByText(/Verifying\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Verifying\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <GuestSafetyAuth />
      </BrowserRouter>
    );
    const passwordInput = screen.getByLabelText(/Administrator Password/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/Show password/i);

    expect(passwordInput.type).toBe('password');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    expect(screen.getByLabelText(/Hide password/i)).toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
    expect(screen.getByLabelText(/Show password/i)).toBeInTheDocument();
  });
});

describe('GuestSafety', () => {
  beforeEach(() => {
    localStorage.setItem('admin_guestsafety_authenticated', 'true'); // Ensure authenticated state
    mockedUsedNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.removeItem('admin_guestsafety_authenticated');
  });

  it('redirects to auth if not authenticated', () => {
    localStorage.removeItem('admin_guestsafety_authenticated');
    render(
      <MemoryRouter initialEntries={['/modules/guest-safety']}>
        <Routes>
          <Route path="/modules/guest-safety" element={<GuestSafety />} />
          <Route path="/modules/GuestSafetyAuth" element={<div>Guest Safety Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Guest Safety Auth Page/i)).toBeInTheDocument();
  });

  it('renders the main interface when authenticated', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Guest Panic Alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/Critical Incidents/i)).toBeInTheDocument();
      expect(screen.getByText(/High Priority/i)).toBeInTheDocument();
      expect(screen.getByText(/Medium Priority/i)).toBeInTheDocument();
      expect(screen.getByText(/Low Priority/i)).toBeInTheDocument();
    });
  });

  it('displays KPI cards with correct values', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Critical incidents
      expect(screen.getByText('2')).toBeInTheDocument(); // High priority
      expect(screen.getByText('5')).toBeInTheDocument(); // Medium priority
      expect(screen.getByText('8')).toBeInTheDocument(); // Low priority
    });
  });

  it('filters incidents by priority', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const filterDropdown = screen.getByDisplayValue('All Incidents');
      fireEvent.change(filterDropdown, { target: { value: 'critical' } });
      
      // Should show only critical incidents
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const massNotificationTab = screen.getByText('Mass Notification');
      fireEvent.click(massNotificationTab);
      
      expect(screen.getByText('Send Mass Notification')).toBeInTheDocument();
    });
  });

  it('opens incident details modal when incident card is clicked', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const incidentCard = screen.getByText('Medical Incident');
      fireEvent.click(incidentCard);
      
      // Should show incident details modal
      expect(screen.getByText('Guest Information')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('resolves an incident when resolve button is clicked', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const resolveButtons = screen.getAllByText('Resolve');
      fireEvent.click(resolveButtons[0]);
      
      // Should show loading state and then success
      expect(screen.getByText(/Resolving incident\.\.\./i)).toBeInTheDocument();
    });
  });

  it('assigns a team to an incident', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const assignTeamButtons = screen.getAllByText('Assign Team');
      fireEvent.click(assignTeamButtons[0]);
      
      // Should show loading state and then success
      expect(screen.getByText(/Assigning team\.\.\./i)).toBeInTheDocument();
    });
  });

  it('sends mass notification when form is submitted', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const massNotificationTab = screen.getByText('Mass Notification');
      fireEvent.click(massNotificationTab);
      
      const messageInput = screen.getByPlaceholderText(/Enter your message here/i);
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByText('Send Notification');
      fireEvent.click(sendButton);
      
      // Should show loading state and then success
      expect(screen.getByText(/Sending mass notification\.\.\./i)).toBeInTheDocument();
    });
  });

  it('displays response teams tab', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const responseTeamsTab = screen.getByText('Response Teams');
      fireEvent.click(responseTeamsTab);
      
      expect(screen.getByText('Security Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Medical Response')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  it('shows dropdown menu when menu button is clicked', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const menuButton = screen.getByText('Incidents');
      fireEvent.click(menuButton);
      
      // Should show dropdown with menu options
      expect(screen.getByText('Mass Notification')).toBeInTheDocument();
      expect(screen.getByText('Response Teams')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('navigates to different tabs when clicked', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const menuButton = screen.getByText('Incidents');
      fireEvent.click(menuButton);
      
      const analyticsButton = screen.getByText('Analytics');
      fireEvent.click(analyticsButton);
      
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/modules/safety-analytics');
    });
  });

  it('closes modal when close button is clicked', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const incidentCard = screen.getByText('Medical Incident');
      fireEvent.click(incidentCard);
      
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      
      // Modal should be closed
      expect(screen.queryByText('Guest Information')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no incidents match filter', async () => {
    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      const filterDropdown = screen.getByDisplayValue('All Incidents');
      fireEvent.change(filterDropdown, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('No incidents found')).toBeInTheDocument();
    });
  });

  it('handles WebSocket connection errors gracefully', async () => {
    // Mock WebSocket to throw an error
    const mockWebSocket = {
      subscribe: jest.fn(() => {
        throw new Error('WebSocket connection failed');
      }),
    };
    
    jest.doMock('../../components/UI/WebSocketProvider', () => ({
      useWebSocket: () => mockWebSocket,
    }));

    render(
      <BrowserRouter>
        <GuestSafety />
      </BrowserRouter>
    );
    
    // Should still render the component despite WebSocket error
    await waitFor(() => {
      expect(screen.getByText(/Guest Panic Alerts/i)).toBeInTheDocument();
    });
  });
});


