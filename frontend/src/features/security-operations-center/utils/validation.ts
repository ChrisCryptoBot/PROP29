/**
 * Validation Utilities
 * IP address, stream URL, and camera name validation
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate IP address format (IPv4)
 */
export function validateIPAddress(ip: string): ValidationResult {
  if (!ip.trim()) {
    return { valid: false, error: 'IP address is required' };
  }

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return { valid: false, error: 'Invalid IP address format' };
  }

  const parts = ip.split('.');
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) {
      return { valid: false, error: 'IP address octets must be 0-255' };
    }
  }

  return { valid: true };
}

/**
 * Validate stream URL format
 */
export function validateStreamURL(url: string): ValidationResult {
  if (!url.trim()) {
    return { valid: false, error: 'Stream URL is required' };
  }

  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.toLowerCase();
    
    // Allow RTSP, HTTP, HTTPS, and WebSocket protocols
    const allowedProtocols = ['rtsp:', 'http:', 'https:', 'ws:', 'wss:'];
    if (!allowedProtocols.includes(protocol)) {
      return { valid: false, error: 'Stream URL must use RTSP, HTTP, HTTPS, WS, or WSS protocol' };
    }

    // Check for common stream formats in path
    const path = urlObj.pathname.toLowerCase();
    const hasStreamExtension = /\.(m3u8|mp4|flv|rtmp|ts)$/i.test(path);
    const hasStreamPath = /\/stream|\/live|\/video/i.test(path);
    
    if (!hasStreamExtension && !hasStreamPath && protocol !== 'rtsp:') {
      // Warning but not error - some streams don't have obvious paths
    }

    return { valid: true };
  } catch {
    // Try as RTSP URL (rtsp:// doesn't parse with URL constructor)
    if (/^rtsp:\/\//i.test(url)) {
      return { valid: true };
    }
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate camera name
 */
export function validateCameraName(name: string): ValidationResult {
  if (!name.trim()) {
    return { valid: false, error: 'Camera name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Camera name must be at least 3 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Camera name must be less than 100 characters' };
  }

  // Allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { valid: false, error: 'Camera name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { valid: true };
}

/**
 * Validate location
 */
export function validateLocation(location: string): ValidationResult {
  if (!location.trim()) {
    return { valid: false, error: 'Location is required' };
  }

  if (location.length < 2) {
    return { valid: false, error: 'Location must be at least 2 characters' };
  }

  if (location.length > 200) {
    return { valid: false, error: 'Location must be less than 200 characters' };
  }

  return { valid: true };
}

/**
 * Validate all camera fields
 */
export function validateCameraForm(data: {
  name: string;
  location: string;
  ipAddress: string;
  streamUrl: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const nameResult = validateCameraName(data.name);
  if (!nameResult.valid) {
    errors.name = nameResult.error || 'Invalid name';
  }

  const locationResult = validateLocation(data.location);
  if (!locationResult.valid) {
    errors.location = locationResult.error || 'Invalid location';
  }

  const ipResult = validateIPAddress(data.ipAddress);
  if (!ipResult.valid) {
    errors.ipAddress = ipResult.error || 'Invalid IP address';
  }

  const urlResult = validateStreamURL(data.streamUrl);
  if (!urlResult.valid) {
    errors.streamUrl = urlResult.error || 'Invalid stream URL';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
