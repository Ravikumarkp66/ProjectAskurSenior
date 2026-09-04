const axios = require('axios');

// In-memory cache for IP lookups (IP -> { data, timestamp })
const ipCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Extracts normalized client IP from Express request
 */
function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.socket?.remoteAddress || 
           req.connection?.remoteAddress || 
           '127.0.0.1';

  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  return ip;
}

/**
 * Checks if an IP is a local/private subnet
 */
function isPrivateIp(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  return /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|fc00:|fe80:)/.test(ip);
}

/**
 * Resolves approximate geolocation from an IP address
 * Guarantees approximate: true
 */
async function resolveLocation(ip) {
  if (isPrivateIp(ip)) {
    return {
      country: 'Localhost',
      state: 'Local Network',
      city: 'Development',
      approximate: true,
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
      }
    };
  }

  // Check cache
  const cached = ipCache.get(ip);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    // Fast lookup with 1.5s timeout via ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,proxy,hosting`, {
      timeout: 1500
    });

    if (response.data && response.data.status === 'success') {
      const result = {
        country: response.data.country || 'Unknown',
        state: response.data.regionName || 'Unknown',
        city: response.data.city || 'Unknown',
        approximate: true,
        isHostingOrProxy: Boolean(response.data.proxy || response.data.hosting),
        coordinates: (response.data.lat && response.data.lon) ? {
          latitude: response.data.lat,
          longitude: response.data.lon
        } : null
      };

      ipCache.set(ip, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    // Fallback gracefully on timeout or network issue
  }

  return {
    country: 'Unknown',
    state: 'Unknown',
    city: 'Unknown',
    approximate: true,
    coordinates: null
  };
}

/**
 * Calculates great-circle distance in kilometers using the Haversine formula
 */
function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || coord1.latitude == null || coord2.latitude == null) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

module.exports = {
  getClientIp,
  isPrivateIp,
  resolveLocation,
  calculateDistance
};
