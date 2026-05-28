import React, { useEffect } from 'react';
import { BRANCHES, deriveBranchFromUSN, toUiBranch } from '../../utils/constants';
import { useAuth } from '../../utils/hooks';

const SetupStep1 = ({ formData, setFormData }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!formData.branch && user) {
      const derived = deriveBranchFromUSN(user.usn) || toUiBranch(user.currentBranch) || 'CS';
      setFormData(prev => ({ ...prev, branch: derived }));
    }
    // Also default phone if user has one
    if (!formData.phone && user?.phone) {
      setFormData(prev => ({ ...prev, phone: user.phone }));
    }
  }, [user, setFormData, formData.branch, formData.phone]);

  const [isEditingPhone, setIsEditingPhone] = React.useState(!formData.phone);

  // Extract digits only for the input field
  const displayPhone = formData.phone?.replace('+91', '') || '';

  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: digits ? `+91${digits}` : '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-400">Let's start with your academic and contact details.</p>
      </div>
      
      {/* Branch Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Your Branch</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BRANCHES.filter(b => b.code !== 'ALL').map((branch) => (
            <button
              key={branch.code}
              type="button"
              onClick={() => setFormData({ ...formData, branch: branch.code })}
              className={`p-3 text-sm text-center rounded-xl border-2 transition-all duration-200 ${
                formData.branch === branch.code
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'border-gray-100 dark:border-gray-700 hover:border-indigo-400 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="font-bold">{branch.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Semester Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Current Semester</label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setFormData({ ...formData, semester: sem })}
              className={`p-3 text-center rounded-xl border-2 transition-all duration-200 ${
                parseInt(formData.semester) === sem
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'border-gray-100 dark:border-gray-700 hover:border-indigo-400 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="font-bold">{sem}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Phone Number & WhatsApp */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">WhatsApp Phone Number</label>
          
          <div className="flex items-center gap-3">
            {isEditingPhone ? (
              <div className="flex-1 flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <span className="pl-4 pr-2 py-3 text-gray-400 dark:text-gray-500 font-bold border-r border-gray-100 dark:border-gray-700">+91</span>
                <input
                  type="tel"
                  placeholder="10 digit number"
                  value={displayPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full px-3 py-3 bg-transparent text-gray-900 dark:text-white outline-none"
                  autoFocus
                />
                {formData.phone?.length === 13 && (
                   <button 
                    onClick={() => setIsEditingPhone(false)}
                    className="pr-4 text-emerald-500 hover:text-emerald-600"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                   </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between px-4 py-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <span className="font-bold text-gray-800 dark:text-white">{formData.phone}</span>
                <button 
                  onClick={() => setIsEditingPhone(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 underline"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-500 italic">This number will be used for your daily academic assistant updates.</p>
        </div>

        <label className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.whatsappEnabled || false}
            onChange={(e) => setFormData({ ...formData, whatsappEnabled: e.target.checked })}
            className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <div>
            <span className="block font-bold text-gray-800 dark:text-white">Enable WhatsApp Notifications</span>
            <span className="block text-xs text-gray-500">Receive daily morning & night academic updates.</span>
          </div>
        </label>
      </div>
      {/* Attendance Threshold */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Target Attendance Threshold</label>
          <p className="text-[10px] text-gray-500 italic mt-0.5">Set the minimum percentage you want to maintain before the dashboard alerts you.</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            max="100"
            value={formData.attendanceThreshold || 85}
            onChange={(e) => setFormData({ ...formData, attendanceThreshold: parseInt(e.target.value) || 0 })}
            className="w-24 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center font-bold text-xl text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-xl font-bold text-gray-400">%</span>
        </div>

        {/* Live Preview */}
        <div className="mt-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Dashboard Zone Preview</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs font-bold text-red-700 dark:text-red-400">Red Zone</span>
              </div>
              <p className="text-[10px] text-red-600/80 dark:text-red-400/80">
                Below {formData.attendanceThreshold || 85}%
              </p>
            </div>
            
            <div className="flex-1 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Yellow Zone</span>
              </div>
              <p className="text-[10px] text-yellow-600/80 dark:text-yellow-400/80">
                Above {formData.attendanceThreshold || 85}%, but missing ONE class will drop you into Red.
              </p>
            </div>

            <div className="flex-1 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Green Zone</span>
              </div>
              <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                Safe. Missing one class keeps you above {formData.attendanceThreshold || 85}%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupStep1;
