import { Text, Heading, Button, Section } from '@react-email/components';
import React from 'react';
import Layout from './components/Layout';
import Header from './components/Header';
import Footer from './components/Footer';
import StatsBlock from './components/StatsBlock';

export function WelcomeEmail() {
  return (
    <Layout previewText="Welcome to AskUrSenior 🚀 Let's Build Something Bigger Together">
      <Header />
      
      <Heading style={headingStyle}>Welcome to AskUrSenior! 👋</Heading>
      
      <Text style={paragraphStyle}>
        Hi there <strong>{"{{name}}"}</strong>,
      </Text>
      
      <Text style={paragraphStyle}>
        We are thrilled to welcome you to <strong>AskUrSenior</strong>—the ultimate academic companion designed to make your college journey smoother, smarter, and highly collaborative.
      </Text>
      
      <Heading style={subHeadingStyle}>What is AskUrSenior? 📚</Heading>
      <Text style={paragraphStyle}>
        AskUrSenior is a student-led, community-driven repository where engineering students can access high-quality resources, notes, and guidance shared directly by seniors who have already cleared the path.
      </Text>
      
      <Heading style={subHeadingStyle}>Here's what you can explore: ✨</Heading>
      <ul style={listStyle}>
        <li style={listItemStyle}>📚 <strong>Notes & Study Materials:</strong> Structured, module-wise study sheets and resources.</li>
        <li style={listItemStyle}>📝 <strong>Previous Year Questions (PYQs):</strong> Genuine exam papers and question papers.</li>
        <li style={listItemStyle}>🎯 <strong>Placement Prep:</strong> Interview experiences and resources from placed seniors.</li>
        <li style={listItemStyle}>💬 <strong>Senior Guidance:</strong> Real-time advice, roadmaps, and support channels.</li>
        <li style={listItemStyle}>📈 <strong>Academic Insights:</strong> Grade calculators and performance trackers customized for SIT.</li>
        <li style={listItemStyle}>🏆 <strong>Community Contributions:</strong> Give back by sharing your own materials and earn rewards.</li>
      </ul>

      <Section style={emotionalSectionStyle}>
        <Text style={emotionalParagraphStyle}>
          <em>"We built AskUrSenior because students waste countless hours searching for notes, PYQs, interview experiences, and guidance that already exists somewhere with seniors."</em>
        </Text>
        <Text style={infoBoxTitleStyle}>Currently, AskUrSenior generates ₹0 revenue:</Text>
        <table width="100%" border={0} cellPadding={0} cellSpacing={4} style={checklistTableStyle}>
          <tbody>
            <tr>
              <td width="20" style={checkIconStyle}>❌</td>
              <td style={checkTextStyle}>No subscriptions.</td>
            </tr>
            <tr>
              <td style={checkIconStyle}>❌</td>
              <td style={checkTextStyle}>No advertisements.</td>
            </tr>
            <tr>
              <td style={checkIconStyle}>❌</td>
              <td style={checkTextStyle}>No hidden charges.</td>
            </tr>
          </tbody>
        </table>
        <Text style={emotionalParagraphStyle}>
          We are simply trying to help students access resources and guidance more easily. If the platform helps you, consider giving back by contributing resources for future batches.
        </Text>
      </Section>

      <div style={buttonContainerStyle}>
        <Button href="{{exploreUrl}}" style={buttonStyle}>
          Explore AskUrSenior
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

const listStyle: React.CSSProperties = {
  paddingLeft: '20px',
  margin: '0 0 24px 0',
};

const listItemStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.7',
  marginBottom: '8px',
};

const emotionalSectionStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #2563eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '28px 0',
};

const emotionalParagraphStyle: React.CSSProperties = {
  fontSize: '13.5px',
  lineHeight: '1.6',
  color: '#1e3a8a',
  margin: '0 0 12px 0',
};

const infoBoxTitleStyle: React.CSSProperties = {
  fontSize: '13.5px',
  fontWeight: 700,
  color: '#1e3a8a',
  margin: '16px 0 8px 0',
};

const checklistTableStyle: React.CSSProperties = {
  margin: '8px 0 16px 0',
};

const checkIconStyle: React.CSSProperties = {
  fontSize: '12px',
  verticalAlign: 'middle',
};

const checkTextStyle: React.CSSProperties = {
  fontSize: '13.5px',
  fontWeight: 600,
  color: '#1e3a8a',
  verticalAlign: 'middle',
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
