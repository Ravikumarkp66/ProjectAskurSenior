import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ThumbsUp, 
  Bookmark, 
  Copy, 
  CheckCircle, 
  Quote, 
  MessageSquare, 
  Terminal, 
  AlertCircle,
  Edit3,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { interviewExperiencesAPI } from '../../services/api';

const ExperienceCard = ({ data: initialData, isLightMode }) => {
  const { user, token } = useAuthContext();
  const [data, setData] = useState(initialData);
  const [isOpen, setIsOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(data.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    overview: Array.isArray(data.overview) ? [...data.overview] : data.overview,
    questions: [...data.questions],
    roundNumber: data.roundNumber // Fix: Ensure we tell backend which round to update
  });
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.isAdmin;

  const handleCopy = (e) => {
    e.stopPropagation();
    const overviewText = Array.isArray(data.overview) ? data.overview.join('\n') : data.overview;
    const text = `${data.experienceId}\n\nOVERVIEW:\n${overviewText}\n\nQUESTIONS:\n${data.questions.join('\n')}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!hasUpvoted) {
      setUpvoteCount(prev => prev + 1);
      setHasUpvoted(true);
      try {
        await interviewExperiencesAPI.upvoteExperience(data._id);
      } catch (error) {
        console.error('Failed to upvote:', error);
      }
    } else {
      setUpvoteCount(prev => prev - 1);
      setHasUpvoted(false);
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsOpen(true);
    setIsEditing(true);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedData({
      overview: Array.isArray(data.overview) ? [...data.overview] : data.overview,
      questions: [...data.questions],
      roundNumber: data.roundNumber
    });
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      const response = await interviewExperiencesAPI.updateExperience(data._id, editedData);
      const updated = response.data;
      
      // After save, update data state with the specific round data from updated object
      const updatedRound = updated.rounds.find(r => r.roundNumber === data.roundNumber);
      if (updatedRound) {
        setData(prev => ({
          ...prev,
          overview: updatedRound.notes || updatedRound.overview,
          questions: updatedRound.questions.map(q => typeof q === 'string' ? { text: q, solveLink: '' } : q)
        }));
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Update Error:', error);
      alert('Failed to save changes: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    setEditedData(prev => ({
      ...prev,
      questions: [...prev.questions, { text: '', solveLink: '' }]
    }));
  };

  const removeQuestion = (index) => {
    setEditedData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...editedData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setEditedData(prev => ({ ...prev, questions: newQuestions }));
  };

  return (
    <motion.div 
      layout
      className={`rounded-[2.5rem] border transition-all duration-500 overflow-hidden cursor-pointer group ${
        isLightMode 
          ? `bg-white border-slate-200 shadow-xl shadow-slate-200/50 ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50/50'}` 
          : `bg-[#111827] border-white/5 shadow-2xl shadow-black/40 ${isOpen ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02] hover:border-purple-500/20'}`
      } ${isOpen ? 'ring-2 ring-purple-500/10' : ''}`}
      onClick={() => !isEditing && setIsOpen(!isOpen)}
    >
      {/* Header Container */}
      <div className="px-6 md:px-10 py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Quote size={14} />
              </div>
              <h3 className={`text-lg font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                {data.experienceId}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
                isLightMode ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/5 text-slate-500'
              }`}>
                  <Terminal size={12} className="opacity-50" />
                  Coding Problems: {isEditing ? editedData.questions.length : data.questions.length}
              </span>
              {data.role && (
                <span className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    {data.role}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-slate-500 mr-4">
                  {/* Admin Edit Controls */}
                  {isAdmin && (
                    <>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/40"
                          >
                            {isSaving ? 'Saving...' : <><Save size={14} /> Save</>}
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={handleStartEdit}
                          className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-purple-400 hover:border-purple-500/20 transition-all group/edit"
                          title="Edit Experience"
                        >
                          <Edit3 size={14} className="group-hover/edit:scale-110 transition-transform" />
                        </button>
                      )}
                    </>
                  )}

                  {!isEditing && (
                    <>
                      <button 
                        onClick={handleUpvote}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                          hasUpvoted ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-lg shadow-purple-900/10' : 'bg-white/5 border-white/5 hover:border-purple-500/30'
                        }`}
                      >
                        <ThumbsUp size={14} fill={hasUpvoted ? "currentColor" : "none"} />
                        <span className="text-[10px] font-black">{upvoteCount}</span>
                      </button>
                      
                      <button 
                        onClick={handleBookmark}
                        className={`p-1.5 rounded-xl border transition-all ${
                          isBookmarked ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-white/5 border-white/5 hover:border-purple-500/30'
                        }`}
                      >
                        <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
                      </button>
                      
                      <button 
                        onClick={handleCopy}
                        className={`p-1.5 rounded-xl border transition-all ${
                          isCopied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
                        }`}
                      >
                        {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      </button>
                    </>
                  )}
              </div>

              {!isEditing && (
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  className={isLightMode ? 'text-slate-400' : 'text-slate-600 group-hover:text-purple-400 transition-colors'}
                >
                  <ChevronDown size={20} strokeWidth={3} />
                </motion.div>
              )}
          </div>
        </div>

        {/* Improved Collapsed Preview */}
        {!isOpen && !isEditing && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500 line-clamp-2 mt-8 font-medium leading-relaxed"
            >
                {Array.isArray(data.overview) 
                  ? (typeof data.overview[0] === 'string' ? data.overview[0] : '') 
                  : (typeof data.overview === 'string' ? data.overview : '')}
            </motion.p>
        )}

        {/* Expanded Content Area with Rich Layout */}
        <AnimatePresence>
            {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden"
            >
                <div className="pt-8 md:pt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    {/* Overview Column */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={16} className="text-purple-500 opacity-50" />
                                <h4 className={`text-[11px] font-black uppercase tracking-[0.25em] ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Detailed Overview
                                </h4>
                            </div>
                        </div>

                        {isEditing ? (
                          <textarea 
                            value={Array.isArray(editedData.overview) ? editedData.overview.join('\n') : editedData.overview}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedData(prev => ({ 
                                ...prev, 
                                overview: val.includes('\n') ? val.split('\n').filter(p => p.trim()) : val 
                              }));
                            }}
                            className="w-full h-80 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white font-medium outline-none focus:border-purple-500/50 transition-colors custom-scrollbar"
                            placeholder="Enter overview points (one per line)..."
                          />
                        ) : (
                          <div className={`text-[15px] leading-[1.8] font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'} whitespace-pre-line`}>
                            {Array.isArray(data.overview) ? (
                              <ul className="space-y-4">
                                {data.overview.map((point, idx) => (
                                  <li key={idx} className="flex gap-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 italic">
                                  {typeof data.overview === 'string' ? data.overview : 'No overview provided'}
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Questions Column */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Terminal size={16} className="text-purple-500 opacity-50" />
                                <h4 className={`text-[11px] font-black uppercase tracking-[0.25em] ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Interview Questions
                                </h4>
                            </div>
                            {isEditing && (
                              <button 
                                onClick={addQuestion}
                                className="flex items-center gap-2 text-[9px] font-black text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-colors"
                              >
                                <Plus size={12} /> Add Question
                              </button>
                            )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-6">
                            {editedData.questions.map((q, idx) => (
                              <div key={idx} className="relative group/qi p-6 border border-white/5 bg-white/[0.02] rounded-3xl space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question {idx + 1}</span>
                                  <button 
                                    onClick={() => removeQuestion(idx)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <textarea 
                                  value={q.text || ''}
                                  onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white font-medium outline-none focus:border-purple-500/50 transition-colors h-24"
                                  placeholder="What was the question?"
                                />
                                <div className="relative">
                                  <input 
                                    type="text"
                                    value={q.solveLink || ''}
                                    onChange={(e) => updateQuestion(idx, 'solveLink', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 px-4 pl-10 text-xs text-purple-300 font-bold outline-none focus:border-purple-500/50 transition-colors"
                                    placeholder="Paste Solve link (LeetCode, GFG, etc.)"
                                  />
                                  <Plus size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {data.questions && data.questions.length > 0 ? (
                            <div className="space-y-4">
                                {data.questions.map((q, idx) => (
                                <motion.div 
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  key={idx} 
                                  onClick={(e) => e.stopPropagation()}
                                  className={`p-6 rounded-3xl border transition-all duration-300 ${
                                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#1F2937]/50 border-white/5 text-slate-200'
                                  } group/q hover:scale-[1.02] hover:-translate-y-1`}
                                >
                                    <div className="flex flex-col gap-4">
                                      <div className="flex gap-4">
                                        <span className="text-purple-500 font-black opacity-30 select-none">Q{idx + 1}</span>
                                        <p className="flex-1">
                                          {(() => {
                                            if (typeof q === 'string') return q;
                                            if (q && q.text) return q.text;
                                            // Fallback: If data is corrupted as numerical keys (e.g., from a mis-spread string)
                                            const parts = Object.keys(q || {})
                                              .filter(k => !isNaN(k))
                                              .sort((a, b) => Number(a) - Number(b))
                                              .map(k => q[k]);
                                            return parts.length > 0 ? parts.join('') : '';
                                          })()}
                                        </p>
                                      </div>
                                      
                                      {/* Solve Problem Button */}
                                      {q.solveLink && (
                                        <a 
                                          href={q.solveLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-3 self-center sm:self-end px-5 py-2.5 rounded-full border border-purple-500/50 bg-purple-500/5 text-purple-400 text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-lg shadow-purple-900/10"
                                        >
                                          Solve Problem
                                          {/* TUF Official Logo Icon from S3 - Optimized Visibility */}
                                          <div className="flex items-center bg-[#0a0a0b] h-7 sm:h-8 px-2 rounded-full border border-white/20 group-hover:border-white/40 transition-all overflow-hidden shrink-0">
                                            <img 
                                              src="https://auction-platform-kp.s3.ap-south-1.amazonaws.com/creator-section/takeuforward-icon-filled-256.png" 
                                              alt="TUF" 
                                              className="h-full w-auto object-contain scale-125"
                                            />
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                </motion.div>
                                ))}
                            </div>
                            ) : (
                            <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <AlertCircle size={20} className="text-slate-700" />
                                </div>
                                <p className="text-xs italic text-slate-600">No questions provided for this round.</p>
                            </div>
                            )}
                          </>
                        )}
                    </div>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ExperienceCard;
