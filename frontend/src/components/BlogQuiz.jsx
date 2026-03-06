import React, { useState } from 'react';
import { ChevronRight, CheckCircle, XCircle, Calculator, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const BlogQuiz = ({ quizData }) => {
    // Limit to max 10 questions (as requested)
    const questions = quizData.slice(0, 10);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    if (!questions || questions.length === 0) return null;

    const currentQuestion = questions[currentIndex];

    // Progress calculation
    const progress = Math.round((currentIndex / questions.length) * 100);

    const handleOptionSelect = (option) => {
        if (selectedOption) return; // Prevent changing answer

        setSelectedOption(option);
        setShowExplanation(true);

        if (option === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setIsFinished(true);
        }
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setScore(0);
        setIsFinished(false);
        setShowExplanation(false);
    };

    // Calculate performance message
    const getPerformanceMessage = () => {
        const percentage = (score / questions.length) * 100;
        if (percentage === 100) return "Perfect Score! You're a pro!";
        if (percentage >= 80) return "You understand the concepts well.";
        if (percentage >= 50) return "Good effort! A quick review might help solidify the concepts.";
        return "You might want to read through the guide once more.";
    };

    if (isFinished) {
        return (
            <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-[20px] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="text-center relative z-10">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm font-bold tracking-wider uppercase mb-4 border border-purple-500/20">
                        Quiz Completed
                    </span>
                    <h3 className="text-3xl font-extrabold text-white mb-2">
                        🎉 Your Score: <span className="text-purple-400">{score} / {questions.length}</span>
                    </h3>
                    <p className="text-slate-300 text-lg mb-8 max-w-md mx-auto">
                        {getPerformanceMessage()}
                    </p>

                    <div className="bg-[#141416] border border-white/5 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                        <h4 className="text-white font-bold mb-3 flex items-center justify-center gap-2">
                            <Calculator size={18} className="text-purple-400" />
                            Recommended Next Step:
                        </h4>
                        <p className="text-sm text-slate-400 mb-6">
                            Put your knowledge into action. Try the CIE Analyzer to calculate your marks instantly!
                        </p>
                        <Link
                            to="/calculator"
                            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-1 active:translate-y-0"
                        >
                            Open CIE Analyzer
                        </Link>
                    </div>

                    <button
                        onClick={resetQuiz}
                        className="text-slate-400 hover:text-white flex items-center gap-2 mx-auto font-medium transition-colors"
                    >
                        <RefreshCcw size={16} /> Retake Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-[20px] p-6 shadow-2xl relative">
            {/* Header & Progress */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        Question {currentIndex + 1} / {questions.length}
                    </span>
                    <span className="text-sm font-bold text-slate-500">
                        {progress}%
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-[#1a1a1a] h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Area */}
            <div className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {currentQuestion.question}
                </h3>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
                {currentQuestion.options.filter(opt => opt && opt.trim() !== '').map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === currentQuestion.correctAnswer;

                    let buttonStyles = "bg-[#1a1a1a] border-[#2a2a2a] text-slate-300 hover:bg-[#222] hover:border-[#333]";
                    let icon = null;

                    if (selectedOption) {
                        if (isCorrect) {
                            buttonStyles = "bg-green-900/20 border-green-500/50 text-white shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                            icon = <CheckCircle size={20} className="text-green-500" />;
                        } else if (isSelected) {
                            buttonStyles = "bg-red-900/20 border-red-500/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                            icon = <XCircle size={20} className="text-red-500" />;
                        } else {
                            buttonStyles = "bg-[#141414] border-[#1f1f1f] text-slate-600 opacity-50 cursor-not-allowed";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(option)}
                            disabled={!!selectedOption}
                            className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 flex justify-between items-center gap-4 ${buttonStyles} ${!selectedOption && 'transform hover:-translate-y-1'}`}
                        >
                            <span className="font-semibold">{option}</span>
                            {icon && <span className="flex-shrink-0 animate-in zoom-in">{icon}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Explanation Area */}
            {showExplanation && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8 border border-white/10 rounded-xl p-5 bg-[#141416]">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {selectedOption === currentQuestion.correctAnswer ? (
                            <span className="text-green-400 flex items-center gap-2">✅ Correct Answer!</span>
                        ) : (
                            <span className="text-red-400 flex items-center gap-2">❌ Incorrect.</span>
                        )}
                    </h4>

                    {currentQuestion.explanation ? (
                        <div className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-3">
                            <span className="font-bold text-white mr-2">Explanation:</span>
                            {currentQuestion.explanation}
                        </div>
                    ) : (
                        <div className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-3">
                            <span className="font-bold text-white mr-2">Correct Answer:</span>
                            {currentQuestion.correctAnswer}
                        </div>
                    )}
                </div>
            )}

            {/* Next Button */}
            {selectedOption && (
                <div className="flex justify-end animate-in fade-in">
                    <button
                        onClick={handleNext}
                        className="bg-white text-[#0a0a0b] font-bold py-3 px-8 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 group"
                    >
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default BlogQuiz;
