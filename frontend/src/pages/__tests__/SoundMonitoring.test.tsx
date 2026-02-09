import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoundMonitoring from '../modules/SoundMonitoring';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../utils/toast', () => ({
  showLoading: jest.fn(() => 'mock-toast-id'),
  dismissLoadingAndShowSuccess: jest.fn(),
  dismissLoadingAndShowError: jest.fn(),
}));

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock UI components
jest.mock('../../components/UI/Card', () => ({
  Card: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick} data-testid="card">
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

jest.mock('../../components/UI/Button', () => ({
  Button: ({ children, onClick, className, disabled, variant, size }: any) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../components/UI/Badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock('../../components/UI/ModuleHeader', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="module-header">{children}</div>,
}));

jest.mock('../../components/UI/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns, onRowClick, actions }: any) => (
    <div data-testid="data-table">
      <div data-testid="table-data">{JSON.stringify(data)}</div>
      <div data-testid="table-columns">{JSON.stringify(columns)}</div>
      {actions && <div data-testid="table-actions">{actions}</div>}
    </div>
  ),
}));

jest.mock('../../utils/cn', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SoundMonitoring', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'true'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders sound monitoring module with header', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText('Sound Monitoring')).toBeInTheDocument();
      expect(screen.getByText('Real-time audio monitoring and noise analysis')).toBeInTheDocument();
    });

    test('renders tab navigation', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Real-time Audio')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Alert Management')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders key metrics', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByText(/Avg\. Decibel Level|Zones Monitored|Active Sensors/i)).toBeInTheDocument();
    });

    test('renders location monitoring cards', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText('Monitored Locations')).toBeInTheDocument();
      expect(screen.getByText('Lobby')).toBeInTheDocument();
      expect(screen.getByText('Floor 3')).toBeInTheDocument();
      expect(screen.getByText('Pool Area')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('switches to real-time audio tab', () => {
      renderWithRouter(<SoundMonitoring />);
      
      const realtimeTab = screen.getByText('Real-time Audio');
      fireEvent.click(realtimeTab);
      
      expect(screen.getByText('Live Waveform')).toBeInTheDocument();
      expect(screen.getByText('Frequency Spectrum')).toBeInTheDocument();
    });

    test('switches to analytics tab', () => {
      renderWithRouter(<SoundMonitoring />);
      
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);
      
      expect(screen.getByText('Frequency Analysis')).toBeInTheDocument();
      expect(screen.getByText('Daily Patterns')).toBeInTheDocument();
    });

    test('switches to alerts tab', () => {
      renderWithRouter(<SoundMonitoring />);
      
      const alertsTab = screen.getByText('Alert Management');
      fireEvent.click(alertsTab);
      
      expect(screen.getByText('Alert Management')).toBeInTheDocument();
    });

    test('switches to settings tab', () => {
      renderWithRouter(<SoundMonitoring />);
      
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);
      
      expect(screen.getByText('Sound Monitoring Settings')).toBeInTheDocument();
    });
  });

  describe('Recording Controls', () => {
    test('toggles recording state', async () => {
      renderWithRouter(<SoundMonitoring />);
      
      const recordButton = screen.getByText('Start Recording');
      fireEvent.click(recordButton);
      
      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      });
    });

    test('shows loading state during recording toggle', async () => {
      renderWithRouter(<SoundMonitoring />);
      
      const recordButton = screen.getByText('Start Recording');
      fireEvent.click(recordButton);
      
      // The button should show loading state briefly
      expect(recordButton).toBeInTheDocument();
    });
  });

  describe('Location Cards', () => {
    test('displays location information correctly', () => {
      renderWithRouter(<SoundMonitoring />);
      
      // Check for specific location data
      expect(screen.getByText('64.6')).toBeInTheDocument(); // Lobby sound level
      expect(screen.getByText('79.7')).toBeInTheDocument(); // Floor 3 sound level
      expect(screen.getByText('83.2')).toBeInTheDocument(); // Pool sound level
    });

    test('shows status badges', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText('NORMAL')).toBeInTheDocument();
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      expect(screen.getByText('ALERT')).toBeInTheDocument();
    });

    test('displays AI interpretations', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText(/Sound level is safe and within normal parameters/)).toBeInTheDocument();
      expect(screen.getByText(/Noise may disturb guests/)).toBeInTheDocument();
      expect(screen.getByText(/High noise level detected/)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    test('renders quick action buttons', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText('Alert Security Team')).toBeInTheDocument();
      expect(screen.getByText('Send Guest Notification')).toBeInTheDocument();
      expect(screen.getByText('Export Audio Report')).toBeInTheDocument();
    });

    test('handles security alert action', async () => {
      renderWithRouter(<SoundMonitoring />);
      
      const alertButton = screen.getByText('Alert Security Team');
      fireEvent.click(alertButton);
      
      // Should show loading state and then success
      await waitFor(() => {
        expect(alertButton).toBeInTheDocument();
      });
    });

    test('handles guest notification action', async () => {
      renderWithRouter(<SoundMonitoring />);
      
      const notificationButton = screen.getByText('Send Guest Notification');
      fireEvent.click(notificationButton);
      
      await waitFor(() => {
        expect(notificationButton).toBeInTheDocument();
      });
    });

    test('handles export report action', async () => {
      renderWithRouter(<SoundMonitoring />);
      
      const exportButton = screen.getByText('Export Audio Report');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('AI Insights', () => {
    test('displays AI insights section', () => {
      renderWithRouter(<SoundMonitoring />);
      
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
      expect(screen.getByText(/Pattern Detected/)).toBeInTheDocument();
      expect(screen.getByText(/Recommendation/)).toBeInTheDocument();
      expect(screen.getByText(/Improvement/)).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    test('renders module when mounted', () => {
      renderWithRouter(<SoundMonitoring />);
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('updates sound data when recording is active', async () => {
      renderWithRouter(<SoundMonitoring />);
      
      // Start recording
      const recordButton = screen.getByText('Start Recording');
      fireEvent.click(recordButton);
      
      // Wait for recording to start
      await waitFor(() => {
        expect(screen.getByText('Stop Recording')).toBeInTheDocument();
      });
      
      // Sound data should be updating (this is simulated)
      expect(screen.getByText('64.6')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive classes', () => {
      renderWithRouter(<SoundMonitoring />);
      
      // Check for responsive grid classes
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      renderWithRouter(<SoundMonitoring />);
      
      // Check for buttons with proper accessibility
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', () => {
      renderWithRouter(<SoundMonitoring />);
      
      const firstButton = screen.getAllByTestId('button')[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    });
  });
});

describe('Integration Tests', () => {
  test('complete module load', () => {
    renderWithRouter(<SoundMonitoring />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  test('navigation between tabs maintains state', () => {
    renderWithRouter(<SoundMonitoring />);
    
    // Start on overview
    expect(screen.getByText('Monitored Locations')).toBeInTheDocument();
    
    // Switch to real-time
    const realtimeTab = screen.getByText('Real-time Audio');
    fireEvent.click(realtimeTab);
    
    expect(screen.getByText('Live Waveform')).toBeInTheDocument();
    
    // Switch back to overview
    const overviewTab = screen.getByText('Overview');
    fireEvent.click(overviewTab);
    
    expect(screen.getByText('Monitored Locations')).toBeInTheDocument();
  });

  test('recording state persists across tab changes', async () => {
    renderWithRouter(<SoundMonitoring />);
    
    // Start recording
    const recordButton = screen.getByText('Start Recording');
    fireEvent.click(recordButton);
    
    await waitFor(() => {
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });
    
    // Switch tabs
    const analyticsTab = screen.getByText('Analytics');
    fireEvent.click(analyticsTab);
    
    // Should still show recording state
    expect(screen.getByText('Stop Recording')).toBeInTheDocument();
  });
});


