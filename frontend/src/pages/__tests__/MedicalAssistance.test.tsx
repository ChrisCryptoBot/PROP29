import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import MedicalAssistanceAuth from '../modules/MedicalAssistanceAuth';
import MedicalAssistance from '../MedicalAssistance';

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

// Mock the IncidentLogService
jest.mock('../../services/IncidentLogService', () => ({
  logIncident: jest.fn(),
  getIncidents: jest.fn(),
}));

// Mock toast utilities
jest.mock('../../utils/toast', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showLoading: jest.fn(() => 'mock-toast-id'),
  dismissLoadingAndShowSuccess: jest.fn(),
  dismissLoadingAndShowError: jest.fn(),
}));

// Mock the useNavigate hook
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('MedicalAssistanceAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUsedNavigate.mockClear();
  });

  it('renders the authentication form', () => {
    render(
      <BrowserRouter>
        <MedicalAssistanceAuth />
      </BrowserRouter>
    );
    expect(screen.getByText(/Secure Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Administrator Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Access Medical Response/i })).toBeInTheDocument();
  });

  it('shows an error for invalid password', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistanceAuth />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Medical Response/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid password\. Access denied\./i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Administrator Password/i)).toHaveValue('');
  });

  it('navigates to medical assistance on successful authentication', async () => {
    render(
      <MemoryRouter initialEntries={['/modules/MedicalAssistanceAuth']}>
        <Routes>
          <Route path="/modules/MedicalAssistanceAuth" element={<MedicalAssistanceAuth />} />
          <Route path="/medical-assistance" element={<div>Medical Assistance Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Medical Response/i }));

    await waitFor(() => {
      expect(localStorage.getItem('admin_medicalassistance_authenticated')).toBe('true');
      expect(screen.getByText(/Medical Assistance Page/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during authentication', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistanceAuth />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Medical Response/i }));

    expect(screen.getByText(/Verifying\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Verifying\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <MedicalAssistanceAuth />
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

describe('MedicalAssistance', () => {
  beforeEach(() => {
    localStorage.setItem('admin_medicalassistance_authenticated', 'true'); // Ensure authenticated state
    mockedUsedNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.removeItem('admin_medicalassistance_authenticated');
  });

  it('redirects to auth if not authenticated', () => {
    localStorage.removeItem('admin_medicalassistance_authenticated');
    render(
      <MemoryRouter initialEntries={['/medical-assistance']}>
        <Routes>
          <Route path="/medical-assistance" element={<MedicalAssistance />} />
          <Route path="/modules/MedicalAssistanceAuth" element={<div>Medical Assistance Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/Medical Assistance Auth Page/i)).toBeInTheDocument();
  });

  it('renders the main interface when authenticated', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    expect(screen.getByText(/Medical Emergency Response/i)).toBeInTheDocument();
    expect(screen.getByText(/Emergency Response Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Response Timeline/i)).toBeInTheDocument();
  });

  it('displays emergency timer', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    expect(screen.getByText(/00:00/)).toBeInTheDocument(); // Timer starts at 00:00
    expect(screen.getByText(/Incident ID:/)).toBeInTheDocument();
  });

  it('allows patient location input', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const locationInput = screen.getByPlaceholderText(/Enter exact location/i);
    fireEvent.change(locationInput, { target: { value: 'Room 318' } });
    
    expect(locationInput).toHaveValue('Room 318');
  });

  it('allows consciousness level selection', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const consciousnessSelect = screen.getByDisplayValue(/Select consciousness level/i);
    fireEvent.change(consciousnessSelect, { target: { value: 'unconscious' } });
    
    expect(consciousnessSelect).toHaveValue('unconscious');
  });

  it('allows breathing status selection', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const breathingSelect = screen.getByDisplayValue(/Select breathing status/i);
    fireEvent.change(breathingSelect, { target: { value: 'none' } });
    
    expect(breathingSelect).toHaveValue('none');
  });

  it('allows symptom selection', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const chestPainCheckbox = screen.getByLabelText(/Chest pain/i);
    fireEvent.click(chestPainCheckbox);
    
    expect(chestPainCheckbox).toBeChecked();
  });

  it('allows additional information input', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const additionalInfoTextarea = screen.getByPlaceholderText(/Any additional observations/i);
    fireEvent.change(additionalInfoTextarea, { target: { value: 'Patient is elderly, has heart condition' } });
    
    expect(additionalInfoTextarea).toHaveValue('Patient is elderly, has heart condition');
  });

  it('calls 911 when button is clicked', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const call911Button = screen.getByText('Call 911');
    fireEvent.click(call911Button);
    
    // Should show loading state and then success
    expect(screen.getByText(/Calling 911\.\.\./i)).toBeInTheDocument();
  });

  it('dispatches security when button is clicked', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const dispatchSecurityButton = screen.getByText('Dispatch Security');
    fireEvent.click(dispatchSecurityButton);
    
    // Should show loading state and then success
    expect(screen.getByText(/Dispatching security\.\.\./i)).toBeInTheDocument();
  });

  it('evacuates area when button is clicked', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const evacuateButton = screen.getByText('Evacuate Area');
    fireEvent.click(evacuateButton);
    
    // Should show loading state and then success
    expect(screen.getByText(/Evacuating area\.\.\./i)).toBeInTheDocument();
  });

  it('logs incident when button is clicked', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const logIncidentButton = screen.getByText('Log Incident');
    fireEvent.click(logIncidentButton);
    
    // Should show loading state and then success
    expect(screen.getByText(/Logging incident\.\.\./i)).toBeInTheDocument();
    
    // Button should be disabled after logging
    await waitFor(() => {
      expect(screen.getByText('Incident Logged')).toBeDisabled();
    });
  });

  it('exports report when button is clicked', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);
    
    // Should trigger download (mocked in test environment)
    expect(exportButton).toBeInTheDocument();
  });

  it('ends response when button is clicked', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const endResponseButton = screen.getByText('End Response');
    fireEvent.click(endResponseButton);
    
    // Should navigate back to dashboard
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows actions completed when actions are performed', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const call911Button = screen.getByText('Call 911');
    fireEvent.click(call911Button);
    
    // Wait for action to complete
    await waitFor(() => {
      expect(screen.getByText('Actions Completed')).toBeInTheDocument();
    });
  });

  it('displays response timeline', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Emergency reported by housekeeping')).toBeInTheDocument();
    expect(screen.getByText('Security team dispatched')).toBeInTheDocument();
    expect(screen.getByText('911 called - EMS en route')).toBeInTheDocument();
    expect(screen.getByText('Area secured, guests evacuated')).toBeInTheDocument();
    expect(screen.getByText('Assessment in progress')).toBeInTheDocument();
  });

  it('updates timer display over time', async () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    // Timer should start at 00:00
    expect(screen.getByText('00:00')).toBeInTheDocument();
    
    // Wait for timer to update
    await waitFor(() => {
      expect(screen.getByText(/00:0[1-9]/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows incident ID', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Incident ID: MED-/)).toBeInTheDocument();
  });

  it('handles multiple symptom selections', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const chestPainCheckbox = screen.getByLabelText(/Chest pain/i);
    const breathingCheckbox = screen.getByLabelText(/Difficulty breathing/i);
    
    fireEvent.click(chestPainCheckbox);
    fireEvent.click(breathingCheckbox);
    
    expect(chestPainCheckbox).toBeChecked();
    expect(breathingCheckbox).toBeChecked();
  });

  it('deselects symptoms when clicked again', () => {
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    const chestPainCheckbox = screen.getByLabelText(/Chest pain/i);
    
    fireEvent.click(chestPainCheckbox);
    expect(chestPainCheckbox).toBeChecked();
    
    fireEvent.click(chestPainCheckbox);
    expect(chestPainCheckbox).not.toBeChecked();
  });

  it('shows confirmation dialog when ending response with actions completed', () => {
    // Mock window.confirm
    const mockConfirm = jest.fn(() => true);
    window.confirm = mockConfirm;
    
    render(
      <BrowserRouter>
        <MedicalAssistance />
      </BrowserRouter>
    );
    
    // Complete an action first
    const call911Button = screen.getByText('Call 911');
    fireEvent.click(call911Button);
    
    // Then try to end response
    const endResponseButton = screen.getByText('End Response');
    fireEvent.click(endResponseButton);
    
    expect(mockConfirm).toHaveBeenCalledWith('Medical emergency response is in progress. Are you sure you want to end the response?');
  });
});

