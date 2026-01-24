import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError, showSuccess } from '../../utils/toast';
import { packageAI } from '../../services/PackageAIService';
import { logger } from '../../services/logger';
import '../../styles/modern-glass.css';

interface Package {
  id: string;
  tracking_number: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_email?: string;
  recipient_room?: string;
  sender_name: string;
  package_type: 'parcel' | 'document' | 'food' | 'equipment' | 'other';
  package_size: 'small' | 'medium' | 'large' | 'oversized';
  description: string;
  status: 'received' | 'notified' | 'delivered' | 'picked_up' | 'expired' | 'returned';
  received_date: string;
  location: string;
}

interface Guest {
  id: string;
  name: string;
  room: string;
  phone: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
}

interface PackageMatch {
  packageId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  confidence: number;
  matchReasons: string[];
  similarityScore: number;
  autoAssign: boolean;
}

interface Props {
  selectedPackage: Package | null;
  guests: Guest[];
  onAssignPackage?: (packageId: string, guestId: string) => void;
}

export const SmartMatchingPanel: React.FC<Props> = ({ selectedPackage, guests, onAssignPackage }) => {
  const [matches, setMatches] = useState<PackageMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showOCRUpload, setShowOCRUpload] = useState(false);

  const handleSmartMatch = async () => {
    if (!selectedPackage) {
      showError('Please select a package first');
      return;
    }

    if (guests.length === 0) {
      showError('No guests available for matching');
      return;
    }

    const toastId = showLoading('Finding best match with AI...');
    setIsMatching(true);

    try {
      const packageMatches = await packageAI.matchPackageToGuest(selectedPackage, guests);
      setMatches(packageMatches);

      if (packageMatches.length === 0) {
        dismissLoadingAndShowSuccess(toastId, 'No matches found');
      } else {
        dismissLoadingAndShowSuccess(
          toastId,
          `Found ${packageMatches.length} potential match${packageMatches.length > 1 ? 'es' : ''}!`
        );

        // Auto-assign if high confidence
        if (packageMatches[0].autoAssign) {
          showSuccess(`Auto-assigned to ${packageMatches[0].guestName} (${packageMatches[0].confidence * 100}% confidence)`);
        }
      }
    } catch (error) {
      logger.error('Smart matching error', error instanceof Error ? error : new Error(String(error)), { module: 'SmartMatchingPanel', action: 'handleSmartMatch' });
      showError('Failed to find matches');
    } finally {
      setIsMatching(false);
    }
  };

  const handleOCRUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = showLoading('Processing image with OCR...');

    try {
      const result = await packageAI.processPackageLabel(file);
      setOcrResult(result);
      dismissLoadingAndShowSuccess(toastId, 'OCR processing complete!');
    } catch (error) {
      logger.error('OCR error', error instanceof Error ? error : new Error(String(error)), { module: 'SmartMatchingPanel', action: 'handleOCRUpload' });
      showError('Failed to process image');
    }
  };

  const handleAssign = (match: PackageMatch) => {
    if (onAssignPackage && selectedPackage) {
      onAssignPackage(selectedPackage.id, match.guestId);
      showSuccess(`Package assigned to ${match.guestName} in Room ${match.roomNumber}`);
    }
  };

  const matchQuality = (confidence: number) => packageAI.getMatchQuality(confidence);

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="glass-card spacing-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-md">
            <div className="duotone-overlay duotone-primary">
              <i className="fas fa-magic"></i>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">AI Smart Matching</h3>
              <p className="text-sm text-slate-600 mt-1">
                Intelligent package-to-guest matching with OCR
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowOCRUpload(!showOCRUpload)}
              className="btn-glass"
            >
              <i className="fas fa-camera mr-2"></i>
              OCR Scan
            </Button>
            <Button
              onClick={handleSmartMatch}
              disabled={isMatching || !selectedPackage}
              className="btn-gradient-primary"
            >
              <i className={`fas ${isMatching ? 'fa-spinner fa-spin' : 'fa-brain'} mr-2`}></i>
              {isMatching ? 'Matching...' : 'Find Match'}
            </Button>
          </div>
        </div>

        {/* Selected Package Info */}
        {selectedPackage && (
          <div className="bg-white/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900 mb-1">
                  {selectedPackage.recipient_name}
                </div>
                <div className="text-xs text-slate-600">
                  <i className="fas fa-barcode mr-2"></i>
                  {selectedPackage.tracking_number}
                </div>
              </div>
              <Badge className="badge badge-info">
                {selectedPackage.package_type}
              </Badge>
            </div>
          </div>
        )}

        {/* OCR Upload Section */}
        {showOCRUpload && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mt-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-camera text-purple-600 text-lg mt-1"></i>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-900 mb-2">
                  Upload Package Label Photo
                </p>
                <p className="text-sm text-purple-700 mb-3">
                  AI will extract recipient name, room number, and tracking info
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOCRUpload}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div className="ai-result-card mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                OCR Results
              </h4>
              <Badge className="ai-confidence-badge">
                {packageAI.formatConfidence(ocrResult.confidence)} Confidence
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ocrResult.recipientName && (
                <div className="bg-white/50 rounded p-2">
                  <div className="text-xs text-slate-600">Recipient Name</div>
                  <div className="text-sm font-medium text-slate-900">{ocrResult.recipientName}</div>
                </div>
              )}
              {ocrResult.roomNumber && (
                <div className="bg-white/50 rounded p-2">
                  <div className="text-xs text-slate-600">Room Number</div>
                  <div className="text-sm font-medium text-slate-900">{ocrResult.roomNumber}</div>
                </div>
              )}
              {ocrResult.trackingNumber && (
                <div className="bg-white/50 rounded p-2">
                  <div className="text-xs text-slate-600">Tracking Number</div>
                  <div className="text-sm font-medium text-slate-900">{ocrResult.trackingNumber}</div>
                </div>
              )}
              {ocrResult.senderInfo && (
                <div className="bg-white/50 rounded p-2">
                  <div className="text-xs text-slate-600">Sender</div>
                  <div className="text-sm font-medium text-slate-900">{ocrResult.senderInfo}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Match Results */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <i className="fas fa-star text-yellow-500"></i>
              Best Matches ({matches.length})
            </h4>
          </div>

          {matches.map((match, index) => {
            const quality = matchQuality(match.confidence);

            return (
              <div key={index} className="ai-feature-card fade-in">
                <div className="flex items-start gap-4">
                  {/* Match Rank Badge */}
                  <div className={`duotone-overlay ${index === 0 ? 'duotone-success' : index === 1 ? 'duotone-primary' : 'duotone-info'}`} style={{ width: '56px', height: '56px', flexShrink: 0 }}>
                    <div className="text-2xl font-bold">#{index + 1}</div>
                  </div>

                  <div className="flex-1">
                    {/* Match Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-1">
                          {match.guestName}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="badge badge-primary">
                            Room {match.roomNumber}
                          </Badge>
                          {match.autoAssign && (
                            <Badge className="badge badge-success">
                              <i className="fas fa-magic mr-1"></i>
                              Auto-Assign Recommended
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold" style={{ color: quality.color }}>
                          {packageAI.formatConfidence(match.confidence)}
                        </div>
                        <div className="text-xs font-semibold" style={{ color: quality.color }}>
                          {quality.label} Match
                        </div>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded mb-4">
                      <p className="text-sm font-semibold text-green-900 mb-2">
                        <i className="fas fa-check-circle mr-2"></i>
                        Match Indicators
                      </p>
                      <ul className="space-y-1">
                        {match.matchReasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <i className="fas fa-arrow-right text-green-600 text-xs mt-1"></i>
                            <span className="text-sm text-green-800">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleAssign(match)}
                        className="btn-gradient-primary"
                      >
                        <i className="fas fa-check mr-2"></i>
                        Assign to Guest
                      </Button>
                      <Button className="btn-glass">
                        <i className="fas fa-bell mr-2"></i>
                        Notify Guest
                      </Button>
                      <Button className="btn-glass">
                        <i className="fas fa-info-circle mr-2"></i>
                        View Guest Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How It Works Section */}
      <div className="glass-card spacing-lg">
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fas fa-lightbulb text-yellow-600"></i>
          How Smart Matching Works
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="duotone-overlay duotone-primary mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
              <i className="fas fa-user-check"></i>
            </div>
            <h5 className="font-semibold text-slate-900 mb-1">Name Matching</h5>
            <p className="text-sm text-slate-600">
              Fuzzy matching handles typos, abbreviations, and variations
            </p>
          </div>

          <div className="text-center">
            <div className="duotone-overlay duotone-success mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
              <i className="fas fa-door-open"></i>
            </div>
            <h5 className="font-semibold text-slate-900 mb-1">Room Verification</h5>
            <p className="text-sm text-slate-600">
              Cross-references room numbers from package labels
            </p>
          </div>

          <div className="text-center">
            <div className="duotone-overlay duotone-purple mx-auto mb-3" style={{ width: '48px', height: '48px' }}>
              <i className="fas fa-phone"></i>
            </div>
            <h5 className="font-semibold text-slate-900 mb-1">Contact Match</h5>
            <p className="text-sm text-slate-600">
              Validates using phone numbers and email addresses
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!selectedPackage && matches.length === 0 && (
        <div className="glass-card spacing-2xl text-center">
          <div className="duotone-overlay duotone-primary mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <i className="fas fa-magic" style={{ fontSize: '32px' }}></i>
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">Select a Package to Start</h4>
          <p className="text-slate-600 mb-4">
            Choose a package from your list to find the best guest match using AI
          </p>
        </div>
      )}

      {matches.length === 0 && selectedPackage && !isMatching && (
        <div className="glass-card spacing-2xl text-center">
          <div className="duotone-overlay duotone-warning mx-auto mb-4" style={{ width: '64px', height: '64px' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '32px' }}></i>
          </div>
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Matches Found</h4>
          <p className="text-slate-600 mb-4">
            Try using OCR to extract more information from the package label
          </p>
        </div>
      )}
    </div>
  );
};

