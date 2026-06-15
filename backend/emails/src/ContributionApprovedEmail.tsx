import { Text, Heading, Button, Section } from '@react-email/components';
import React from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import Footer from './components/Footer';
import StatsBlock from './components/StatsBlock';

export function ContributionApprovedEmail() {
  return (
    <Layout previewText="Your Contribution Has Been Approved 🎉 Thank you for helping out!">
      <Header />
      
      <Heading style={headingStyle}>Your Contribution Has Been Approved! 🎉</Heading>
      
      <Text style={paragraphStyle}>
        Hi there,
      </Text>
      
      <Text style={paragraphStyle}>
        Awesome news! Our admin team has reviewed and approved your study material contribution. It is now live on AskUrSenior for all your peers to access.
      </Text>

      <Section style={successBannerStyle}>
        <Text style={successTextStyle}>✅ Contribution Approved</Text>
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
            <td style={tdLabelStyle}>Semester</td>
            <td style={tdValueStyle}>{"{{semester}}"}</td>
          </tr>
          <tr>
            <td style={tdLabelStyle} style={{ ...tdLabelStyle, borderBottom: 'none' }}>Points Earned</td>
            <td style={tdValuePointsStyle} style={{ ...tdValuePointsStyle, borderBottom: 'none' }}>+{"{{points}}"} Points</td>
          </tr>
        </tbody>
      </table>

      <Heading style={subHeadingStyle}>Community Impact 📊</Heading>
      <Text style={paragraphStyle} style={{ ...paragraphStyle, fontStyle: 'italic', color: '#1f2937', paddingLeft: '12px', borderLeft: '3px solid #2563eb' }}>
        "Your contribution is now helping students prepare smarter and learn faster. A single uploaded resource can help hundreds of students across multiple semesters."
      </Text>

      <Heading style={subHeadingStyle}>🏆 Monthly Leaderboard Reminder</Heading>
      <Text style={paragraphStyle}>
        Your contribution points have been added to your profile! Remember, the <strong>Top 3 contributors</strong> every month receive:
      </Text>
      <ul style={listStyle}>
        <li style={listItemStyle}>🥇 <strong>1:1 mentorship session</strong> with placed seniors.</li>
        <li style={listItemStyle}>💼 <strong>Career guidance</strong> and placement roadmap advice.</li>
        <li style={listItemStyle}>📝 <strong>Resume & interview prep</strong> feedback.</li>
        <li style={listItemStyle}>🤝 <strong>Direct interaction</strong> and networking opportunities.</li>
      </ul>

      <Heading style={subHeadingStyle}>Contribute Again 📤</Heading>
      <Text style={paragraphStyle}>
        Keep the momentum going! If you have any more materials, upload them now to secure your spot on this month's leaderboard:
      </Text>
      <ul style={listStyle}>
        <li style={listItemStyle}>📚 Clear Handwritten Lecture Notes</li>
        <li style={listItemStyle}>📝 Previous Year Question Papers (PYQs)</li>
        <li style={listItemStyle}>📋 Internal Exam Question Papers (CIEs)</li>
        <li style={listItemStyle}>🎯 Placement prep sheets & interview experiences</li>
      </ul>

      <div style={buttonContainerStyle}>
        <Button href="{{uploadUrl}}" style={buttonStyle}>
          Contribute Again
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

const successBannerStyle: React.CSSProperties = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #d1fae5',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '24px 0',
  textAlign: 'center',
};

const successTextStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#059669',
  margin: '0',
  letterSpacing: '-0.01em',
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

const tdValuePointsStyle: React.CSSProperties = {
  padding: '12px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#10b981',
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
