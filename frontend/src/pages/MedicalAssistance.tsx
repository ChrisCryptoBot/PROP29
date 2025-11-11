import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { cn } from '../utils/cn';
import { showError, showSuccess, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../utils/toast';

interface AssessmentData {
  patientLocation: string;
  consciousness: string;
  breathing: string;
  symptoms: string[];
  additionalInfo: string;
}

interface ResponseLogEntry {
  time: string;
  content: string;
  timestamp: Date;
  current?: boolean;
}

const MedicalAssistance: React.FC = () => {
  const navigate = useNavigate();
  
  // Authentication check
  useEffect(() => {
    const isAdmin = localStorage.getItem('admin_medicalassistance_authenticated');
    if (!isAdmin) {
      navigate('/modules/MedicalAssistanceAuth');
    }
  }, [navigate]);

  // Timer state
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [incidentLogged, setIncidentLogged] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const timerStr = `${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`;

  // Assessment state
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    patientLocation: '',
    consciousness: '',
    breathing: '',
    symptoms: [],
    additionalInfo: ''
  });

  const [actionsCompleted, setActionsCompleted] = useState<string[]>([]);
  const [responseLog, setResponseLog] = useState<ResponseLogEntry[]>([
    { time: '00:12 ago', content: 'Emergency reported by housekeeping', timestamp: new Date(Date.now() - 12 * 60 * 1000) },
    { time: '00:10 ago', content: 'Security team dispatched', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
    { time: '00:08 ago', content: '911 called - EMS en route', timestamp: new Date(Date.now() - 8 * 60 * 1000) },
    { time: '00:05 ago', content: 'Area secured, guests evacuated', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    { time: 'Now', content: 'Assessment in progress', current: true, timestamp: new Date() }
  ]);
  
  const [incidentId] = useState(`MED-${Date.now()}`);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleInputChange = useCallback((field: keyof AssessmentData, value: string | string[]) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSymptomToggle = useCallback((symptom: string) => {
    setAssessmentData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom) 
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  }, []);

  const handleActionComplete = useCallback((action: string) => {
    if (!actionsCompleted.includes(action)) {
      setActionsCompleted(prev => [...prev, action]);
      
      // Add to response log
      setResponseLog(prev => [
        { 
          time: 'Now', 
          content: `Action completed: ${action}`, 
          timestamp: new Date(),
          current: true
        },
        ...prev.map(item => ({ ...item, current: false }))
      ]);
    }
  }, [actionsCompleted]);

  const handleCall911 = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Calling 911...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      handleActionComplete('911 called');
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, '911 called successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to call 911');
      }
    }
  }, [handleActionComplete]);

  const handleDispatchSecurity = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Dispatching security...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      handleActionComplete('Security team dispatched');
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Security team dispatched');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to dispatch security');
      }
    }
  }, [handleActionComplete]);

  const handleEvacuateArea = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Evacuating area...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      handleActionComplete('Area evacuated');
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Area evacuated successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to evacuate area');
      }
    }
  }, [handleActionComplete]);

  const handleLogIncident = useCallback(async () => {
    let toastId: string | undefined;
    try {
      toastId = showLoading('Logging incident...');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIncidentLogged(true);
      handleActionComplete('Incident logged');
      if (toastId) {
        dismissLoadingAndShowSuccess(toastId, 'Incident logged successfully');
      }
    } catch (error) {
      if (toastId) {
        dismissLoadingAndShowError(toastId, 'Failed to log incident');
      }
    }
  }, [handleActionComplete]);

  const exportReport = useCallback(() => {
    const report = {
      incidentId,
      timestamp: new Date().toISOString(),
      duration: timerStr,
      assessment: assessmentData,
      actionsCompleted,
      responseLog: responseLog.map(entry => ({
        time: entry.time,
        content: entry.content,
        timestamp: entry.timestamp.toISOString()
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-incident-${incidentId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [incidentId, timerStr, assessmentData, actionsCompleted, responseLog]);

  const endResponse = useCallback(() => {
    if (actionsCompleted.length > 0) {
      if (window.confirm('Medical emergency response is in progress. Are you sure you want to end the response?')) {
        timerRef.current && clearInterval(timerRef.current);
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  }, [actionsCompleted.length, navigate]);

  const symptoms = [
    'Chest pain', 'Difficulty breathing', 'Unconscious', 'Bleeding', 
    'Seizure', 'Allergic reaction', 'Heart attack', 'Stroke',
    'Broken bone', 'Burn', 'Head injury', 'Abdominal pain'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Gold Standard Header */}
      <div className="relative w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-slate-100/30 to-slate-200/50" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80"
            >
              <i className="fas fa-arrow-left mr-2" />
              Back to Dashboard
            </Button>

            {/* Title Section */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-medkit text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Medical Emergency Response
                </h1>
                <p className="text-slate-600 font-medium">
                  Initiate, track, and manage medical emergencies in real time
                </p>
              </div>
            </div>

            {/* Emergency Badge */}
            <div className="backdrop-blur-sm bg-red-500/20 border border-red-300/30 rounded-xl px-4 py-2">
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wide">
                Emergency Access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">
          Medical Emergency Response System
        </h2>
        <p className="text-slate-600">
          This module is currently under development. Emergency response functionality will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default MedicalAssistance;