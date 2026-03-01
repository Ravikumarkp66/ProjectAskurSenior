import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TermsModal from "./TermsModal";
import PrivacyModal from "./PrivacyModal";

const PricingSection = ({ user }) => {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6 py-12">

      <h1 className="text-4xl font-bold text-center text-white mb-12">
        Everything You Need To Succeed In College 🎓
      </h1>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl w-full">

        {/* FREE PLAN */}
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-lg hover:scale-105 transition duration-300">
          <h2 className="text-xl font-semibold text-white">Free Plan</h2>
          <p className="text-5xl font-bold text-white mt-4">₹0</p>

          <ul className="mt-8 space-y-3 text-sm">
            <li className="text-emerald-400">✔ Limited Notes Access</li>
            <li className="text-emerald-400">✔ Limited PYQs (Recent Year Only)</li>
            <li className="text-emerald-400">✔ Basic CGPA / SGPA Calculator</li>
            <li className="text-emerald-400">✔ Discord Community Access</li>

            <li className="text-red-400 mt-6 pt-2 border-t border-white/10">✖ Full Notes (All Subjects)</li>
            <li className="text-red-400">✖ Complete PYQs Archive</li>
            <li className="text-red-400">✖ Subject-Wise Practice Quizzes</li>
            <li className="text-red-400">✖ Smart CIE Predictor</li>
            <li className="text-red-400">✖ Eligibility Status Checker</li>
            <li className="text-red-400">✖ Downloadable Reports & Analytics</li>
            <li className="text-red-400">✖ Smart Attendance Tracker</li>
          </ul>

          <button className="mt-8 w-full border border-white/30 text-white py-2 rounded-xl hover:bg-white/10 transition">
            Current Plan
          </button>
        </div>


        {/* ASK+ PLAN */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-2xl text-white hover:scale-105 transition duration-300">
          <span className="absolute top-4 right-4 bg-white text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>

          <h2 className="text-xl font-semibold">🔥 ASK+ Plan</h2>
          <p className="text-5xl font-bold mt-4">
            ₹29 <span className="text-lg font-normal">/ month</span>
          </p>

          <p className="text-sm text-white/80 mt-3 mb-6 font-medium">
            Everything you need to track, predict, analyze and succeed academically.
          </p>

          <div className="space-y-6">

            <div>
              <h4 className="font-semibold text-white mb-2">📚 Academic Resources</h4>
              <ul className="space-y-2 text-white/90 text-sm">
                <li>✔ Full Notes Access</li>
                <li>✔ All PYQs</li>
                <li>✔ Question Banks</li>
                <li>✔ A2Z Important Sheet</li>
                <li className="flex items-center">
                  ✔ Subject-Wise Practice Quizzes (100+ MCQs for 1-Credit Subjects)
                  <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide">
                    Exclusive
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">📊 Smart Academic Tools</h4>
              <ul className="space-y-2 text-white/90 text-sm leading-relaxed">
                <li className="flex items-center">
                  ✔ Smart CIE Predictor
                  <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide">
                    Exclusive
                  </span>
                </li>
                <li>✔ Smart CGPA / SGPA Calculator</li>
                <li>✔ Eligibility Status Checker</li>
                <li>✔ Download Reports & Analytics</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">🚀 Upcoming</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-center">
                  ⏳ Interview Experiences of your seniors
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full ml-2">
                    Coming Soon
                  </span>
                </li>
                <li className="flex items-center mt-1">
                  ⏳ Smart Attendance Tracker
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full ml-2">
                    Coming Soon
                  </span>
                </li>
              </ul>
            </div>

          </div>

          <button
            onClick={() => navigate("/upgrade")}
            className="mt-8 w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-gray-100 transition"
          >
            Upgrade to ASK+
          </button>
        </div>

      </div>

      <div className="mt-16 w-full max-w-sm flex flex-col items-center gap-4 text-center">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full">
          <p className="font-bold text-red-400 text-[10px] uppercase tracking-widest mb-1">🚫 No Refund Policy</p>
          <p className="text-[10px] text-gray-400 leading-tight">
            As AskUrSenior provides immediate digital access to premium features upon activation, all payments are final and non-refundable.
          </p>
        </div>

        <div className="flex gap-6 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
          <button onClick={() => setShowTerms(true)} className="hover:text-white transition-colors">Terms</button>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-white transition-colors">Privacy</button>
          <a href="mailto:askursenior66@gmail.com" className="hover:text-white transition-colors">Support</a>
        </div>
      </div>

      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
      <PrivacyModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </div>
  );
};

export default PricingSection;
