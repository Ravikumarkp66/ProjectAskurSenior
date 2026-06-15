import { Img, Section, Text } from '@react-email/components';
import React from 'react';

export default function Header() {
  return (
    <Section style={headerStyle}>
      <Img
        src="https://project-askur-senior.vercel.app/as-logo-branded.png"
        alt="AskUrSenior Logo"
        width="180"
        height="45"
        style={logoStyle}
      />
      <Text style={taglineStyle}>Built by Students, For Students</Text>
      <div style={dividerStyle} />
    </Section>
  );
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '24px',
};

const logoStyle: React.CSSProperties = {
  margin: '0 auto',
  display: 'block',
};

const taglineStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: 600,
  marginTop: '8px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  margin: '8px 0 0 0',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: '#e5e7eb',
  marginTop: '20px',
};
