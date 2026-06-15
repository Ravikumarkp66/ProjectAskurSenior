import { render } from '@react-email/render';
import * as fs from 'fs';
import * as path from 'path';
import React from 'react';
import { WelcomeEmail } from './src/WelcomeEmail';
import { ContributionSubmittedEmail } from './src/ContributionSubmittedEmail';
import { ContributionApprovedEmail } from './src/ContributionApprovedEmail';

// Outputs directory relative to this script: backend/templates
const templatesDir = path.join(__dirname, '..', 'templates');

// Ensure directory exists
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

console.log(`Starting email templates compilation to: ${templatesDir}`);

try {
  // Render templates to static HTML
  const welcomeHtml = render(React.createElement(WelcomeEmail));
  fs.writeFileSync(path.join(templatesDir, 'welcome.html'), welcomeHtml);
  console.log('✓ Compiled: welcome.html');

  const submittedHtml = render(React.createElement(ContributionSubmittedEmail));
  fs.writeFileSync(path.join(templatesDir, 'contribution-submitted.html'), submittedHtml);
  console.log('✓ Compiled: contribution-submitted.html');

  const approvedHtml = render(React.createElement(ContributionApprovedEmail));
  fs.writeFileSync(path.join(templatesDir, 'contribution-approved.html'), approvedHtml);
  console.log('✓ Compiled: contribution-approved.html');

  console.log('🎉 Email template compilation completed successfully!');
} catch (error) {
  console.error('❌ Compilation failed with error:', error);
  process.exit(1);
}
