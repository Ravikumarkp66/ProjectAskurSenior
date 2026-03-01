import LegalLayout from "../components/LegalLayout";

const TermsPage = () => {
  return (
    <LegalLayout title="Terms & Conditions">
      <section className="space-y-6">
        <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 mb-8">
          <span className="text-xs text-blue-500 font-bold uppercase tracking-widest">Last Updated: 03/01/2026</span>
        </div>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">1. Platform Purpose</h2>
          <p className="text-gray-600 leading-relaxed">
            AskUrSenior is an educational resource platform designed to organize and provide structured access to academic materials such as notes, previous year question papers (PYQs), question banks, and student-shared interview experiences.
          </p>
          <p className="text-gray-600 leading-relaxed font-medium bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
            The platform serves as a centralized collection system for educational materials intended strictly for personal academic use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">2. Nature of Service & Payment</h2>
          <p className="text-gray-600">By upgrading to ASK+ (Premium), users are paying for:</p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Platform infrastructure and technical maintenance</li>
            <li>Secure cloud hosting and storage</li>
            <li>Organized collection and structured access to academic materials</li>
            <li>Premium features genuinely provided within the platform</li>
          </ul>
          <p className="text-gray-600 mt-4 leading-relaxed font-semibold">
            Users are not purchasing ownership of any academic material.
          </p>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Payments are made strictly for:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Access to the curated collection</li>
              <li>Platform management and maintenance</li>
              <li>Continuous service improvements</li>
            </ul>
          </div>
          <p className="text-gray-600 mt-4">
            Interview experiences available on the platform are collected from students of the respective college. AskUrSenior acts solely as a structured collection and hosting platform for such submissions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">3. Premium Access Policy</h2>
          <ul className="list-none space-y-3 text-gray-600">
            <li className="flex gap-3"><span className="text-blue-500 font-bold">•</span> Premium access is provided based on the plan selected at the time of payment.</li>
            <li className="flex gap-3"><span className="text-blue-500 font-bold">•</span> Access duration, features, and pricing may be updated or modified as the platform evolves.</li>
            <li className="flex gap-3"><span className="text-blue-500 font-bold">•</span> Premium access grants usage rights within the platform only and does not transfer ownership of any content.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-red-600">4. No Refund Policy</h2>
          <div className="relative overflow-hidden bg-red-50 border border-red-200 p-8 rounded-2xl shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            <h3 className="text-red-700 font-black text-lg mb-4 uppercase tracking-tighter">Strict No Refund Policy</h3>
            <p className="text-red-700 leading-relaxed font-bold">
              As AskUrSenior provides immediate digital access to premium features and organized academic resources upon activation, all payments are final and non-refundable.
            </p>
            <p className="text-red-600 mt-4 text-sm font-medium">
              Once premium access is granted to an account, refund requests will not be entertained under any circumstances. Users are advised to review all details carefully before making a payment.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">5. Copyright & Content Disclaimer</h2>
          <div className="space-y-4 text-gray-600">
            <p>AskUrSenior does not claim ownership of third-party academic materials (including notes, PYQs, or interview experiences) submitted by students.</p>
            <p>We function as a hosting and organizing service for educational materials.</p>
            <p>If you are a copyright owner and believe your material has been used inappropriately, please contact our support team immediately for review.</p>
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-800">
              If any material is found to be non-genuine, misleading, or incorrectly represented, users are encouraged to report it to support for verification.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">6. Acceptable Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Use for educational purposes only', 'Not redistribute or resell materials', 'Not misuse platform access'].map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl text-sm font-medium text-slate-700 border border-slate-200/50">
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-red-500 font-bold mt-4">Violation of these terms may result in account suspension without refund.</p>
        </section>

        <section className="space-y-4 mt-12 bg-slate-900 text-white p-10 rounded-3xl shadow-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all duration-700" />
          <h2 className="text-2xl font-bold relative z-10">7. Support & Contact</h2>
          <p className="text-slate-300 relative z-10 opacity-80">We are committed to reviewing genuine concerns and taking appropriate action.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 relative z-10">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">Email Support</p>
              <p className="text-xl font-black text-blue-400 underline decoration-2 underline-offset-4">askursenior66@gmail.com</p>
            </div>
            <a href="mailto:askursenior66@gmail.com" className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black hover:scale-105 transition-transform active:scale-95 shadow-xl">
              Get Support
            </a>
          </div>
        </section>
      </section>
    </LegalLayout>
  );
};

export default TermsPage;
