import LegalLayout from "../components/LegalLayout";

const TermsPage = () => {
  return (
    <LegalLayout title="Terms & Conditions">
      <h2 className="text-xl font-medium">Platform Purpose</h2>
      <p>
        This platform provides organized academic resources, AI tools,
        personalized roadmaps, coding practice IDE, and placement guidance
        strictly for educational purposes.
      </p>
      <h2 className="text-xl font-medium">Payment & Access</h2>
      <p>
        Users are paying for access to platform features, infrastructure,
        hosting, cloud storage, AI systems, maintenance, and continuous
        improvements — not for ownership of individual third-party documents.
      </p>
      <h2 className="text-xl font-medium">Copyright</h2>
      <p>
        We do not claim ownership of third-party academic materials. If you
        believe any content violates your copyright, contact us at
        your@email.com and we will review promptly.
      </p>
      <h2 className="text-xl font-medium">No Refund Policy</h2>
      <p>
        This is a digital-access platform. All payments are final once access
        is granted.
      </p>
    </LegalLayout>
  );
};

export default TermsPage;
