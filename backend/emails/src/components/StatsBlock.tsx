import { Section, Text } from '@react-email/components';
import React from 'react';

export default function StatsBlock() {
  return (
    <Section style={statsContainerStyle}>
      <Text style={statsTitleStyle}>📊 Community Impact</Text>
      <table width="100%" border={0} cellPadding={0} cellSpacing={0} style={tableStyle}>
        <tbody>
          <tr>
            <td width="33%" align="center" style={statBoxStyle}>
              <Text style={numberStyle}>{"{{totalResources}}"}</Text>
              <Text style={labelStyle}>Resources Shared</Text>
            </td>
            <td width="33%" align="center" style={statBoxMiddleStyle}>
              <Text style={numberStyle}>{"{{totalContributors}}"}</Text>
              <Text style={labelStyle}>Contributors</Text>
            </td>
            <td width="33%" align="center" style={statBoxStyle}>
              <Text style={numberStyle}>{"{{totalUsers}}"}</Text>
              <Text style={labelStyle}>Students Helped</Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

const statsContainerStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '20px 12px',
  margin: '28px 0',
  border: '1px solid #e5e7eb',
};

const statsTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#4b5563',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 16px 0',
  textAlign: 'center',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const statBoxStyle: React.CSSProperties = {
  padding: '4px',
};

const statBoxMiddleStyle: React.CSSProperties = {
  padding: '4px',
  borderLeft: '1px solid #e5e7eb',
  borderRight: '1px solid #e5e7eb',
};

const numberStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#2563eb', // AskUrSenior Brand Primary Color
  margin: '0 0 2px 0',
  lineHeight: '1.2',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: '#6b7280',
  margin: '0',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  lineHeight: '1.3',
};
