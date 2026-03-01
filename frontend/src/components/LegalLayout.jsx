const LegalLayout = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold text-center mb-4">
          {title}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-10">
          Last Updated: {new Date().toLocaleDateString()}
        </p>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;
