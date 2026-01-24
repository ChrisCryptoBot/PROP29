/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnnouncementModal from '../components/modals/AnnouncementModal';

jest.mock('../context/EmergencyEvacuationContext', () => ({
  useEmergencyEvacuationContext: jest.fn(),
}));

const mockUseContext = require('../context/EmergencyEvacuationContext').useEmergencyEvacuationContext;

describe('AnnouncementModal', () => {
  const mockContext = {
    announcementText: '',
    setAnnouncementText: jest.fn(),
    handleSendAnnouncement: jest.fn(),
    setShowAnnouncementModal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContext.mockReturnValue(mockContext);
  });

  it('renders modal content', () => {
    render(<AnnouncementModal />);
    expect(screen.getByText('Make All-Call Announcement')).toBeInTheDocument();
  });

  it('updates announcement text', () => {
    render(<AnnouncementModal />);
    const textarea = screen.getByPlaceholderText('Enter your announcement message...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    expect(mockContext.setAnnouncementText).toHaveBeenCalledWith('Test message');
  });

  it('submits announcement', () => {
    render(<AnnouncementModal />);
    fireEvent.click(screen.getByText('Broadcast Announcement'));
    expect(mockContext.handleSendAnnouncement).toHaveBeenCalled();
  });

  it('closes modal', () => {
    render(<AnnouncementModal />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockContext.setShowAnnouncementModal).toHaveBeenCalledWith(false);
  });
});

