import LegalLayout from "../components/LegalLayout";

const PrivacyPage = () => {
  return (
    <LegalLayout title="Privacy Policy">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">1. Data We Collect</h2>
        <p>
          We only collect essential information such as your USN, email, and basic profile details to provide a personalized experience. Password data is securely encrypted using industry-standard hashing.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">2. How We Use Data</h2>
        <p>
          Your information is used solely for authentication, personalizing your academic tools (like GPA calculators and roadmaps), and for analytics to improve platform quality. We do not sell or trade your personal data.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">3. Security</h2>
        <p>
          We use modern security practices to protect your information including SSL/TLS encryption for all data transmissions and secure cloud infrastructure. If you have any privacy concerns, contact us at <span className="text-blue-600 font-bold">askursenior66@gmail.com</span>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">4. Third Parties</h2>
        <p>
          We use trusted services like Google for authentication and Onrender/Vercel for hosting. These services may collect basic telemetry as part of their standard operation.
        </p>
      </section>

      <section className="space-y-4 text-xs text-gray-400 italic mt-10">
        <p>Last modified: March 01, 2026</p>
      </section>
    </LegalLayout>
  );
};

export default PrivacyPage;
