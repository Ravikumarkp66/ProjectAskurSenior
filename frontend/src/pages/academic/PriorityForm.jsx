import React from 'react';

const PriorityForm = ({ priority, setPriority }) => {
  const options = [
    {
      id: 'attendance',
      title: 'Improve Attendance',
      desc: 'Get reminders for low attendance subjects first.',
      icon: '📈'
    },
    {
      id: 'marks',
      title: 'Focus on Marks',
      desc: 'Prioritize exam countdowns and study reminders.',
      icon: '🎯'
    },
    {
      id: 'balanced',
      title: 'Balanced',
      desc: 'A mix of attendance, tasks, and exam updates.',
      icon: '⚖️'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">What is your Priority?</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose how your assistant should prioritize your notifications.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => setPriority(opt.id)}
            className={`cursor-pointer p-6 rounded-2xl border-2 transition-all ${
              priority === opt.id
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-100 dark:shadow-none'
                : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{opt.icon}</span>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">{opt.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{opt.desc}</p>
              </div>
              <div className="ml-auto">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  priority === opt.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                }`}>
                  {priority === opt.id && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriorityForm;
