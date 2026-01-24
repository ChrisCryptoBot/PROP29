import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BannedIndividuals from '../modules/BannedIndividuals';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock toast functions
const mockShowLoading = jest.fn();
const mockDismissLoadingAndShowSuccess = jest.fn();
const mockDismissLoadingAndShowError = jest.fn();

jest.mock('../../utils/toast', () => ({
  showLoading: mockShowLoading,
  dismissLoadingAndShowSuccess: mockDismissLoadingAndShowSuccess,
  dismissLoadingAndShowError: mockDismissLoadingAndShowError,
}));

// Mock UI components
jest.mock('../../components/UI/Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div className="card-header" {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h3 className="card-title" {...props}>
      {children}
    </h3>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div className="card-content" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('../../components/UI/Button', () => ({
  Button: ({ children, onClick, className, variant, ...props }: any) => (
    <button
      className={`btn ${variant || 'default'} ${className || ''}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../components/UI/Badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span className={`badge ${variant || 'default'} ${className || ''}`} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('../../components/UI/DataTable', () => ({
  __esModule: true,
  default: ({ data, columns, onRowClick, actions }: any) => (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, index: number) => (
            <tr key={index} onClick={() => onRowClick && onRowClick(row)}>
              {columns.map((col: any) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

describe('BannedIndividuals Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with header and navigation', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('Banned Individuals')).toBeInTheDocument();
    expect(screen.getByText('Manage security bans and facial recognition monitoring')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('displays overview tab by default', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('Active Bans')).toBeInTheDocument();
    expect(screen.getByText('Recent Detections')).toBeInTheDocument();
    expect(screen.getByText('Facial Recognition')).toBeInTheDocument();
    expect(screen.getByText('Chain-wide Bans')).toBeInTheDocument();
  });

  it('shows correct metrics in overview tab', () => {
    renderWithRouter(<BannedIndividuals />);
    
    // Check that metrics are displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // Active bans
    expect(screen.getByText('2')).toBeInTheDocument(); // Recent detections
    expect(screen.getByText('96.8%')).toBeInTheDocument(); // Facial recognition accuracy
  });

  it('displays recent banned individuals', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Aggressive behavior and threats to staff')).toBeInTheDocument();
    expect(screen.getByText('Fraudulent credit card usage')).toBeInTheDocument();
  });

  it('switches to management tab when clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const managementTab = screen.getByText('Individual Management');
    fireEvent.click(managementTab);
    
    expect(screen.getByText('Individual Management')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
  });

  it('switches to facial recognition tab when clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const facialRecognitionTab = screen.getByText('Facial Recognition');
    fireEvent.click(facialRecognitionTab);
    
    expect(screen.getByText('Facial Recognition Management')).toBeInTheDocument();
    expect(screen.getByText('Training Status')).toBeInTheDocument();
    expect(screen.getByText('Detection Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Real-time Monitoring')).toBeInTheDocument();
  });

  it('switches to detections tab when clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const detectionsTab = screen.getByText('Detection Alerts');
    fireEvent.click(detectionsTab);
    
    expect(screen.getByText('Detection Alerts')).toBeInTheDocument();
    expect(screen.getByText("Today's Detections")).toBeInTheDocument();
    expect(screen.getByText('Response Time')).toBeInTheDocument();
    expect(screen.getByText('Alert Accuracy')).toBeInTheDocument();
  });

  it('switches to analytics tab when clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const analyticsTab = screen.getByText('Analytics & Reports');
    fireEvent.click(analyticsTab);
    
    expect(screen.getByText('Analytics & Reports')).toBeInTheDocument();
    expect(screen.getByText('Detection Frequency')).toBeInTheDocument();
    expect(screen.getByText('False Positives')).toBeInTheDocument();
    expect(screen.getByText('Security Effectiveness')).toBeInTheDocument();
  });

  it('switches to settings tab when clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    
    expect(screen.getByText('Banned Individuals Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage banned individuals system settings.')).toBeInTheDocument();
  });

  it('opens create modal when Add Individual button is clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add Banned Individual')).toBeInTheDocument();
    expect(screen.getByText('First Name *')).toBeInTheDocument();
    expect(screen.getByText('Last Name *')).toBeInTheDocument();
    expect(screen.getByText('Reason for Ban *')).toBeInTheDocument();
  });

  it('closes create modal when Cancel button is clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add Banned Individual')).toBeInTheDocument();
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Add Banned Individual')).not.toBeInTheDocument();
  });

  it('submits create form with valid data', async () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Reason for Ban *'), { target: { value: 'Test reason' } });
    fireEvent.change(screen.getByLabelText('Ban Start Date *'), { target: { value: '2025-01-01' } });
    
    const submitButton = screen.getByText('Add Banned Individual');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowLoading).toHaveBeenCalledWith('Creating banned individual...');
      expect(mockDismissLoadingAndShowSuccess).toHaveBeenCalledWith(
        expect.any(String),
        'Banned individual created successfully'
      );
    });
  });

  it('shows validation error for empty required fields', async () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    const submitButton = screen.getByText('Add Banned Individual');
    fireEvent.click(submitButton);
    
    // Form should not submit without required fields
    expect(mockShowLoading).not.toHaveBeenCalled();
  });

  it('opens details modal when individual is clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const individualCard = screen.getByText('John Smith');
    fireEvent.click(individualCard);
    
    expect(screen.getByText('Individual Details')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Aggressive behavior and threats to staff')).toBeInTheDocument();
  });

  it('closes details modal when Close button is clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const individualCard = screen.getByText('John Smith');
    fireEvent.click(individualCard);
    
    expect(screen.getByText('Individual Details')).toBeInTheDocument();
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Individual Details')).not.toBeInTheDocument();
  });

  it('displays individual details correctly in modal', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const individualCard = screen.getByText('John Smith');
    fireEvent.click(individualCard);
    
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('1985-03-15')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('US123456789')).toBeInTheDocument();
    expect(screen.getByText('Aggressive behavior and threats to staff')).toBeInTheDocument();
    expect(screen.getByText('TEMPORARY')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('displays detection history in details modal', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const individualCard = screen.getByText('John Smith');
    fireEvent.click(individualCard);
    
    expect(screen.getByText('Detection History')).toBeInTheDocument();
    expect(screen.getByText('Main Lobby')).toBeInTheDocument();
    expect(screen.getByText('Security notified, subject escorted out')).toBeInTheDocument();
    expect(screen.getByText('94.2% confidence')).toBeInTheDocument();
  });

  it('navigates back to dashboard when back button is clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to management tab when Manage button is clicked', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const manageButton = screen.getByText('Manage');
    fireEvent.click(manageButton);
    
    expect(screen.getByText('Individual Management')).toBeInTheDocument();
  });

  it('displays risk level badges with correct colors', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('displays ban type badges with correct colors', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('TEMPORARY')).toBeInTheDocument();
    expect(screen.getByText('PERMANENT')).toBeInTheDocument();
  });

  it('displays status badges with correct colors', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('handles form input changes correctly', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    const firstNameInput = screen.getByLabelText('First Name *');
    fireEvent.change(firstNameInput, { target: { value: 'New' } });
    
    expect(firstNameInput).toHaveValue('New');
  });

  it('handles multi-property ban checkbox', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    const checkbox = screen.getByLabelText('Multi-Property Ban');
    fireEvent.click(checkbox);
    
    expect(checkbox).toBeChecked();
  });

  it('displays correct ban type options', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    const banTypeSelect = screen.getByLabelText('Ban Type *');
    expect(banTypeSelect).toBeInTheDocument();
    
    // Check options are present
    expect(screen.getByText('Temporary')).toBeInTheDocument();
    expect(screen.getByText('Permanent')).toBeInTheDocument();
    expect(screen.getByText('Conditional')).toBeInTheDocument();
  });

  it('displays correct risk level options', () => {
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    const riskLevelSelect = screen.getByLabelText('Risk Level *');
    expect(riskLevelSelect).toBeInTheDocument();
    
    // Check options are present
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('handles error in form submission', async () => {
    mockDismissLoadingAndShowError.mockRejectedValueOnce(new Error('API Error'));
    
    renderWithRouter(<BannedIndividuals />);
    
    const addButton = screen.getByText('Add Individual');
    fireEvent.click(addButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('First Name *'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last Name *'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('Reason for Ban *'), { target: { value: 'Test reason' } });
    fireEvent.change(screen.getByLabelText('Ban Start Date *'), { target: { value: '2025-01-01' } });
    
    const submitButton = screen.getByText('Add Banned Individual');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowLoading).toHaveBeenCalledWith('Creating banned individual...');
    });
  });

  it('displays facial recognition intelligence section', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('Facial Recognition Intelligence')).toBeInTheDocument();
  });

  it('displays all banned individuals table', () => {
    renderWithRouter(<BannedIndividuals />);
    
    expect(screen.getByText('All Banned Individuals')).toBeInTheDocument();
  });
});


