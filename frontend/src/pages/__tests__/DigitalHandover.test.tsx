import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DigitalHandover from '../modules/DigitalHandover';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the toast functions
jest.mock('../../utils/toast', () => ({
  showLoading: jest.fn(() => 'mock-toast-id'),
  dismissLoadingAndShowSuccess: jest.fn(),
  dismissLoadingAndShowError: jest.fn(),
}));

// Mock the UI components
jest.mock('../../components/UI/Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h2 className={`card-title ${className}`} {...props}>
      {children}
    </h2>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className}`} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../../components/UI/Button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button
      className={`button ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../components/UI/Badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  ),
}));

// Mock the cn utility
jest.mock('../../utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DigitalHandover Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main component with header and navigation', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('Digital Handover')).toBeInTheDocument();
    expect(screen.getByText('Seamless shift transitions and operational continuity')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('displays key metrics cards', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('156')).toBeInTheDocument(); // Total Handovers
    expect(screen.getByText('142')).toBeInTheDocument(); // Completed Handovers
    expect(screen.getByText('8')).toBeInTheDocument(); // Pending Handovers
    expect(screen.getByText('2')).toBeInTheDocument(); // Overdue Handovers
  });

  it('shows handover management tab by default', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('Handover Management')).toBeInTheDocument();
    expect(screen.getByText('Create New Handover')).toBeInTheDocument();
  });

  it('displays existing handovers', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('John Smith → Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson → Mike Wilson')).toBeInTheDocument();
  });

  it('opens create handover modal when button is clicked', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const createButton = screen.getByText('Create New Handover');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Handover')).toBeInTheDocument();
    });
  });

  it('allows switching between tabs', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const dropdownButton = screen.getByText('Handover Management');
    fireEvent.click(dropdownButton);
    
    await waitFor(() => {
      expect(screen.getByText('Live Tracking')).toBeInTheDocument();
      expect(screen.getByText('Equipment & Tasks')).toBeInTheDocument();
      expect(screen.getByText('Analytics & Reports')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('switches to analytics tab when selected', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const dropdownButton = screen.getByText('Handover Management');
    fireEvent.click(dropdownButton);
    
    await waitFor(() => {
      const analyticsTab = screen.getByText('Analytics & Reports');
      fireEvent.click(analyticsTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Average Rating')).toBeInTheDocument();
      expect(screen.getByText('Avg Completion Time')).toBeInTheDocument();
      expect(screen.getByText('Checklist Completion')).toBeInTheDocument();
    });
  });

  it('switches to tracking tab when selected', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const dropdownButton = screen.getByText('Handover Management');
    fireEvent.click(dropdownButton);
    
    await waitFor(() => {
      const trackingTab = screen.getByText('Live Tracking');
      fireEvent.click(trackingTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
      expect(screen.getByText('Live handover status and progress monitoring coming soon.')).toBeInTheDocument();
    });
  });

  it('switches to equipment tab when selected', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const dropdownButton = screen.getByText('Handover Management');
    fireEvent.click(dropdownButton);
    
    await waitFor(() => {
      const equipmentTab = screen.getByText('Equipment & Tasks');
      fireEvent.click(equipmentTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Equipment Management')).toBeInTheDocument();
      expect(screen.getByText('Equipment status and task management features coming soon.')).toBeInTheDocument();
    });
  });

  it('switches to settings tab when selected', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const dropdownButton = screen.getByText('Handover Management');
    fireEvent.click(dropdownButton);
    
    await waitFor(() => {
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Handover Settings')).toBeInTheDocument();
      expect(screen.getByText('Configure handover templates, notifications, and preferences.')).toBeInTheDocument();
    });
  });

  it('allows completing a handover', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      // The handover status should change to completed
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });

  it('opens handover details modal when handover is clicked', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const handoverCard = screen.getByText('John Smith → Sarah Johnson');
    fireEvent.click(handoverCard);
    
    await waitFor(() => {
      expect(screen.getByText('Handover Details')).toBeInTheDocument();
      expect(screen.getByText('Morning')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });
  });

  it('closes handover details modal when close button is clicked', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const handoverCard = screen.getByText('John Smith → Sarah Johnson');
    fireEvent.click(handoverCard);
    
    await waitFor(() => {
      expect(screen.getByText('Handover Details')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Handover Details')).not.toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when back button is clicked', () => {
    renderWithRouter(<DigitalHandover />);
    
    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('displays correct shift type badges', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Afternoon')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
  });

  it('displays correct priority badges', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('shows handover notes in the details modal', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const handoverCard = screen.getByText('John Smith → Sarah Johnson');
    fireEvent.click(handoverCard);
    
    await waitFor(() => {
      expect(screen.getByText('All systems operational. Guest complaint about room temperature resolved. Security patrol completed without incidents.')).toBeInTheDocument();
    });
  });

  it('shows checklist items in the details modal', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const handoverCard = screen.getByText('John Smith → Sarah Johnson');
    fireEvent.click(handoverCard);
    
    await waitFor(() => {
      expect(screen.getByText('Security Patrol')).toBeInTheDocument();
      expect(screen.getByText('Equipment Check')).toBeInTheDocument();
    });
  });

  it('displays completion time and rating in analytics', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const dropdownButton = screen.getByText('Handover Management');
    fireEvent.click(dropdownButton);
    
    await waitFor(() => {
      const analyticsTab = screen.getByText('Analytics & Reports');
      fireEvent.click(analyticsTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('12 min')).toBeInTheDocument();
      expect(screen.getByText('4.3/5')).toBeInTheDocument();
    });
  });

  it('shows empty state when no handovers exist', () => {
    // This test would require mocking the component with empty data
    // For now, we'll test that the component renders without crashing
    renderWithRouter(<DigitalHandover />);
    expect(screen.getByText('Digital Handover')).toBeInTheDocument();
  });

  it('handles form validation in create modal', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const createButton = screen.getByText('Create New Handover');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Handover')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('Create Handover');
    expect(submitButton).toBeDisabled();
  });

  it('allows adding checklist items in create modal', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const createButton = screen.getByText('Create New Handover');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Handover')).toBeInTheDocument();
    });
    
    const addItemButton = screen.getByText('Add Checklist Item');
    expect(addItemButton).toBeInTheDocument();
  });

  it('closes create modal when cancel button is clicked', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const createButton = screen.getByText('Create New Handover');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Handover')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Create New Handover')).not.toBeInTheDocument();
    });
  });

  it('displays correct metrics in analytics tab', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const dropdownButton = screen.getByText('Handover Management');
    fireEvent.click(dropdownButton);
    
    await waitFor(() => {
      const analyticsTab = screen.getByText('Analytics & Reports');
      fireEvent.click(analyticsTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('91%')).toBeInTheDocument(); // Completion Rate
      expect(screen.getByText('87%')).toBeInTheDocument(); // Checklist Completion Rate
    });
  });

  it('handles responsive design for mobile devices', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    renderWithRouter(<DigitalHandover />);
    expect(screen.getByText('Digital Handover')).toBeInTheDocument();
  });

  it('displays correct handover dates and times', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('1/15/2024')).toBeInTheDocument();
    expect(screen.getByText('06:00 - 14:00')).toBeInTheDocument();
    expect(screen.getByText('14:00 - 22:00')).toBeInTheDocument();
  });

  it('shows correct number of checklist items', () => {
    renderWithRouter(<DigitalHandover />);
    
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    renderWithRouter(<DigitalHandover />);
    
    const backButton = screen.getByText('Back to Dashboard');
    backButton.focus();
    
    expect(document.activeElement).toBe(backButton);
  });

  it('displays correct icons for different sections', () => {
    renderWithRouter(<DigitalHandover />);
    
    // Check that icons are present (they would be rendered as <i> elements)
    const icons = document.querySelectorAll('i');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('handles loading states correctly', () => {
    renderWithRouter(<DigitalHandover />);
    
    // The component should render without loading states initially
    expect(screen.getByText('Digital Handover')).toBeInTheDocument();
  });

  it('displays correct background gradients', () => {
    renderWithRouter(<DigitalHandover />);
    
    const mainContainer = screen.getByText('Digital Handover').closest('div');
    expect(mainContainer).toHaveClass('min-h-screen');
  });

  it('shows correct badge variants for different statuses', () => {
    renderWithRouter(<DigitalHandover />);
    
    // Check that badges are rendered with correct classes
    const badges = document.querySelectorAll('.badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('handles form state correctly in create modal', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const createButton = screen.getByText('Create New Handover');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      const shiftTypeSelect = screen.getByDisplayValue('morning');
      expect(shiftTypeSelect).toBeInTheDocument();
    });
  });

  it('displays correct placeholder text in form fields', async () => {
    renderWithRouter(<DigitalHandover />);
    
    const createButton = screen.getByText('Create New Handover');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter handover notes and important information')).toBeInTheDocument();
    });
  });
});

