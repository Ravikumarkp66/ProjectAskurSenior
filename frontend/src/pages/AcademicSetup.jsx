import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import SetupStep1 from './academic/SetupStep1';
import SetupStep2 from './academic/SetupStep2';
import CatchUpStep from './academic/CatchUpStep';
import SubjectForm from './academic/SubjectForm';
import TimetableForm from './academic/TimetableForm';
import CollegeTimingForm from './academic/CollegeTimingForm';
import academicAPI from '../services/academicService';

const AcademicSetup = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [catchUpMode, setCatchUpMode] = useState(null); // 'manual', 'fresh'
  
  const [formData, setFormData] = useState({
    semester: '',
    branch: '',
    collegeStartDate: '',
    lastWorkingDay: '',
    examStartDate: '',
    examEndDate: '',
    phone: '',
    whatsappEnabled: false,
    priority: 'balanced',
    collegeStartTime: '09:00',
    collegeEndTime: '17:00',
    classDuration: 60,
    lunchStartTime: '13:00',
    lunchEndTime: '14:00',
    breakStartTime: '11:00',
    breakEndTime: '11:15'
  });

  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState({
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: []
  });
  const [originalData, setOriginalData] = useState(null);

  // Detect if joining late
  const isLate = useMemo(() => {
    if (!formData.collegeStartDate) return false;
    const start = new Date(formData.collegeStartDate);
    const today = new Date();
    // Only late if more than 3 days have passed since start date
    return today > new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
  }, [formData.collegeStartDate]);

  const steps = useMemo(() => {
    const baseSteps = [
      { id: 1, label: 'Profile' },
      { id: 2, label: 'Dates' },
      { id: 3, label: 'Timings' },
      { id: 4, label: 'Subjects' },
      { id: 5, label: 'Schedule' }
    ];

    if (isLate) {
      const newSteps = [...baseSteps];
      newSteps.splice(4, 0, { id: 'catchup', label: 'Catch-up' });
      return newSteps.map((s, i) => ({ ...s, displayId: i + 1 }));
    }
    return baseSteps.map((s, i) => ({ ...s, displayId: i + 1 }));
  }, [isLate]);

  const currentStepLabel = steps[step - 1]?.label;

  const handleCatchUpModeSelect = (mode) => {
    setCatchUpMode(mode);
    if (mode === 'fresh') {
      // Zero out all subject attendance
      setSubjects(prev => prev.map(s => ({ ...s, totalClasses: 0, attendedClasses: 0 })));
    }
    setStep(step + 1);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await academicAPI.getDashboard();
        if (response.data) {
          setOriginalData(response.data);
          const { config, user, attendanceData, timetable: savedTimetable } = response.data;
          if (config) {
            setFormData(prev => ({
              ...prev,
              semester: config.semester || '',
              collegeStartDate: config.collegeStartDate ? config.collegeStartDate.split('T')[0] : '',
              lastWorkingDay: config.lastWorkingDay ? config.lastWorkingDay.split('T')[0] : '',
              examStartDate: config.examStartDate ? config.examStartDate.split('T')[0] : '',
              examEndDate: config.examEndDate ? config.examEndDate.split('T')[0] : '',
              collegeStartTime: config.collegeStartTime || '09:00',
              collegeEndTime: config.collegeEndTime || '17:00',
              classDuration: config.classDuration || 60,
              lunchStartTime: config.lunchStartTime || '13:00',
              lunchEndTime: config.lunchEndTime || '14:00',
              breakStartTime: config.breakStartTime || '11:00',
              breakEndTime: config.breakEndTime || '11:15'
            }));
          }
          if (user) {
            setFormData(prev => ({
              ...prev,
              phone: user.phone || '',
              whatsappEnabled: user.whatsappEnabled || false,
              priority: user.priority || 'balanced'
            }));
          }
          if (attendanceData) {
            setSubjects(attendanceData.map(s => ({
              subjectName: s.subjectName,
              attendedClasses: s.attendedClasses,
              totalClasses: s.totalClasses
            })));
          }
          if (savedTimetable) {
            setTimetable(savedTimetable);
          }
        }
      } catch (err) {
        console.log('No existing setup found');
      }
    };
    loadData();
  }, []);

  const handleReset = () => {
    if (!originalData) return;
    const { config, user, attendanceData, timetable: savedTimetable } = originalData;
    if (config) {
      setFormData(prev => ({
        ...prev,
        semester: config.semester || '',
        collegeStartDate: config.collegeStartDate ? config.collegeStartDate.split('T')[0] : '',
        lastWorkingDay: config.lastWorkingDay ? config.lastWorkingDay.split('T')[0] : '',
        examStartDate: config.examStartDate ? config.examStartDate.split('T')[0] : '',
        examEndDate: config.examEndDate ? config.examEndDate.split('T')[0] : '',
        collegeStartTime: config.collegeStartTime || '09:00',
        collegeEndTime: config.collegeEndTime || '17:00',
        classDuration: config.classDuration || 60,
        lunchStartTime: config.lunchStartTime || '13:00',
        lunchEndTime: config.lunchEndTime || '14:00',
        breakStartTime: config.breakStartTime || '11:00',
        breakEndTime: config.breakEndTime || '11:15'
      }));
    }
    if (user) {
      setFormData(prev => ({
        ...prev,
        phone: user.phone || '',
        whatsappEnabled: user.whatsappEnabled || false,
        priority: user.priority || 'balanced'
      }));
    }
    if (attendanceData) {
      setSubjects(attendanceData.map(s => ({
        subjectName: s.subjectName,
        attendedClasses: s.attendedClasses,
        totalClasses: s.totalClasses
      })));
    }
    if (savedTimetable) {
      setTimetable(savedTimetable);
    }
    alert('Restored to last saved version!');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.semester) return alert('Please select a semester');
      if (formData.whatsappEnabled && !formData.phone) return alert('Please enter your WhatsApp number');
    }
    if (currentStepLabel === 'Dates') {
      if (!formData.collegeStartDate || !formData.lastWorkingDay) return alert('Please fill academic dates');
    }
    if (currentStepLabel === 'Subjects' && subjects.length === 0) return alert('Please add subjects');
    
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const trackingStartDate = catchUpMode === 'fresh' ? new Date().toISOString() : formData.collegeStartDate;
      await academicAPI.saveSetup({ 
        ...formData, 
        trackingStartDate,
        catchUpMode: catchUpMode || 'none'
      });
      await academicAPI.saveSubjects(subjects);
      await academicAPI.saveTimetable(timetable);
      await academicAPI.finalizeSetup({
        phone: formData.phone,
        whatsappEnabled: formData.whatsappEnabled,
        priority: formData.priority,
        todos: []
      });
      
      alert('Academic setup completed successfully!');
      if (onClose) {
        onClose();
        // optionally refresh dashboard data? Actually, DashboardPage reloads on remount or we can pass a callback
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save academic setup');
    } finally {
      setLoading(false);
    }
  };

  const stepper = (
    <div className="flex items-center justify-between">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
              step >= i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {s.displayId}
            </div>
            <span className={`text-[10px] mt-2 font-medium ${step >= i + 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 rounded ${step > i + 1 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const formContent = (
      <>
        {onClose && (
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 text-gray-400">
            <X size={20} />
          </button>
        )}
        <div className="min-h-[400px]">
          {currentStepLabel === 'Profile' && <SetupStep1 formData={formData} setFormData={setFormData} />}
          {currentStepLabel === 'Dates' && <SetupStep2 formData={formData} setFormData={setFormData} />}
          {currentStepLabel === 'Timings' && <CollegeTimingForm formData={formData} setFormData={setFormData} />}
          {currentStepLabel === 'Subjects' && <SubjectForm subjects={subjects} setSubjects={setSubjects} branch={formData.branch} semester={formData.semester} />}
          {currentStepLabel === 'Catch-up' && <CatchUpStep subjects={subjects} setSubjects={setSubjects} onModeSelect={handleCatchUpModeSelect} />}
          {currentStepLabel === 'Schedule' && <TimetableForm timetable={timetable} setTimetable={setTimetable} subjects={subjects} config={formData} />}
        </div>

        <div className="mt-8 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-6">
          <div className="flex gap-4 items-center">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                step === 1 ? 'opacity-0 cursor-default' : 'text-gray-600 hover:text-indigo-600 dark:text-gray-400'
              }`}
            >
              Back
            </button>
            
            {originalData && !loading && (
              <button
                type="button"
                onClick={handleReset}
                className="text-orange-600 hover:text-orange-700 dark:text-orange-400 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-orange-100 dark:border-orange-900/30 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all"
              >
                Reset to Saved
              </button>
            )}
          </div>
          
          {step < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Finish Setup'}
            </button>
          )}
        </div>
      </>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 sm:p-6 sm:py-8 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-hidden">
        <div className="w-full max-w-4xl max-h-full flex flex-col">
          <div className="mb-8 flex-shrink-0">
            {stepper}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100 dark:border-gray-700 relative flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          {stepper}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-700 relative">
          {formContent}
        </div>
      </div>
    </div>
  );
};

export default AcademicSetup;
