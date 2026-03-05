import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, ThumbsUp, ThumbsDown, Eye, Hash, Calculator, ExternalLink, BookOpen, ChevronRight, Menu, X } from 'lucide-react';
import { articleAPI } from '../services/articleAPI';
import ArticleContent from '../components/ArticleContent';
import CommentSection from '../components/CommentSection';
import { useAuth } from '../utils/hooks';

const ArticlePage = () => {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();
    const [loadingReaction, setLoadingReaction] = useState(false);
    const [reactionType, setReactionType] = useState(null);
    const [toc, setToc] = useState([]);
    const [processedContent, setProcessedContent] = useState('');
    const [mobileTocOpen, setMobileTocOpen] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const data = await articleAPI.getArticleBySlug(slug);
                setArticle(data);

                if (data.content) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data.content, 'text/html');
                    const headings = doc.querySelectorAll('h2, h3');
                    const tocItems = [];

                    headings.forEach((h, index) => {
                        const id = `heading-${index}`;
                        h.id = id;
                        tocItems.push({
                            id,
                            text: h.textContent,
                            level: h.tagName.toLowerCase()
                        });
                    });

                    setToc(tocItems);
                    setProcessedContent(doc.body.innerHTML);
                }

                // Fetch reaction status if logged in
                if (isAuthenticated) {
                    try {
                        const reaction = await articleAPI.getReactionStatus(data._id);
                        setReactionType(reaction.type);
                    } catch (err) {
                        console.error('Failed to load reaction status', err);
                    }
                }
            } catch (err) {
                console.error('Failed to load article', err);
                setError('Article not found');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
        window.scrollTo(0, 0);
    }, [slug, isAuthenticated]);

    const readTime = useMemo(() => {
        if (!article?.content) return '2 min';
        const words = article.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const time = Math.ceil(words / 200);
        return `${time} min`;
    }, [article]);

    const handleReaction = async (type) => {
        if (!isAuthenticated) return;

        const previousReaction = reactionType;
        const previousArticle = { ...article };

        // --- Optimistic Update ---
        let newReactionType = type;
        let newLikes = article.likesCount;
        let newDislikes = article.dislikesCount;

        if (reactionType === type) {
            // Removing current reaction
            newReactionType = null;
            if (type === 'like') newLikes--;
            else newDislikes--;
        } else if (reactionType) {
            // Changing reaction
            if (type === 'like') { newLikes++; newDislikes--; }
            else { newDislikes++; newLikes--; }
        } else {
            // New reaction
            if (type === 'like') newLikes++;
            else newDislikes++;
        }

        // Apply immediately
        setReactionType(newReactionType);
        setArticle(prev => ({ ...prev, likesCount: Math.max(0, newLikes), dislikesCount: Math.max(0, newDislikes) }));

        try {
            const result = await articleAPI.reactToArticle(article._id, type);
            // Sync with actual data from server anyway
            setArticle(prev => ({
                ...prev,
                likesCount: result.likesCount,
                dislikesCount: result.dislikesCount
            }));
            setReactionType(result.type);
        } catch (err) {
            console.error('Reaction failed', err);
            // Rollback on failure
            setReactionType(previousReaction);
            setArticle(previousArticle);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-[#0a0a0b] justify-center items-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="flex h-screen bg-[#0a0a0b] justify-center items-center px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
                    <Link to="/blog" className="inline-block bg-purple-600 px-6 py-3 rounded-xl text-white font-bold hover:bg-purple-700 transition-colors">
                        Return to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const { title, author, coverImage, createdAt, views, likesCount, dislikesCount } = article;

    const date = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-[#0a0a0b] font-outfit text-white overflow-x-hidden">
            <div className="border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="font-medium hidden sm:inline">Back</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-4 flex-1 justify-center px-8">
                        <span className="text-slate-200 text-sm font-semibold truncate max-w-[400px]">{title}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileTocOpen(true)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white"
                        >
                            <Menu size={20} />
                        </button>
                        <Link to="/blog" className="text-purple-400 hover:text-purple-300 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                            All Guides
                        </Link>
                    </div>
                </div>
            </div>

            {mobileTocOpen && (
                <div className="fixed inset-0 z-[100] bg-[#0a0a0b]/95 backdrop-blur-sm lg:hidden">
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-bold text-white">Contents</h3>
                            <button onClick={() => setMobileTocOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
                        </div>
                        <nav className="flex-1 space-y-4 overflow-y-auto">
                            {toc.map((item) => (
                                <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={() => setMobileTocOpen(false)}
                                    className={`block text-lg ${item.level === 'h2'
                                        ? 'text-slate-200 font-bold'
                                        : 'text-slate-400 pl-4 border-l border-white/10'
                                        }`}
                                >
                                    {item.text}
                                </a>
                            ))}
                        </nav>
                        <div className="pt-8 border-t border-white/5 mt-auto">
                            <Link to="/calculator" onClick={() => setMobileTocOpen(false)} className="flex items-center justify-between p-4 rounded-2xl bg-purple-600 text-white font-bold mb-4">
                                <div className="flex items-center gap-3">
                                    <Calculator size={20} />
                                    <span>Open CIE Analyzer</span>
                                </div>
                                <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    <aside className="hidden lg:block lg:col-span-3 sticky top-28 self-start h-[calc(100vh-120px)] overflow-y-auto no-scrollbar pr-4">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Hash size={14} />
                                    On this page
                                </h3>
                                <nav className="space-y-1">
                                    {toc.length > 0 ? toc.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className={`block py-2 text-sm transition-all duration-200 border-l-2 border-transparent hover:border-purple-500/50 ${item.level === 'h2'
                                                ? 'text-slate-300 font-bold hover:text-white pl-0'
                                                : 'text-slate-500 hover:text-white pl-4'
                                                }`}
                                        >
                                            {item.text}
                                        </a>
                                    )) : (
                                        <p className="text-slate-600 text-sm italic">Brief article sections</p>
                                    )}
                                </nav>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <BookOpen size={14} />
                                    Related Tools
                                </h3>
                                <div className="space-y-3">
                                    <Link to="/calculator" className="group flex items-center justify-between p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Calculator size={18} className="text-purple-400" />
                                            <span className="text-sm font-bold text-slate-200">CIE/SGPA Calc</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="lg:col-span-9 w-full max-w-3xl mx-auto lg:mx-0">
                        <header className="mb-10 lg:mb-12">
                            <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-6">
                                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wider uppercase">
                                    Academic Guide
                                </span>
                                <span className="text-slate-500 text-sm hidden sm:inline">•</span>
                                <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                                    <Clock size={14} /> {readTime} read
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-8 font-outfit">
                                {title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-slate-400 pb-8 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300">
                                        <User size={20} />
                                    </div>
                                    <span className="text-slate-200 font-bold">{author}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-purple-500" />
                                    <span className="text-sm sm:text-base">{date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye size={16} className="text-slate-500" />
                                    <span className="text-sm sm:text-base">{views.toLocaleString()} visits</span>
                                </div>
                            </div>
                        </header>

                        {coverImage && (
                            <div className="rounded-2xl lg:rounded-3xl overflow-hidden mb-12 lg:mb-16 shadow-2xl border border-white/5 bg-[#141416]/50 p-1 lg:p-1.5">
                                <img src={coverImage} alt={title} className="w-full h-auto object-cover max-h-[400px] lg:max-h-[500px] rounded-xl lg:rounded-[1.4rem]" />
                            </div>
                        )}

                        <div className="mb-12 lg:mb-16 p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-purple-900/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative z-10 text-center md:text-left text-white">
                                <h3 className="text-xl font-extrabold mb-2">Analyze your CIE marks?</h3>
                                <p className="text-purple-200/70 text-sm font-medium">Use our SIT Academic Analyzer instantly.</p>
                            </div>
                            <Link to="/calculator" className="relative z-10 bg-white text-[#0a0a0b] px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black flex items-center gap-3 hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                                <Calculator size={20} />
                                Open CIE Analyzer
                            </Link>
                        </div>

                        <article className="article-wrapper">
                            <ArticleContent content={processedContent || article.content} />
                        </article>

                        <div className="mt-16 lg:mt-20 py-10 lg:py-12 border-t border-white/5">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 text-white">
                                <div className="text-center md:text-left">
                                    <h3 className="text-2xl font-extrabold mb-2">Was this helpful?</h3>
                                    <p className="text-slate-400 font-medium">
                                        <span className="text-purple-400 font-bold">{likesCount} students</span> found this guide useful
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <button
                                        onClick={() => handleReaction('like')}
                                        className={`flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${reactionType === 'like'
                                            ? 'bg-purple-600 border-purple-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-purple-500/50 hover:bg-purple-500/5'
                                            }`}
                                    >
                                        <ThumbsUp size={20} className={reactionType === 'like' ? 'fill-current' : ''} />
                                        <span className="font-bold">{likesCount}</span>
                                    </button>
                                    <button
                                        onClick={() => handleReaction('dislike')}
                                        className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${reactionType === 'dislike'
                                            ? 'bg-red-600 border-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-red-500/50'
                                            }`}
                                    >
                                        <ThumbsDown size={20} className={reactionType === 'dislike' ? 'fill-current' : ''} />
                                        <span className="font-bold">{dislikesCount}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#141416]/50 rounded-[1.5rem] lg:rounded-[2.5rem] p-6 md:p-12 border border-white/5">
                                <CommentSection articleId={article._id} />
                            </div>
                        </div>

                        <div className="mt-16 lg:mt-20">
                            <h3 className="text-2xl font-extrabold text-white mb-8">Related Guides</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                <div className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141416] border border-white/5 hover:border-purple-500/30 transition-all group cursor-pointer text-white">
                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 block">Strategy</span>
                                    <h4 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">Score 40+ in CIE Consistently</h4>
                                    <p className="text-slate-500 text-sm mb-4">Learn the secret habits of toppers...</p>
                                    <div className="flex items-center text-purple-400 font-bold text-sm gap-2">
                                        Read Guide <ChevronRight size={16} />
                                    </div>
                                </div>
                                <div className="p-6 lg:p-8 rounded-2xl lg:rounded-3xl bg-[#141416] border border-white/5 hover:border-blue-500/30 transition-all group cursor-pointer text-white">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 block">Exams</span>
                                    <h4 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">VTU SEE Marks Decoded</h4>
                                    <p className="text-slate-500 text-sm mb-4">Understanding semester weightage...</p>
                                    <div className="flex items-center text-blue-400 font-bold text-sm gap-2">
                                        Read Guide <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ArticlePage;
