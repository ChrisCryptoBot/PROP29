import apiService from './ApiService';

export interface EvacuationSessionResponse {
  session_id: string;
  status: string;
  started_at?: string;
  ended_at?: string;
}

export async function startEvacuation(notes?: string) {
  return apiService.post<EvacuationSessionResponse>('/evacuation/start', { notes });
}

export async function endEvacuation(notes?: string) {
  return apiService.post<EvacuationSessionResponse>('/evacuation/end', { notes });
}

export async function sendAnnouncement(message: string) {
  return apiService.post('/evacuation/actions/announcement', { message });
}

export async function unlockExits() {
  return apiService.post('/evacuation/actions/unlock-exits', {});
}

export async function contactEmergencyServices() {
  return apiService.post('/evacuation/actions/contact-emergency', {});
}

export async function notifyGuests() {
  return apiService.post('/evacuation/actions/notify-guests', {});
}

export async function assignAssistance(payload: { session_id?: string; guest_name: string; room: string; need: string; priority: string; assigned_staff?: string; notes?: string; }) {
  return apiService.post('/evacuation/assistance/assign', payload);
}

export async function completeAssistance(assistance_id: string) {
  return apiService.post('/evacuation/assistance/complete', { assistance_id });
}

export async function getEvacuationMetrics() {
  return apiService.get('/evacuation/metrics');
}

export async function getFloorStatuses() {
  return apiService.get('/evacuation/floors');
}

export async function getStaffMembers() {
  return apiService.get('/evacuation/staff');
}

export async function getTimelineEvents() {
  return apiService.get('/evacuation/timeline');
}

export async function getGuestAssistance() {
  return apiService.get('/evacuation/assistance');
}

export async function getEvacuationRoutes() {
  return apiService.get('/evacuation/routes');
}

export async function getCommunicationLogs() {
  return apiService.get('/evacuation/communications');
}

export async function getEvacuationDrills() {
  return apiService.get('/evacuation/drills');
}

