import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import ViewCamerasAuth from '../modules/ViewCamerasAuth';
import CameraMonitoring from '../CameraMonitoring';

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

// Mock the useNavigate hook
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('ViewCamerasAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUsedNavigate.mockClear();
  });

  it('renders the authentication form', () => {
    render(
      <BrowserRouter>
        <ViewCamerasAuth />
      </BrowserRouter>
    );
    expect(screen.getByText(/Secure Access/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Administrator Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Access Camera Controls/i })).toBeInTheDocument();
  });

  it('shows an error for invalid password', async () => {
    render(
      <BrowserRouter>
        <ViewCamerasAuth />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Camera Controls/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid password\. Access denied\./i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Administrator Password/i)).toHaveValue('');
  });

  it('navigates to camera monitoring on successful authentication', async () => {
    render(
      <MemoryRouter initialEntries={['/modules/ViewCamerasAuth']}>
        <Routes>
          <Route path="/modules/ViewCamerasAuth" element={<ViewCamerasAuth />} />
          <Route path="/view-cameras" element={<div>Camera Monitoring Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Camera Controls/i }));

    await waitFor(() => {
      expect(localStorage.getItem('admin_viewcameras_authenticated')).toBe('true');
      expect(screen.getByText(/Camera Monitoring Page/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during authentication', async () => {
    render(
      <BrowserRouter>
        <ViewCamerasAuth />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/Administrator Password/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Access Camera Controls/i }));

    expect(screen.getByText(/Verifying\.\.\./i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Verifying\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(
      <BrowserRouter>
        <ViewCamerasAuth />
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

describe('CameraMonitoring', () => {
  beforeEach(() => {
    localStorage.setItem('admin_viewcameras_authenticated', 'true'); // Ensure authenticated state
    mockedUsedNavigate.mockClear();
  });

  afterEach(() => {
    localStorage.removeItem('admin_viewcameras_authenticated');
  });

  it('redirects to auth if not authenticated', () => {
    localStorage.removeItem('admin_viewcameras_authenticated');
    render(
      <MemoryRouter initialEntries={['/view-cameras']}>
        <Routes>
          <Route path="/view-cameras" element={<CameraMonitoring />} />
          <Route path="/modules/ViewCamerasAuth" element={<div>View Cameras Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/View Cameras Auth Page/i)).toBeInTheDocument();
  });

  it('renders the main interface when authenticated', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    expect(screen.getByText(/Camera Monitoring/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Cameras/i)).toBeInTheDocument();
    expect(screen.getByText(/Alerts Today/i)).toBeInTheDocument();
    expect(screen.getByText(/Recordings/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Uptime/i)).toBeInTheDocument();
  });

  it('displays KPI cards with correct values', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    expect(screen.getByText('12')).toBeInTheDocument(); // Active Cameras
    expect(screen.getByText('3')).toBeInTheDocument(); // Alerts Today
    expect(screen.getByText('87')).toBeInTheDocument(); // Recordings
    expect(screen.getByText('99.8%')).toBeInTheDocument(); // Avg Uptime
  });

  it('filters cameras by status', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const filterDropdown = screen.getByDisplayValue('All Cameras');
    fireEvent.change(filterDropdown, { target: { value: 'Online Only' } });
    
    // Should show only online cameras
    expect(screen.getByText('Lobby Main Entrance')).toBeInTheDocument();
    expect(screen.getByText('Pool Area Camera')).toBeInTheDocument();
    expect(screen.getByText('Staff Entrance')).toBeInTheDocument();
    expect(screen.getByText('Elevator Bank A')).toBeInTheDocument();
  });

  it('searches cameras by name or location', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/Search cameras by name or location/i);
    fireEvent.change(searchInput, { target: { value: 'lobby' } });
    
    // Should show only lobby camera
    expect(screen.getByText('Lobby Main Entrance')).toBeInTheDocument();
    expect(screen.queryByText('Pool Area Camera')).not.toBeInTheDocument();
  });

  it('toggles between grid and list view', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const listButton = screen.getByText('List');
    fireEvent.click(listButton);
    
    expect(listButton).toHaveClass('active');
  });

  it('opens camera expansion modal when camera card is clicked', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const cameraCard = screen.getByText('Lobby Main Entrance');
    fireEvent.click(cameraCard);
    
    // Should show expanded camera modal
    expect(screen.getByText('Lobby Main Entrance')).toBeInTheDocument();
    expect(screen.getByText('View Live')).toBeInTheDocument();
  });

  it('toggles recording for a camera in expanded view', async () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const cameraCard = screen.getByText('Lobby Main Entrance');
    fireEvent.click(cameraCard);
    
    const stopRecordingButton = screen.getByText('Stop Recording');
    fireEvent.click(stopRecordingButton);
    
    await waitFor(() => {
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });
  });

  it('toggles motion detection for a camera in expanded view', async () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const cameraCard = screen.getByText('Lobby Main Entrance');
    fireEvent.click(cameraCard);
    
    const disableMotionButton = screen.getByText('Disable Motion Detection');
    fireEvent.click(disableMotionButton);
    
    await waitFor(() => {
      expect(screen.getByText('Enable Motion Detection')).toBeInTheDocument();
    });
  });

  it('simulates motion for a camera', async () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const cameraCard = screen.getByText('Lobby Main Entrance');
    fireEvent.click(cameraCard);
    
    const simulateMotionButton = screen.getByText('Simulate Motion');
    fireEvent.click(simulateMotionButton);
    
    // Should start recording when motion is simulated
    await waitFor(() => {
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });
  });

  it('opens add camera modal when add button is clicked', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const addButton = screen.getByText('Add Camera');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add New Camera')).toBeInTheDocument();
  });

  it('adds a new camera when form is submitted', async () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const addButton = screen.getByText('Add Camera');
    fireEvent.click(addButton);
    
    const addCameraButton = screen.getByText('Add Camera');
    fireEvent.click(addCameraButton);
    
    await waitFor(() => {
      expect(screen.getByText('New Camera')).toBeInTheDocument();
    });
  });

  it('shows dropdown menu when menu button is clicked', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const menuButton = screen.getByText('Live View');
    fireEvent.click(menuButton);
    
    // Should show dropdown with menu options
    expect(screen.getByText('Recordings')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('navigates to different tabs when clicked', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const menuButton = screen.getByText('Live View');
    fireEvent.click(menuButton);
    
    const recordingsButton = screen.getByText('Recordings');
    fireEvent.click(recordingsButton);
    
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/modules/camera-recordings');
  });

  it('shows tab content for non-live tabs', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const menuButton = screen.getByText('Live View');
    fireEvent.click(menuButton);
    
    const analyticsButton = screen.getByText('Analytics');
    fireEvent.click(analyticsButton);
    
    // Should show analytics content
    expect(screen.getByText('AI-driven analytics and motion detection insights.')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const cameraCard = screen.getByText('Lobby Main Entrance');
    fireEvent.click(cameraCard);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    // Modal should be closed
    expect(screen.queryByText('View Live')).not.toBeInTheDocument();
  });

  it('disables actions for offline cameras', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const offlineCameraCard = screen.getByText('Restaurant Kitchen');
    fireEvent.click(offlineCameraCard);
    
    const viewLiveButton = screen.getByText('View Live');
    expect(viewLiveButton).toBeDisabled();
  });

  it('shows empty state when no cameras match filter', () => {
    render(
      <BrowserRouter>
        <CameraMonitoring />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/Search cameras by name or location/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No cameras found')).toBeInTheDocument();
  });
});


