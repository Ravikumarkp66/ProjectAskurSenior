/**
 * Zero-dependency User-Agent string parser
 * Extracts deviceType, operatingSystem, and browser
 */
function parseUserAgent(userAgentString = '') {
  const ua = userAgentString || '';

  let deviceType = 'Desktop';
  let operatingSystem = 'Unknown OS';
  let browser = 'Unknown Browser';

  // 1. Device Type Detection
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    deviceType = 'Tablet';
  } else if (/Mobile|iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Kindle|Opera Mini/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/bot|crawler|spider|crawling/i.test(ua)) {
    deviceType = 'Bot';
  } else {
    deviceType = 'Desktop';
  }

  // 2. Operating System Detection
  if (/Windows NT 10.0/i.test(ua)) {
    operatingSystem = 'Windows 10/11';
  } else if (/Windows NT 6.3/i.test(ua)) {
    operatingSystem = 'Windows 8.1';
  } else if (/Windows NT 6.2/i.test(ua)) {
    operatingSystem = 'Windows 8';
  } else if (/Windows NT 6.1/i.test(ua)) {
    operatingSystem = 'Windows 7';
  } else if (/Windows/i.test(ua)) {
    operatingSystem = 'Windows';
  } else if (/iPhone OS ([\d_]+)/i.test(ua)) {
    const match = ua.match(/iPhone OS ([\d_]+)/i);
    operatingSystem = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/iPad.*OS ([\d_]+)/i.test(ua)) {
    const match = ua.match(/OS ([\d_]+)/i);
    operatingSystem = match ? `iPadOS ${match[1].replace(/_/g, '.')}` : 'iPadOS';
  } else if (/Android ([\d.]+)/i.test(ua)) {
    const match = ua.match(/Android ([\d.]+)/i);
    operatingSystem = match ? `Android ${match[1]}` : 'Android';
  } else if (/Mac OS X ([\d_]+)/i.test(ua)) {
    const match = ua.match(/Mac OS X ([\d_]+)/i);
    operatingSystem = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/CrOS/i.test(ua)) {
    operatingSystem = 'Chrome OS';
  } else if (/Linux/i.test(ua)) {
    operatingSystem = 'Linux';
  }

  // 3. Browser Detection (Order matters: Edge/Opera before Chrome, Chrome before Safari)
  if (/Edg\/([\d.]+)/i.test(ua)) {
    const match = ua.match(/Edg\/([\d.]+)/i);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/OPR\/([\d.]+)|Opera\/([\d.]+)/i.test(ua)) {
    const match = ua.match(/(?:OPR|Opera)\/([\d.]+)/i);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/SamsungBrowser\/([\d.]+)/i.test(ua)) {
    const match = ua.match(/SamsungBrowser\/([\d.]+)/i);
    browser = `Samsung Internet ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Firefox\/([\d.]+)/i.test(ua)) {
    const match = ua.match(/Firefox\/([\d.]+)/i);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Chrome\/([\d.]+)/i.test(ua) && !/Chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/([\d.]+)/i);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Version\/([\d.]+).*Safari/i.test(ua)) {
    const match = ua.match(/Version\/([\d.]+)/i);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/Safari/i.test(ua)) {
    browser = 'Safari';
  }

  return {
    deviceType,
    operatingSystem,
    browser
  };
}

module.exports = {
  parseUserAgent
};
