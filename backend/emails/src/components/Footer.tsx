import { Section, Text, Link } from '@react-email/components';
import React from 'react';

export default function Footer() {
  return (
    <Section style={footerStyle}>
      <div style={dividerStyle} />
      
      <Text style={everyResourceText}>
        "Every resource shared today helps a student tomorrow."
      </Text>
      
      <Text style={signatureText}>
        Team AskUrSenior ❤️
      </Text>
      
      <div style={socialContainerStyle}>
        <Link href="https://github.com/Ravikumarkp66/ProjectAskurSenior" style={socialLinkStyle}>GitHub</Link>
        <span style={dotStyle}>•</span>
        <Link href="https://www.linkedin.com/in/ravikumar-k-p-80b7a628b/" style={socialLinkStyle}>LinkedIn</Link>
        <span style={dotStyle}>•</span>
        <Link href="mailto:support@askursenior.org" style={socialLinkStyle}>Support</Link>
      </div>
      
      <Text style={copyrightText}>
        © 2026 AskUrSenior. Built by Students, For Students.<br />
        Need help? Reach out at <Link href="mailto:support@askursenior.org" style={supportLinkStyle}>support@askursenior.org</Link>
      </Text>
    </Section>
  );
}

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '32px',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#e5e7eb',
  marginBottom: '24px',
};

const everyResourceText: React.CSSProperties = {
  fontSize: '14px',
  fontStyle: 'italic',
  color: '#4b5563',
  margin: '0 0 4px 0',
  fontWeight: 500,
};

const signatureText: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#1f2937',
  margin: '0 0 16px 0',
};

const socialContainerStyle: React.CSSProperties = {
  margin: '16px 0',
};

const socialLinkStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#2563eb',
  fontWeight: 600,
  textDecoration: 'none',
  margin: '0 8px',
};

const dotStyle: React.CSSProperties = {
  color: '#d1d5db',
  fontSize: '13px',
};

const copyrightText: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
  lineHeight: '1.6',
  margin: '16px 0 0 0',
};

const supportLinkStyle: React.CSSProperties = {
  color: '#9ca3af',
  textDecoration: 'underline',
};
