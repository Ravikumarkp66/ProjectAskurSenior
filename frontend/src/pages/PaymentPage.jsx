import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { paymentAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

const PaymentPage = ({ user }) => {
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  const isSubscribed = user?.subscription === 'askplus' && (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) > new Date());

  useEffect(() => {
    const checkStatus = async () => {
      if (user?._id || user?.id) {
        try {
          const res = await paymentAPI.getLatestPayment(user._id || user.id);
          setPaymentInfo(res.data);
        } catch (e) {
          console.error("Error checking payment status", e);
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };
    checkStatus();
  }, [user]);

  const upiLink = `upi://pay?pa=askursenior@slc&pn=AskUrSenior&am=29.00&cu=INR&tn=ASKPLUS_${user?.usn || "USER"}&mc=0000`;

  const handleSubmit = async () => {
    if (!utr.trim()) {
      alert("Please enter a UTR number.");
      return;
    }

    if (utr.length !== 12) {
      alert("UTR number must be exactly 12 digits long.");
      return;
    }

    try {
      setLoading(true);

      await paymentAPI.submitUtr({
        userId: user.id || user._id,
        studentId: user?.usn,
        utrNumber: utr
      });

      setSubmitted(true);

    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center">
          <h2 className="text-3xl font-bold text-green-600 mb-2">
            Payment Submitted ✅
          </h2>
          <p className="mt-2 text-gray-600 text-lg">
            Awaiting admin verification
          </p>
          <p className="text-sm text-gray-500 mt-2">
            (Your ASK+ will be activated within 6 hours)
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-8 bg-blue-600 text-white font-semibold w-full py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>

          <p className="mt-4 text-[10px] text-[#5865F2] font-bold uppercase tracking-wider">
            ⚡ For Instant Approval: Join Discord from the Profile Section!
          </p>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-vh-100 bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSubscribed || paymentInfo?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center">
          <div className="text-5xl mb-4">
            {isSubscribed ? "💎" : "⏳"}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isSubscribed ? "ASK+ Already Active!" : "Verification in Progress"}
          </h2>
          <p className="mt-2 text-gray-600">
            {isSubscribed
              ? "Your premium subscription is already active. Enjoy full access to all resources!"
              : "We've received your payment request. Our team is verifying the UTR right now."}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            {isSubscribed
              ? `Valid till: ${new Date(user.subscriptionExpiry).toLocaleDateString()}`
              : "Usually takes less than 6 hours."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-8 bg-blue-600 text-white font-semibold w-full py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
          >
            Back to Dashboard
          </button>

          <p className="mt-4 text-[10px] text-[#5865F2] font-bold uppercase tracking-wider">
            ⚡ For Instant Approval: Join Discord from the Profile Section!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6 py-12">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl grid md:grid-cols-2 overflow-hidden">

        {/* LEFT SIDE */}
        <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">

          <button
            onClick={() => navigate("/subscription")}
            className="text-sm opacity-80 hover:opacity-100 mb-6 flex items-center gap-1"
          >
            ← Back to Subscription
          </button>

          <h2 className="text-3xl font-bold">
            Upgrade to ASK+
          </h2>

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

          <div className="mt-10 bg-white/20 p-4 rounded-xl text-sm">
            🚀 Razorpay automatic payments coming soon.
            Manual UPI activation within 6 hours.
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="p-10 flex flex-col justify-center items-center text-center">

          <p className="text-gray-600 mb-4 font-medium">
            Step 1: Scan & Pay ₹29
          </p>

          <div className="bg-gray-100 p-6 rounded-2xl shadow-inner inline-block">
            <QRCode value={upiLink} size={200} />
          </div>

          <p className="mt-4 text-sm text-gray-700">
            UPI ID: <strong>askursenior@slc</strong>
          </p>

          <p className="mt-8 text-gray-600 font-medium">
            Step 2: Enter your 12-digit UTR
          </p>

          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            placeholder="Enter 12-digit UTR number"
            value={utr}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setUtr(val);
            }}
            className="mt-3 w-full max-w-sm border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:border-blue-500 focus:ring-blue-100 outline-none text-center font-mono text-lg tracking-widest transition shadow-sm"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 w-full max-w-sm bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit & Activate"}
          </button>

          <p className="mt-4 text-xs text-gray-500 text-center">
            🔒 Secure manual verification <br />
            ⏳ Activation within 6 hours
          </p>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Already paid but forgot to enter UTR? <br />
            You can submit it later from your dashboard.
          </p>

          <div className="mt-6 w-full max-w-sm p-4 rounded-2xl bg-[#5865F2]/5 border border-[#5865F2]/10">
            <p className="text-[10px] text-[#5865F2] font-black uppercase tracking-widest text-center">
              ⚡ For instant approval from admin: <br />
              Connect Discord from the Profile Section!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
