import { Text, Heading, Button, Section } from '@react-email/components';
import React from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import Footer from './components/Footer';
import StatsBlock from './components/StatsBlock';

export function ContributionSubmittedEmail() {
  return (
    <Layout previewText="Thank You for Contributing ❤️ We've received your upload!">
      <Header />
      
      <Heading style={headingStyle}>Thank You for Contributing! ❤️</Heading>
      
      <Text style={paragraphStyle}>
        Hi there,
      </Text>
      
      <Text style={paragraphStyle}>
        We wanted to let you know that we've successfully received your study material submission. Thank you for taking the time to share your resources and support the student community!
      </Text>

      <Section style={statusCardStyle}>
        <Text style={statusLabelStyle}>REVIEW STATUS</Text>
        <Text style={statusTextStyle}>⏳ Under Review</Text>
      </Section>

      <Heading style={subHeadingStyle}>Resource Details: 📁</Heading>
      <table width="100%" style={tableStyle}>
        <tbody>
          <tr>
            <td style={tdLabelStyle}>Resource Name</td>
            <td style={tdValueStyle}>{"{{resourceName}}"}</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Subject</td>
            <td style={tdValueStyle}>{"{{subjectName}}"} ({"{{subjectCode}}"})</td>
          </tr>
          <tr>
            <td style={tdLabelStyle}>Category</td>
            <td style={tdValueStyle} style={{ ...tdValueStyle, textTransform: 'uppercase' }}>{"{{documentType}}"}</td>
          </tr>
          <tr>
            <td style={tdLabelStyle} style={{ ...tdLabelStyle, borderBottom: 'none' }}>Semester</td>
            <td style={tdValueStyle} style={{ ...tdValueStyle, borderBottom: 'none' }}>{"{{semester}}"}</td>
          </tr>
        </tbody>
      </table>

      <Text style={paragraphStyle}>
        Our admin team is currently reviewing your uploaded files for quality, formatting, and relevance. You will receive another notification once your contribution is approved and published live!
      </Text>

      <Heading style={subHeadingStyle}>We Accept: 📄</Heading>
      <ul style={listStyle}>
        <li style={listItemStyle}>📚 Handwritten Notes</li>
        <li style={listItemStyle}>📝 Previous Year Questions (PYQs)</li>
        <li style={listItemStyle}>💡 Question Banks & Answer Keys</li>
        <li style={listItemStyle}>📋 Assignments & Lab Manuals</li>
        <li style={listItemStyle}>🎯 Placement Resources & Interview Experiences</li>
        <li style={listItemStyle}>📁 Any other useful engineering study materials</li>
      </ul>

      <Section style={bonusSectionStyle}>
        <Heading style={bonusHeadingStyle}>⭐️ How to Earn Bonus Points:</Heading>
        <Text style={bonusParagraphStyle}>
          Earn extra points and get faster approval by uploading:
        </Text>
        <ul style={bonusListStyle}>
          <li style={bonusListItemStyle}>✍️ Clear, legible <strong>Handwritten Notes</strong>.</li>
          <li style={bonusListItemStyle}>📅 Materials from the <strong>Latest Semester</strong>.</li>
          <li style={bonusListItemStyle}>✨ <strong>High Quality</strong>, high-resolution scans.</li>
          <li style={bonusListItemStyle}>📂 <strong>Well Organized</strong>, structured documents.</li>
        </ul>
      </Section>

      <Heading style={subHeadingStyle}>🏆 Monthly Leaderboard Mentorship Session</Heading>
      <Text style={paragraphStyle}>
        Every contribution gets you closer to the top! The <strong>Top 3 contributors</strong> of the month earn an exclusive <strong>1:1 mentorship session</strong> with placed seniors.
      </Text>
      
      <Text style={paragraphStyle}>
        <strong>Mentorship includes:</strong>
      </Text>
      <ul style={listStyle}>
        <li style={listItemStyle}>🚀 Placement roadmap & prep guidance</li>
        <li style={listItemStyle}>📝 Resume suggestions & reviews</li>
        <li style={listItemStyle}>💼 Mock interview prep & tips</li>
        <li style={listItemStyle}>🎓 Academic and career direction advice</li>
      </ul>

      <div style={buttonContainerStyle}>
        <Button href="{{uploadUrl}}" style={buttonStyle}>
          Upload More Resources
        </Button>
      </div>

      <StatsBlock />
      
      <Footer />
    </Layout>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '10px 0 16px 0',
  lineHeight: '1.3',
};

const subHeadingStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '24px 0 10px 0',
  lineHeight: '1.4',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
};

const statusCardStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fef3c7',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '24px 0',
  textAlign: 'center',
};

const statusLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#b45309',
  letterSpacing: '0.05em',
  margin: '0 0 4px 0',
  textTransform: 'uppercase',
};

const statusTextStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#d97706',
  margin: '0',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '20px 0',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflow: 'hidden',
};

const tdLabelStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#374151',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  width: '35%',
};

const tdValueStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '13px',
  color: '#4b5563',
  borderBottom: '1px solid #e5e7eb',
};

const listStyle: React.CSSProperties = {
  paddingLeft: '20px',
  margin: '0 0 24px 0',
};

const listItemStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.6',
  marginBottom: '8px',
};

const bonusSectionStyle: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '20px',
  margin: '28px 0',
};

const bonusHeadingStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 8px 0',
};

const bonusParagraphStyle: React.CSSProperties = {
  fontSize: '13.5px',
  color: '#4b5563',
  margin: '0 0 12px 0',
};

const bonusListStyle: React.CSSProperties = {
  paddingLeft: '20px',
  margin: '0',
};

const bonusListItemStyle: React.CSSProperties = {
  fontSize: '13.5px',
  color: '#4b5563',
  lineHeight: '1.6',
  marginBottom: '6px',
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '32px 0',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 28px',
};
