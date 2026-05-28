import React from 'react';

const SetupStep2 = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Important Dates</h2>
      <p className="text-gray-600 dark:text-gray-400">Set your academic calendar for notifications.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">College Start Date</label>
          <input
            type="date"
            name="collegeStartDate"
            value={formData.collegeStartDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Working Day</label>
          <input
            type="date"
            name="lastWorkingDay"
            value={formData.lastWorkingDay}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Exam Start Date <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
          <input
            type="date"
            name="examStartDate"
            value={formData.examStartDate}
            onChange={handleChange}
            min={formData.lastWorkingDay}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Exam End Date <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
          <input
            type="date"
            name="examEndDate"
            value={formData.examEndDate}
            onChange={handleChange}
            min={formData.examStartDate}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default SetupStep2;
