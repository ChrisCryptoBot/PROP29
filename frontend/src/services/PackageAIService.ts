/**
 * AI Service for Package Management Module
 * Handles smart package-to-guest matching and OCR
 */

import { logger } from './logger';
import { env } from '../config/env';

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

interface OCRResult {
  extractedText: string;
  recipientName: string | null;
  roomNumber: string | null;
  trackingNumber: string | null;
  senderInfo: string | null;
  confidence: number;
  suggestions: {
    recipientName?: string[];
    roomNumber?: string[];
  };
}

interface DeliveryPrediction {
  packageId: string;
  optimalDeliveryTime: string;
  estimatedAcceptanceProbability: number;
  reasoning: string;
  guestAvailabilityPattern: string;
}

export class PackageAIService {
  private apiBaseUrl = env.API_BASE_URL;

  private getAuthHeader(): string {
    return localStorage.getItem('access_token') || localStorage.getItem('token') || '';
  }

  /**
   * Smart package-to-guest matching with fuzzy logic
   */
  async matchPackageToGuest(
    pkg: Package,
    guests: Guest[]
  ): Promise<PackageMatch[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/packages/ai-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthHeader()}`
        },
        body: JSON.stringify({ package: pkg, guests })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.matches || this.generateFallbackMatches(pkg, guests);
    } catch (error) {
      logger.error('AI Package Matching Error', error instanceof Error ? error : new Error(String(error)), { module: 'PackageAIService', action: 'matchPackageToGuest' });
      return this.generateFallbackMatches(pkg, guests);
    }
  }

  /**
   * OCR processing for package labels
   */
  async processPackageLabel(imageData: string | File): Promise<OCRResult> {
    try {
      const formData = new FormData();
      if (typeof imageData === 'string') {
        formData.append('image_url', imageData);
      } else {
        formData.append('image', imageData);
      }

      const response = await fetch(`${this.apiBaseUrl}/packages/ai-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthHeader()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('AI OCR Error', error instanceof Error ? error : new Error(String(error)), { module: 'PackageAIService', action: 'processPackageLabel' });
      return {
        extractedText: '',
        recipientName: null,
        roomNumber: null,
        trackingNumber: null,
        senderInfo: null,
        confidence: 0,
        suggestions: {}
      };
    }
  }

  /**
   * Predict optimal delivery time for guest
   */
  async predictDeliveryTime(
    pkg: Package,
    guest: Guest
  ): Promise<DeliveryPrediction> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/packages/ai-delivery-prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthHeader()}`
        },
        body: JSON.stringify({ package: pkg, guest })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('AI Delivery Prediction Error', error instanceof Error ? error : new Error(String(error)), { module: 'PackageAIService', action: 'predictDeliveryTime' });
      return this.generateFallbackPrediction(pkg, guest);
    }
  }

  /**
   * Fallback package matching using fuzzy string matching
   */
  private generateFallbackMatches(pkg: Package, guests: Guest[]): PackageMatch[] {
    const matches: PackageMatch[] = [];

    guests.forEach(guest => {
      const matchReasons: string[] = [];
      let score = 0;

      // Name similarity
      const nameSimilarity = this.calculateStringSimilarity(
        pkg.recipient_name.toLowerCase(),
        guest.name.toLowerCase()
      );

      if (nameSimilarity > 0.6) {
        score += nameSimilarity * 0.5;
        matchReasons.push(`Name match: ${(nameSimilarity * 100).toFixed(0)}% similarity`);
      }

      // Exact room match
      if (pkg.recipient_room && pkg.recipient_room === guest.room) {
        score += 0.3;
        matchReasons.push(`Exact room match: ${guest.room}`);
      }

      // Phone number match
      if (pkg.recipient_phone) {
        const cleanPkgPhone = pkg.recipient_phone.replace(/\D/g, '');
        const cleanGuestPhone = guest.phone.replace(/\D/g, '');
        if (cleanPkgPhone.includes(cleanGuestPhone.slice(-4)) || cleanGuestPhone.includes(cleanPkgPhone.slice(-4))) {
          score += 0.15;
          matchReasons.push('Phone number partial match');
        }
      }

      // Email match
      if (pkg.recipient_email && guest.email) {
        const emailSimilarity = this.calculateStringSimilarity(
          pkg.recipient_email.toLowerCase(),
          guest.email.toLowerCase()
        );
        if (emailSimilarity > 0.7) {
          score += emailSimilarity * 0.05;
          matchReasons.push('Email address match');
        }
      }

      // Only include matches above threshold
      if (score > 0.5) {
        matches.push({
          packageId: pkg.id,
          guestId: guest.id,
          guestName: guest.name,
          roomNumber: guest.room,
          confidence: Math.min(score, 0.99), // Cap at 99%
          matchReasons,
          similarityScore: score,
          autoAssign: score > 0.85 // Auto-assign if very high confidence
        });
      }
    });

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate Levenshtein distance-based string similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance calculation
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Fallback delivery time prediction
   */
  private generateFallbackPrediction(pkg: Package, guest: Guest): DeliveryPrediction {
    const now = new Date();
    const checkIn = new Date(guest.checkInDate);
    const checkOut = new Date(guest.checkOutDate);

    // Determine optimal delivery time based on package type and guest stay
    let optimalHour = 16; // Default 4 PM
    let reason = 'Typical guest availability';

    if (pkg.package_type === 'food') {
      optimalHour = 18; // 6 PM for food deliveries
      reason = 'Dinner time delivery for food items';
    } else if (pkg.package_type === 'document') {
      optimalHour = 10; // 10 AM for documents
      reason = 'Morning delivery for time-sensitive documents';
    }

    // Adjust for guest check-in/out
    const daysUntilCheckout = Math.ceil((checkOut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilCheckout <= 1) {
      optimalHour = 9; // Deliver early if checking out soon
      reason = 'Early delivery - guest checking out soon';
    }

    const optimalDeliveryTime = new Date(now);
    optimalDeliveryTime.setHours(optimalHour, 0, 0, 0);

    // If optimal time has passed today, schedule for tomorrow
    if (optimalDeliveryTime < now) {
      optimalDeliveryTime.setDate(optimalDeliveryTime.getDate() + 1);
    }

    return {
      packageId: pkg.id,
      optimalDeliveryTime: optimalDeliveryTime.toISOString(),
      estimatedAcceptanceProbability: 0.75,
      reasoning: reason,
      guestAvailabilityPattern: `Typically available ${optimalHour-2}:00 - ${optimalHour+2}:00`
    };
  }

  /**
   * Format confidence as percentage
   */
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(0)}%`;
  }

  /**
   * Get match quality indicator
   */
  getMatchQuality(confidence: number): { label: string; color: string } {
    if (confidence >= 0.9) return { label: 'Excellent', color: '#10b981' };
    if (confidence >= 0.75) return { label: 'Good', color: '#3b82f6' };
    if (confidence >= 0.6) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Low', color: '#ef4444' };
  }
}

export const packageAI = new PackageAIService();
