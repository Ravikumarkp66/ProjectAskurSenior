import LegalLayout from "../components/LegalLayout";

const PrivacyPage = () => {
  return (
    <LegalLayout title="Privacy Policy">
      <h2 className="text-xl font-medium">Data Collection</h2>
      <p>
        We collect only essential information required for platform access and personalized experience. No unnecessary data is stored.
      </p>
      <h2 className="text-xl font-medium">Data Usage</h2>
      <p>
        Your data is used strictly for platform functionality, analytics, and improvements. We do not sell or share your data with third parties.
      </p>
      <h2 className="text-xl font-medium">Security</h2>
      <p>
        We use industry-standard security practices to protect your information. If you have concerns, contact us at your@email.com.
      </p>
      <h2 className="text-xl font-medium">Cookies</h2>
      <p>
        Cookies are used only for authentication and session management. You can disable cookies, but some features may not work.
      </p>
    </LegalLayout>
  );
};

export default PrivacyPage;
