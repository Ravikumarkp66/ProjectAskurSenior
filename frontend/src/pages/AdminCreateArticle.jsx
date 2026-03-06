import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Plus, Trash } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import { articleAPI } from '../services/articleAPI';
import { useAuth } from '../utils/hooks';

const AdminCreateArticle = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        author: user?.name || '',
        coverImage: '',
        content: '',
        quiz: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContentChange = (content) => {
        setFormData({ ...formData, content });
    };

    const addQuizQuestion = () => {
        setFormData({
            ...formData,
            quiz: [...formData.quiz, { question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }]
        });
    };

    const updateQuizQuestion = (index, field, value, optionIndex = null) => {
        const newQuiz = [...formData.quiz];
        if (field === 'options' && optionIndex !== null) {
            newQuiz[index].options[optionIndex] = value;
        } else {
            newQuiz[index][field] = value;
        }
        setFormData({ ...formData, quiz: newQuiz });
    };

    const removeQuizQuestion = (index) => {
        const newQuiz = formData.quiz.filter((_, i) => i !== index);
        setFormData({ ...formData, quiz: newQuiz });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            setError('Title and content are required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await articleAPI.createArticle(formData);
            setSuccess('Article published successfully!');
            setTimeout(() => navigate('/blog'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create article');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 bg-slate-900 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-3xl font-bold text-white">Write New Article</h1>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save size={18} />
                    {loading ? 'Publishing...' : 'Publish'}
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-4 rounded-lg mb-6">
                    {success}
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Article Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Article Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                                placeholder="e.g., How to Pay College Fees"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Author Name *</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                                placeholder="Author Name"
                                required
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <ImageIcon size={16} /> Cover Image URL
                            </label>
                            <input
                                type="url"
                                name="coverImage"
                                value={formData.coverImage}
                                onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.coverImage && (
                                <div className="mt-4 h-48 w-full md:w-1/2 rounded-lg overflow-hidden border border-slate-700">
                                    <img src={formData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-xl border border-slate-700">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-xl">
                        <h2 className="text-xl font-semibold text-white">Article Content *</h2>
                    </div>
                    <div className="p-0">
                        <RichTextEditor
                            content={formData.content}
                            onChange={handleContentChange}
                        />
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Interactive Quiz (Optional)</h2>
                        <button
                            type="button"
                            onClick={addQuizQuestion}
                            className="flex items-center gap-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                            <Plus size={16} />
                            Add Question
                        </button>
                    </div>

                    {formData.quiz.length > 0 ? (
                        <div className="space-y-6">
                            {formData.quiz.map((q, qIndex) => (
                                <div key={qIndex} className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-white font-medium">Question {qIndex + 1}</h3>
                                        <button
                                            type="button"
                                            onClick={() => removeQuizQuestion(qIndex)}
                                            className="text-red-400 hover:text-red-300 p-1"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={q.question}
                                            onChange={(e) => updateQuizQuestion(qIndex, 'question', e.target.value)}
                                            placeholder="Enter the question here"
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.options.map((opt, optIndex) => (
                                                <input
                                                    key={optIndex}
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateQuizQuestion(qIndex, 'options', e.target.value, optIndex)}
                                                    placeholder={`Option ${optIndex + 1}`}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                />
                                            ))}
                                        </div>

                                        <div className="pt-2">
                                            <label className="text-sm text-slate-400 block mb-2">Select Correct Answer</label>
                                            <select
                                                value={q.correctAnswer}
                                                onChange={(e) => updateQuizQuestion(qIndex, 'correctAnswer', e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                            >
                                                <option value="">-- Choose correct option --</option>
                                                {q.options.map((opt, optIndex) => (
                                                    opt ? <option key={optIndex} value={opt}>{opt}</option> : null
                                                ))}
                                            </select>
                                        </div>

                                        <div className="pt-2">
                                            <label className="text-sm text-slate-400 block mb-2">Explanation (Optional)</label>
                                            <textarea
                                                value={q.explanation || ''}
                                                onChange={(e) => updateQuizQuestion(qIndex, 'explanation', e.target.value)}
                                                placeholder="Explain why this answer is correct..."
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">No quiz questions added. Click the button above to add an optional quiz to test student knowledge.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCreateArticle;
