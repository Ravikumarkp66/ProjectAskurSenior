import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { interviewExperiencesAPI } from '../../services/api';
import { 
    ChevronLeft, 
    Plus, 
    Trash2, 
    Save, 
    Building2, 
    Briefcase, 
    Type, 
    Calendar,
    CircleDollarSign,
    Target
} from 'lucide-react';

const ShareExperience = () => {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [theme] = useState(() => localStorage.getItem('uiTheme') || 'dark');
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        companyId: '',
        role: 'SDE',
        ctc: '',
        selected: true,
        difficulty: 'Medium',
        year: new Date().getFullYear(),
        overallExperience: '',
        rounds: [
            { roundNumber: 1, type: 'OA', questions: [''], description: '' }
        ]
    });

    useEffect(() => {
        const fetchCompanies = async () => {
            const res = await interviewExperiencesAPI.getCompanies();
            setCompanies(res.data);
        };
        fetchCompanies();
    }, []);

    const handleRoundChange = (index, field, value) => {
        const newRounds = [...form.rounds];
        newRounds[index][field] = value;
        setForm({ ...form, rounds: newRounds });
    };

    const handleQuestionChange = (roundIndex, qIndex, value) => {
        const newRounds = [...form.rounds];
        newRounds[roundIndex].questions[qIndex] = value;
        setForm({ ...form, rounds: newRounds });
    };

    const addQuestion = (roundIndex) => {
        const newRounds = [...form.rounds];
        newRounds[roundIndex].questions.push('');
        setForm({ ...form, rounds: newRounds });
    };

    const addRound = () => {
        setForm({
            ...form,
            rounds: [
                ...form.rounds,
                { roundNumber: form.rounds.length + 1, type: 'Technical', questions: [''], description: '' }
            ]
        });
    };

    const removeRound = (index) => {
        if (form.rounds.length === 1) return;
        const newRounds = form.rounds.filter((_, i) => i !== index).map((r, i) => ({ ...r, roundNumber: i + 1 }));
        setForm({ ...form, rounds: newRounds });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.companyId) return alert('Please select a company');
        setSubmitting(true);
        try {
            await interviewExperiencesAPI.createExperience({
                ...form,
                roundsCount: form.rounds.length
            });
            alert('Experience shared successfully!');
            navigate('/interview');

        } catch (error) {
            console.error('Error sharing experience:', error);
            alert('Failed to share experience');
        } finally {
            setSubmitting(false);
        }
    };

    const isLightMode = theme === 'light';

    return (
        <div className="max-w-4xl mx-auto w-full">
            <Link 
                to="/interview"
                className="flex items-center gap-2 text-slate-500 hover:text-purple-500 transition-colors font-bold mb-6 text-sm group"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Cancel
            </Link>

            <div className="mb-10">
                <h1 className={`text-4xl font-black mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Share <span className="text-purple-500">Experience</span></h1>
                <p className="text-slate-500 font-medium font-outfit">Contribute to the SIT community by sharing your interview journey.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Company & Role Information */}
                <div className={`p-8 rounded-3xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10 shadow-2xl shadow-black/40'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <Building2 className="text-purple-500" />
                        <h3 className="font-bold text-xl uppercase tracking-tight">Basic Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Company Name</label>
                            <select 
                                required
                                value={form.companyId}
                                onChange={(e) => setForm({...form, companyId: e.target.value})}
                                className={`w-full p-4 rounded-2xl border outline-none transition-all ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0b] border-white/10 focus:border-purple-500'}`}
                            >
                                <option value="">Select Company</option>
                                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Role Type</label>
                            <div className="flex gap-2">
                                {['SDE', 'Intern'].map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setForm({...form, role})}
                                        className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${
                                            form.role === role 
                                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg' 
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">CTC (LPA)</label>
                            <div className="relative">
                                <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input 
                                    type="number" 
                                    required
                                    placeholder="Ex: 12"
                                    value={form.ctc}
                                    onChange={(e) => setForm({...form, ctc: e.target.value})}
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0b] border-white/10 focus:border-purple-500'}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Did you get selected?</label>
                            <div className="flex gap-2">
                                {[
                                    { label: 'Yes', value: true },
                                    { label: 'No', value: false }
                                ].map(opt => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => setForm({...form, selected: opt.value})}
                                        className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${
                                            form.selected === opt.value 
                                            ? (opt.value ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white')
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                        } shadow-lg shadow-black/10`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Difficulty</label>
                            <select 
                                required
                                value={form.difficulty}
                                onChange={(e) => setForm({...form, difficulty: e.target.value})}
                                className={`w-full p-4 rounded-2xl border outline-none transition-all ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0b] border-white/10 focus:border-purple-500'}`}
                            >
                                {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Placement Year</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input 
                                    type="number" 
                                    required
                                    value={form.year}
                                    onChange={(e) => setForm({...form, year: e.target.value})}
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0b] border-white/10 focus:border-purple-500'}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rounds Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Target className="text-purple-500" />
                            <h3 className="font-bold text-xl uppercase tracking-tight">Interview Rounds</h3>
                        </div>
                        <button 
                            type="button"
                            onClick={addRound}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20 hover:bg-purple-500/20 transition-all text-xs uppercase tracking-widest"
                        >
                            <Plus size={16} /> Add Round
                        </button>
                    </div>

                    {form.rounds.map((round, rIndex) => (
                        <div key={rIndex} className={`p-8 rounded-3xl border animate-in slide-in-from-right-4 duration-300 relative ${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10 shadow-2xl shadow-black/40'}`}>
                            <button 
                                type="button"
                                onClick={() => removeRound(rIndex)}
                                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="mb-6 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black">
                                    {rIndex + 1}
                                </div>
                                <h4 className="font-bold text-lg uppercase tracking-tight">Round {rIndex + 1}</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Round Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['OA', 'Technical', 'HR'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => handleRoundChange(rIndex, 'type', type)}
                                                className={`px-6 py-2 rounded-xl font-bold text-xs transition-all border ${
                                                    round.type === type 
                                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Questions Asked</label>
                                <div className="space-y-3">
                                    {round.questions.map((q, qIndex) => (
                                        <div key={qIndex} className="relative">
                                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input 
                                                type="text"
                                                placeholder={`Question ${qIndex + 1}...`}
                                                value={q}
                                                onChange={(e) => handleQuestionChange(rIndex, qIndex, e.target.value)}
                                                className={`w-full pl-12 pr-4 py-4 rounded-2xl border outline-none transition-all text-sm ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0b] border-white/10 focus:border-purple-500'}`}
                                            />
                                        </div>
                                    ))}
                                    <button 
                                        type="button"
                                        onClick={() => addQuestion(rIndex)}
                                        className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1.5 ml-2 uppercase tracking-widest"
                                    >
                                        <Plus size={14} /> Add another question
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Description / Details</label>
                                <textarea 
                                    placeholder="What was the process? Any specific tips for this round?"
                                    value={round.description}
                                    onChange={(e) => handleRoundChange(rIndex, 'description', e.target.value)}
                                    rows={3}
                                    className={`w-full p-6 rounded-2xl border outline-none transition-all text-sm resize-none ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0b] border-white/10 focus:border-purple-500'}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overall Experience */}
                <div className={`p-8 rounded-3xl border ${isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10 shadow-2xl shadow-black/40'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <Briefcase className="text-purple-500" />
                        <h3 className="font-bold text-xl uppercase tracking-tight">Final Thoughts</h3>
                    </div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Overall Feedback & Pro-Tips</label>
                    <textarea 
                        required
                        placeholder="Summarize your overall experience, preparation strategy, and advice for juniors..."
                        value={form.overallExperience}
                        onChange={(e) => setForm({...form, overallExperience: e.target.value})}
                        rows={4}
                        className={`w-full p-6 rounded-3xl border outline-none transition-all text-sm resize-none ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0a0b] border-white/10 focus:border-purple-500'}`}
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-6 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xl shadow-2xl shadow-purple-900/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tighter`}
                >
                    {submitting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Save size={24} />
                    )}
                    Share Experience
                </button>
            </form>
        </div>
    );
};

export default ShareExperience;
