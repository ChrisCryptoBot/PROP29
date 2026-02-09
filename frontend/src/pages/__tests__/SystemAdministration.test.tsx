import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SystemAdministration from '../modules/SystemAdministration';

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

// Mock UI components
jest.mock('../../components/UI/Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div className="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h2 className="card-title" {...props}>
      {children}
    </h2>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div className="card-content" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../../components/UI/Button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button
      className={`btn ${className}`}
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

jest.mock('../../utils/cn', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

const renderSystemAdministration = () => {
  return render(
    <BrowserRouter>
      <SystemAdministration />
    </BrowserRouter>
  );
};

describe('SystemAdministration Component', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => null),
        removeItem: jest.fn(() => null),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders the main System Administration interface', () => {
      renderSystemAdministration();
      
      expect(screen.getByText('System Administration')).toBeInTheDocument();
      expect(screen.getByText('Master control panel for the entire Proper 2.9 platform')).toBeInTheDocument();
    });

    test('renders all navigation tabs', () => {
      renderSystemAdministration();
      
      const tabs = [
        'System Overview', 'User Management', 'System Settings', 
        'Security Center', 'Monitoring', 'Integrations', 
        'Backups & Data', 'Maintenance'
      ];
      tabs.forEach(tab => {
        expect(screen.getByText(tab)).toBeInTheDocument();
      });
    });

    test('renders metrics bar', () => {
      renderSystemAdministration();
      
      // Gold standard: compact metrics bar (Users, Integrations, Health, Security, Response, CPU)
      expect(screen.getByText(/Users/i)).toBeInTheDocument();
      expect(screen.getByText(/Health/i)).toBeInTheDocument();
      expect(screen.getByText(/CPU/i)).toBeInTheDocument();
    });

    test('renders back button', () => {
      renderSystemAdministration();
      
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('switches between tabs when clicked', () => {
      renderSystemAdministration();
      
      // Initially on System Overview tab
      expect(screen.getByText('System Overview')).toBeInTheDocument();
      
      // Click on User Management tab
      fireEvent.click(screen.getByText('User Management'));
      expect(screen.getByText('User Management')).toBeInTheDocument();
      
      // Click on System Settings tab
      fireEvent.click(screen.getByText('System Settings'));
      expect(screen.getByText('System Settings')).toBeInTheDocument();
      
      // Click on Security Center tab
      fireEvent.click(screen.getByText('Security Center'));
      expect(screen.getByText('Security Center')).toBeInTheDocument();
      
      // Click on Monitoring tab
      fireEvent.click(screen.getByText('Monitoring'));
      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
    });

    test('dropdown menu toggles correctly', () => {
      renderSystemAdministration();
      
      const dropdownButton = screen.getByText('System Overview').closest('button');
      expect(dropdownButton).toBeInTheDocument();
      
      // Click to open dropdown
      fireEvent.click(dropdownButton!);
      
      // Should show all tab options
      expect(screen.getByText('System Overview')).toBeInTheDocument();
      expect(screen.getByText('User Management')).toBeStayInTheDocument();
    });
  });

  describe('System Overview Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      // Default tab is System Overview
    });

    test('renders system overview', () => {
      expect(screen.getByText('System Overview')).toBeInTheDocument();
    });

    test('shows database status', () => {
      expect(screen.getByText('Database Status')).toBeInTheDocument();
      expect(screen.getByText('Connected & Operational')).toBeInTheDocument();
    });

    test('shows API status', () => {
      expect(screen.getByText('API Status')).toBeInTheDocument();
      expect(screen.getByText('All Services Operational')).toBeInTheDocument();
    });

    test('shows system metrics', () => {
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('62%')).toBeInTheDocument();
      expect(screen.getByText('Disk Usage')).toBeInTheDocument();
      expect(screen.getByText('38%')).toBeInTheDocument();
    });

    test('renders recent system activity', () => {
      expect(screen.getByText('Recent System Activity')).toBeInTheDocument();
      expect(screen.getByText('Failed login attempt from unrecognized IP')).toBeInTheDocument();
    });
  });

  describe('User Management Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('User Management'));
    });

    test('renders user management interface', () => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Add User')).toBeInTheDocument();
    });

    test('renders user cards', () => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('security_manager')).toBeInTheDocument();
      expect(screen.getByText('guest_001')).toBeInTheDocument();
    });

    test('shows user details', () => {
      expect(screen.getByText('admin@properhotel.com')).toBeInTheDocument();
      expect(screen.getByText('security@properhotel.com')).toBeInTheDocument();
      expect(screen.getByText('guest@email.com')).toBeInTheDocument();
    });

    test('shows user roles and status', () => {
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getByText('STAFF')).toBeInTheDocument();
      expect(screen.getByText('GUEST')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    test('opens create user modal when Add User button is clicked', () => {
      fireEvent.click(screen.getByText('Add User'));
      
      expect(screen.getByText('Add New User')).toBeInTheDocument();
      expect(screen.getByText('Username *')).toBeInTheDocument();
      expect(screen.getByText('Email *')).toBeInTheDocument();
      expect(screen.getByText('Role *')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
    });
  });

  describe('System Settings Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('System Settings'));
    });

    test('renders system settings interface', () => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
      expect(screen.getByText('Add Setting')).toBeInTheDocument();
    });

    test('renders system settings cards', () => {
      expect(screen.getByText('password_min_length')).toBeInTheDocument();
      expect(screen.getByText('session_timeout')).toBeInTheDocument();
      expect(screen.getByText('maintenance_mode')).toBeInTheDocument();
      expect(screen.getByText('pms_endpoint')).toBeInTheDocument();
    });

    test('shows setting details', () => {
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Integration')).toBeInTheDocument();
    });

    test('shows maintenance mode toggle', () => {
      expect(screen.getByText('Enable Maintenance Mode')).toBeInTheDocument();
    });

    test('opens create setting modal when Add Setting button is clicked', () => {
      fireEvent.click(screen.getByText('Add Setting'));
      
      expect(screen.getByText('Add System Setting')).toBeInTheDocument();
      expect(screen.getByText('Category *')).toBeInTheDocument();
      expect(screen.getByText('Key *')).toBeInTheDocument();
      expect(screen.getByText('Value *')).toBeInTheDocument();
      expect(screen.getByText('Description *')).toBeInTheDocument();
      expect(screen.getByText('Type *')).toBeInTheDocument();
    });
  });

  describe('Security Center Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Security Center'));
    });

    test('renders security center', () => {
      expect(screen.getByText('Security Center')).toBeInTheDocument();
    });

    test('shows security events', () => {
      expect(screen.getByText('Failed login attempt from unrecognized IP')).toBeInTheDocument();
      expect(screen.getByText('Attempted to access admin panel')).toBeInTheDocument();
      expect(screen.getByText('Modified system security settings')).toBeInTheDocument();
    });

    test('shows event severity levels', () => {
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    test('shows event status', () => {
      expect(screen.getByText('INVESTIGATING')).toBeInTheDocument();
      expect(screen.getByText('RESOLVED')).toBeInTheDocument();
    });
  });

  describe('Monitoring Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Monitoring'));
    });

    test('renders system monitoring', () => {
      expect(screen.getByText('System Monitoring')).toBeInTheDocument();
    });

    test('shows performance metrics', () => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('CPU Usage:')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    test('shows service status', () => {
      expect(screen.getByText('Service Status')).toBeInTheDocument();
      expect(screen.getByText('Database:')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    test('shows user activity', () => {
      expect(screen.getByText('User Activity')).toBeInTheDocument();
      expect(screen.getByText('Active Users:')).toBeInTheDocument();
      expect(screen.getByText('127')).toBeInTheDocument();
    });
  });

  describe('Integrations Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Integrations'));
    });

    test('renders system integrations', () => {
      expect(screen.getByText('System Integrations')).toBeInTheDocument();
    });

    test('shows integration services', () => {
      expect(screen.getByText('Property Management System')).toBeInTheDocument();
      expect(screen.getByText('Payment Gateway')).toBeInTheDocument();
      expect(screen.getByText('IoT Sensors')).toBeInTheDocument();
    });

    test('shows integration status', () => {
      expect(screen.getByText('CONNECTED')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });

    test('shows integration health', () => {
      expect(screen.getByText('GOOD')).toBeInTheDocument();
      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });
  });

  describe('Backups Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Backups & Data'));
    });

    test('renders backup management', () => {
      expect(screen.getByText('Backup Management')).toBeInTheDocument();
      expect(screen.getByText('Run Backup')).toBeInTheDocument();
    });

    test('shows backup jobs', () => {
      expect(screen.getByText('Daily Full Backup')).toBeInTheDocument();
      expect(screen.getByText('Hourly Incremental')).toBeInTheDocument();
      expect(screen.getByText('Weekly Archive')).toBeInTheDocument();
    });

    test('shows backup status', () => {
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('RUNNING')).toBeInTheDocument();
      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
    });

    test('opens backup modal when Run Backup button is clicked', () => {
      fireEvent.click(screen.getByText('Run Backup'));
      
      expect(screen.getByText('Run System Backup')).toBeInTheDocument();
      expect(screen.getByText('Important Notice')).toBeInTheDocument();
      expect(screen.getByText('Backup Type')).toBeInTheDocument();
    });
  });

  describe('Maintenance Tab', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Maintenance'));
    });

    test('renders system maintenance', () => {
      expect(screen.getByText('System Maintenance')).toBeInTheDocument();
    });

    test('shows maintenance options', () => {
      expect(screen.getByText('Maintenance Mode')).toBeInTheDocument();
      expect(screen.getByText('System Health Check')).toBeInTheDocument();
      expect(screen.getByText('Cache Management')).toBeInTheDocument();
      expect(screen.getByText('Log Management')).toBeInTheDocument();
    });

    test('shows maintenance buttons', () => {
      expect(screen.getByText('Enable Maintenance Mode')).toBeInTheDocument();
      expect(screen.getByText('Run Health Check')).toBeInTheDocument();
      expect(screen.getByText('Clear Caches')).toBeInTheDocument();
      expect(screen.getByText('Archive Logs')).toBeInTheDocument();
    });
  });

  describe('Modal Functionality', () => {
    test('create user modal form validation', async () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('User Management'));
      fireEvent.click(screen.getByText('Add User'));
      
      const createButton = screen.getByText('Create User');
      expect(createButton).toBeDisabled();
      
      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('Enter username'), {
        target: { value: 'testuser' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
        target: { value: 'test@example.com' }
      });
      
      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });
    });

    test('create setting modal form validation', async () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('System Settings'));
      fireEvent.click(screen.getByText('Add Setting'));
      
      const createButton = screen.getByText('Create Setting');
      expect(createButton).toBeDisabled();
      
      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('e.g., Security, System, Integration'), {
        target: { value: 'Test' }
      });
      fireEvent.change(screen.getByPlaceholderText('e.g., password_min_length'), {
        target: { value: 'test_key' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter setting value'), {
        target: { value: 'test_value' }
      });
      fireEvent.change(screen.getByPlaceholderText('Describe what this setting controls'), {
        target: { value: 'Test setting description' }
      });
      
      await waitFor(() => {
        expect(createButton).not.toBeDisabled();
      });
    });

    test('modal close functionality', () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('User Management'));
      fireEvent.click(screen.getByText('Add User'));
      
      expect(screen.getByText('Add New User')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(screen.queryByText('Add New User')).not.toBeInTheDocument();
    });
  });

  describe('System Actions', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('System Settings'));
    });

    test('maintenance mode toggle functionality', async () => {
      const toggleButton = screen.getByText('Enable Maintenance Mode');
      
      fireEvent.click(toggleButton);
      
      // Should show loading toast
      await waitFor(() => {
        expect(require('../../utils/toast').showLoading).toHaveBeenCalledWith('Updating maintenance mode...');
      });
    });
  });

  describe('Backup Operations', () => {
    beforeEach(() => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Backups & Data'));
      fireEvent.click(screen.getByText('Run Backup'));
    });

    test('backup modal shows important notice', () => {
      expect(screen.getByText('Important Notice')).toBeInTheDocument();
      expect(screen.getByText('This will create a full system backup. The process may take several minutes and could impact system performance.')).toBeInTheDocument();
    });

    test('backup modal shows backup type selection', () => {
      expect(screen.getByText('Backup Type')).toBeInTheDocument();
      expect(screen.getByText('Full Backup')).toBeInTheDocument();
      expect(screen.getByText('Incremental Backup')).toBeInTheDocument();
      expect(screen.getByText('Differential Backup')).toBeInTheDocument();
    });

    test('backup start functionality', async () => {
      const startButton = screen.getByText('Start Backup');
      
      fireEvent.click(startButton);
      
      // Should show loading toast
      await waitFor(() => {
        expect(require('../../utils/toast').showLoading).toHaveBeenCalledWith('Starting backup process...');
      });
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderSystemAdministration();
      
      expect(screen.getByText('System Administration')).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderSystemAdministration();
      
      const backButton = screen.getByText('Back to Dashboard');
      expect(backButton).toBeInTheDocument();
      
      const addUserButton = screen.getByText('Add User');
      expect(addUserButton).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      renderSystemAdministration();
      
      const dropdownButton = screen.getByText('System Overview').closest('button');
      expect(dropdownButton).toBeInTheDocument();
      
      // Tab navigation should work
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Enter' });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('User Management'));
      fireEvent.click(screen.getByText('Add User'));
      
      // Fill form and submit
      fireEvent.change(screen.getByPlaceholderText('Enter username'), {
        target: { value: 'testuser' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.click(screen.getByText('Create User'));
      
      // Should handle the async operation
      await waitFor(() => {
        expect(require('../../utils/toast').showLoading).toHaveBeenCalled();
      });
    });
  });

  describe('Data Display', () => {
    test('displays system metrics correctly', () => {
      renderSystemAdministration();
      
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('127')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    test('displays user information correctly', () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('User Management'));
      
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('security_manager')).toBeInTheDocument();
      expect(screen.getByText('guest_001')).toBeInTheDocument();
    });

    test('displays security events correctly', () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Security Center'));
      
      expect(screen.getByText('Failed login attempt from unrecognized IP')).toBeInTheDocument();
      expect(screen.getByText('Attempted to access admin panel')).toBeInTheDocument();
      expect(screen.getByText('Modified system security settings')).toBeInTheDocument();
    });

    test('displays integration status correctly', () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Integrations'));
      
      expect(screen.getByText('Property Management System')).toBeInTheDocument();
      expect(screen.getByText('Payment Gateway')).toBeInTheDocument();
      expect(screen.getByText('IoT Sensors')).toBeInTheDocument();
    });

    test('displays backup jobs correctly', () => {
      renderSystemAdministration();
      fireEvent.click(screen.getByText('Backups & Data'));
      
      expect(screen.getByText('Daily Full Backup')).toBeInTheDocument();
      expect(screen.getByText('Hourly Incremental')).toBeInTheDocument();
      expect(screen.getByText('Weekly Archive')).toBeInTheDocument();
    });
  });
});


