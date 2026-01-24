/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useEmergencyEvacuationState } from '../hooks/useEmergencyEvacuationState';
import { useAuth } from '../../../hooks/useAuth';

jest.mock('../../../services/evacuationService', () => ({
  startEvacuation: jest.fn(),
  endEvacuation: jest.fn(),
  sendAnnouncement: jest.fn(),
  unlockExits: jest.fn(),
  contactEmergencyServices: jest.fn(),
  notifyGuests: jest.fn(),
  assignAssistance: jest.fn(),
  completeAssistance: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../utils/toast', () => ({
  showLoading: jest.fn(() => 'toast-id'),
  dismissLoadingAndShowSuccess: jest.fn(),
  dismissLoadingAndShowError: jest.fn(),
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockService = jest.requireMock('../../../services/evacuationService') as {
  startEvacuation: jest.Mock;
  endEvacuation: jest.Mock;
  sendAnnouncement: jest.Mock;
  unlockExits: jest.Mock;
  contactEmergencyServices: jest.Mock;
  notifyGuests: jest.Mock;
  assignAssistance: jest.Mock;
  completeAssistance: jest.Mock;
};

const withRoles = (roles: string[]) => {
  mockUseAuth.mockReturnValue({
    user: { roles },
    isAuthenticated: true,
  });
};

describe('useEmergencyEvacuationState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withRoles(['ADMIN']);
    mockService.startEvacuation.mockResolvedValue({ success: true });
    mockService.endEvacuation.mockResolvedValue({ success: true });
    mockService.sendAnnouncement.mockResolvedValue({ success: true });
    mockService.unlockExits.mockResolvedValue({ success: true });
    mockService.contactEmergencyServices.mockResolvedValue({ success: true });
    mockService.notifyGuests.mockResolvedValue({ success: true });
    mockService.assignAssistance.mockResolvedValue({ success: true });
    mockService.completeAssistance.mockResolvedValue({ success: true });
    window.confirm = jest.fn(() => true);
  });

  it('starts evacuation and updates state', async () => {
    const { result } = renderHook(() => useEmergencyEvacuationState());

    await act(async () => {
      await result.current.handleStartEvacuation();
    });

    expect(mockService.startEvacuation).toHaveBeenCalled();
    expect(result.current.evacuationActive).toBe(true);
  });

  it('ends evacuation and resets state', async () => {
    const { result } = renderHook(() => useEmergencyEvacuationState());

    await act(async () => {
      await result.current.handleStartEvacuation();
    });

    await act(async () => {
      await result.current.handleEndEvacuation();
    });

    expect(mockService.endEvacuation).toHaveBeenCalled();
    expect(result.current.evacuationActive).toBe(false);
  });

  it('validates announcement text before sending', async () => {
    const { result } = renderHook(() => useEmergencyEvacuationState());

    await act(async () => {
      await result.current.handleSendAnnouncement();
    });

    expect(mockService.sendAnnouncement).not.toHaveBeenCalled();
  });

  it('sends announcement when text is provided', async () => {
    const { result } = renderHook(() => useEmergencyEvacuationState());

    act(() => {
      result.current.setAnnouncementText('Test announcement');
    });

    await act(async () => {
      await result.current.handleSendAnnouncement();
    });

    expect(mockService.sendAnnouncement).toHaveBeenCalledWith('Test announcement');
  });

  it('assigns and completes assistance', async () => {
    const { result } = renderHook(() => useEmergencyEvacuationState());
    const firstRequest = result.current.guestAssistance[0];
    const firstStaff = result.current.staff[0];

    await act(async () => {
      await result.current.handleAssignAssistance(firstRequest.id, firstStaff.id);
    });

    expect(mockService.assignAssistance).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleCompleteAssistance(firstRequest.id);
    });

    expect(mockService.completeAssistance).toHaveBeenCalledWith(firstRequest.id);
  });
});
