import React from 'react';

const CollegeTimingForm = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">College Timings</h2>
        <p className="text-gray-600 dark:text-gray-400">Define your college day to generate a smart timetable.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Working Hours */}
        <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 space-y-4">
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <span className="text-xl">⏰</span> Working Hours
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Start Time</label>
              <input
                type="time"
                name="collegeStartTime"
                value={formData.collegeStartTime || '09:00'}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">End Time</label>
              <input
                type="time"
                name="collegeEndTime"
                value={formData.collegeEndTime || '17:00'}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Class Duration (Minutes)</label>
            <input
              type="number"
              name="classDuration"
              value={formData.classDuration || 60}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Lunch Break */}
        <div className="p-6 bg-orange-50/30 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-900/20 space-y-4">
          <h3 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
            <span className="text-xl">🍱</span> Lunch Interval
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Start</label>
              <input
                type="time"
                name="lunchStartTime"
                value={formData.lunchStartTime || '13:00'}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">End</label>
              <input
                type="time"
                name="lunchEndTime"
                value={formData.lunchEndTime || '14:00'}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Short Break */}
        <div className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 space-y-4 md:col-span-2">
          <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="text-xl">☕</span> Short Break
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Start</label>
              <input
                type="time"
                name="breakStartTime"
                value={formData.breakStartTime || '11:00'}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">End</label>
              <input
                type="time"
                name="breakEndTime"
                value={formData.breakEndTime || '11:15'}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeTimingForm;
