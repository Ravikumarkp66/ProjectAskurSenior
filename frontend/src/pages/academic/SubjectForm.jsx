import React, { useState } from 'react';
import { PREFILLED_CURRICULUM } from '../../data/curriculum';
import { apiClient } from '../../services/api';

const SUBJECT_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

const SubjectForm = ({ subjects, setSubjects, branch, semester }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleFetchCurriculum = async () => {
    try {
      // 1. Fetch branches to find the branch matching the shortName
      const branchesRes = await apiClient.get('/lookups/branches');
      const branchesList = branchesRes.data || [];
      const matchedBranch = branchesList.find(
        (b) => b.shortName.toUpperCase() === branch.toUpperCase()
      );

      if (!matchedBranch) {
        throw new Error(`Branch ${branch} not found in database.`);
      }

      // 2. Fetch semesters to find the semester matching the number
      const semestersRes = await apiClient.get('/lookups/semesters');
      const semestersList = semestersRes.data || [];
      const matchedSemester = semestersList.find(
        (s) => s.number === Number(semester) && s.program?.toString() === matchedBranch.program?._id?.toString()
      ) || semestersList.find((s) => s.number === Number(semester));

      if (!matchedSemester) {
        throw new Error(`Semester ${semester} not found in database.`);
      }

      // 3. Fetch subjects using the branchId and semesterId
      const subjectsRes = await apiClient.get('/cms/subjects', {
        params: {
          branchId: matchedBranch._id,
          semesterId: matchedSemester._id,
        },
      });

      const dbSubjects = subjectsRes.data || [];

      if (dbSubjects.length > 0) {
        const curriculumSubjects = dbSubjects.map((s, idx) => ({
          subjectName: s.name,
          totalClasses: 0,
          attendedClasses: 0,
          lastUpdatedDate: '',
          internal01: '',
          internal02: '',
          quiz01: '',
          quiz02: '',
          abl01: '',
          abl02: '',
          color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
        }));
        setSubjects(curriculumSubjects);
      } else {
        // Fallback to local hardcoded PREFILLED_CURRICULUM if DB has nothing
        const branchData = PREFILLED_CURRICULUM[branch];
        if (branchData && branchData[semester]) {
          const curriculumSubjects = branchData[semester].map((s, idx) => ({
            subjectName: s.name,
            totalClasses: 0,
            attendedClasses: 0,
            lastUpdatedDate: '',
            internal01: '',
            internal02: '',
            quiz01: '',
            quiz02: '',
            abl01: '',
            abl02: '',
            color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
          }));
          setSubjects(curriculumSubjects);
        } else {
          alert(`No subjects found in database or local curriculum for ${branch} Semester ${semester}. You can add subjects manually.`);
        }
      }
    } catch (e) {
      console.warn('CMS curriculum fetch failed/skipped, falling back to local curriculum:', e.message);
      // Fallback on error
      const branchData = PREFILLED_CURRICULUM[branch];
      if (branchData && branchData[semester]) {
        const curriculumSubjects = branchData[semester].map((s, idx) => ({
          subjectName: s.name,
          totalClasses: 0,
          attendedClasses: 0,
          lastUpdatedDate: '',
          internal01: '',
          internal02: '',
          quiz01: '',
          quiz02: '',
          abl01: '',
          abl02: '',
          color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length]
        }));
        setSubjects(curriculumSubjects);
      } else {
        alert('Failed to fetch subjects from server and no local fallback curriculum was found.');
      }
    }
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { 
      subjectName: '', 
      totalClasses: 0, 
      attendedClasses: 0, 
      lastUpdatedDate: '',
      internal01: '',
      internal02: '',
      quiz01: '',
      quiz02: '',
      abl01: '',
      abl02: '',
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]
    }]);
  };

  const handleRemoveSubject = (index) => {
    const updated = subjects.filter((_, i) => i !== index);
    setSubjects(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = subjects.map((s, i) => {
      if (i !== index) return s;
      const updatedSubject = { ...s, [field]: value };
      
      // Consistency Check (Case 7): attended <= total
      if (field === 'attendedClasses' || field === 'totalClasses') {
        const attended = field === 'attendedClasses' ? value : updatedSubject.attendedClasses;
        const total = field === 'totalClasses' ? value : updatedSubject.totalClasses;
        
        if (attended > total && total > 0) {
          updatedSubject.attendedClasses = total;
        }
      }
      return updatedSubject;
    });
    setSubjects(updated);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Subjects</h2>
          <p className="text-gray-600 dark:text-gray-400">Add the subjects and set important dates like internals and quizzes.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleFetchCurriculum}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg border border-indigo-200 transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Fetch from Curriculum</span>
          </button>
          <button
            type="button"
            onClick={handleAddSubject}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <span>+ Add Subject</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {subjects.map((subject, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-all">
            <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Subject Name</label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: subject.color }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={subject.subjectName}
                    onChange={(e) => handleChange(index, 'subjectName', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total</label>
                <input
                  type="number"
                  placeholder="0"
                  value={subject.totalClasses}
                  onChange={(e) => handleChange(index, 'totalClasses', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Attended</label>
                <input
                  type="number"
                  placeholder="0"
                  value={subject.attendedClasses}
                  onChange={(e) => handleChange(index, 'attendedClasses', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-4 flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5" title="Date of the last class accounted for in the Total/Attended numbers above">Last Updated Date</label>
                  <input
                    type="date"
                    value={subject.lastUpdatedDate ? subject.lastUpdatedDate.split('T')[0] : ''}
                    onChange={(e) => handleChange(index, 'lastUpdatedDate', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className={`mt-6 p-2 rounded-xl transition-all ${expandedIndex === index ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}
                >
                  <svg className={`w-5 h-5 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSubject(index)}
                  className="mt-6 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Content: Events & Colors */}
            {expandedIndex === index && (
              <div className="px-4 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/20 animate-slideDown">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Internals */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Internals</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-1">Internal 01</label>
                        <input
                          type="date"
                          value={subject.internal01 ? subject.internal01.split('T')[0] : ''}
                          onChange={(e) => handleChange(index, 'internal01', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-1">Internal 02</label>
                        <input
                          type="date"
                          value={subject.internal02 ? subject.internal02.split('T')[0] : ''}
                          onChange={(e) => handleChange(index, 'internal02', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quizzes & ABL */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Quizzes & ABL</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-1">Quiz 01</label>
                        <input
                          type="date"
                          value={subject.quiz01 ? subject.quiz01.split('T')[0] : ''}
                          onChange={(e) => handleChange(index, 'quiz01', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-1">Quiz 02</label>
                        <input
                          type="date"
                          value={subject.quiz02 ? subject.quiz02.split('T')[0] : ''}
                          onChange={(e) => handleChange(index, 'quiz02', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-1">ABL Activity 01</label>
                        <input
                          type="date"
                          value={subject.abl01 ? subject.abl01.split('T')[0] : ''}
                          onChange={(e) => handleChange(index, 'abl01', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-500 mb-1">ABL Activity 02</label>
                        <input
                          type="date"
                          value={subject.abl02 ? subject.abl02.split('T')[0] : ''}
                          onChange={(e) => handleChange(index, 'abl02', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500">Subject Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => handleChange(index, 'color', color)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${subject.color === color ? 'border-indigo-500 scale-125 shadow-md' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-gray-800/20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📚</div>
          <p className="text-gray-500 font-medium">No subjects added yet. Start by fetching your curriculum!</p>
        </div>
      )}
    </div>
  );
};

export default SubjectForm;
