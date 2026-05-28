import React from 'react';

const CatchUpStep = ({ subjects, setSubjects, onModeSelect }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-4 text-3xl">
          ⏰
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Looks like your semester already started!</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mt-2">
          Don't worry, let's get your current status updated so your tracking remains accurate.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => onModeSelect('manual')}
          className="p-6 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/30 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
            📝
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-1">Enter Attendance Manually</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the number of classes conducted and attended for each subject till today.
          </p>
        </button>

        <button
          onClick={() => onModeSelect('fresh')}
          className="p-6 rounded-3xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/30 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
            🚀
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white mb-1">Start Tracking from Today</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start with 0% attendance and track everything from this moment onwards.
          </p>
        </button>
      </div>
    </div>
  );
};

export default CatchUpStep;
