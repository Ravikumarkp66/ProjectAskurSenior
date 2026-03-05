import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { articleAPI } from '../services/articleAPI';
import ArticleContent from '../components/ArticleContent';
import CommentSection from '../components/CommentSection';
import { useAuth } from '../utils/hooks';

const ArticlePage = () => {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const [reactionType, setReactionType] = useState(null); // 'like', 'dislike', or null

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const data = await articleAPI.getArticleBySlug(slug);
                setArticle(data);
                // If we had a way to fetch the current user's reaction from the backend directly here, we could set it.
                // For simplicity, we just initialize it as null unless returned inside the article object.
            } catch (err) {
                console.error('Failed to load article', err);
                setError('Article not found');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug]);

    const handleReaction = async (type) => {
        if (!isAuthenticated) return; // Could show a toast telling them to login

        // Optimistic Update Let's not make it complex, just fire and update local state
        try {
            const result = await articleAPI.reactToArticle(article._id, type);

            setArticle(prev => {
                let newLikes = prev.likesCount;
                let newDislikes = prev.dislikesCount;

                if (result.message === 'Reaction removed') {
                    if (type === 'like') newLikes--;
                    else newDislikes--;
                } else if (result.message.startsWith('Changed')) {
                    if (type === 'like') { newLikes++; newDislikes--; }
                    else { newDislikes++; newLikes--; }
                } else {
                    // Added
                    if (type === 'like') newLikes++;
                    else newDislikes++;
                }

                return { ...prev, likesCount: newLikes, dislikesCount: newDislikes };
            });

            setReactionType(result.type);
        } catch (err) {
            console.error('Reaction failed', err);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-slate-900 justify-center items-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="flex h-screen bg-slate-900 justify-center items-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Article Not Found</h2>
                    <Link to="/blog" className="text-purple-400 hover:text-purple-300 underline">
                        Return to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const { title, content, author, coverImage, createdAt, views, likesCount, dislikesCount } = article;

    const date = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="flex h-screen bg-slate-900">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopBar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                    <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-8 md:py-12">

                        <Link to="/blog" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors">
                            <ArrowLeft size={16} />
                            <span>Back to blog</span>
                        </Link>

                        <header className="mb-10">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
                                {title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-slate-400 mb-8 pb-8 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-slate-200 font-medium">{author}</p>
                                        <p className="text-sm">Author</p>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <p className="text-slate-200 font-medium">Published</p>
                                    <p className="text-sm flex items-center gap-1">
                                        <Clock size={14} /> {date}
                                    </p>
                                </div>
                            </div>
                        </header>

                        {coverImage && (
                            <div className="rounded-xl overflow-hidden mb-12 shadow-2xl border border-slate-800">
                                <img src={coverImage} alt={title} className="w-full h-auto object-cover max-h-[400px]" />
                            </div>
                        )}

                        <article className="mb-16">
                            <ArticleContent content={content} />
                        </article>

                        {/* Reactions Section */}
                        <div className="flex items-center gap-4 mb-8 py-6 border-t border-slate-800">
                            <span className="text-slate-400 font-medium mr-2">Was this helpful?</span>
                            <button
                                onClick={() => handleReaction('like')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${reactionType === 'like'
                                    ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <ThumbsUp size={18} className={reactionType === 'like' ? 'fill-current' : ''} />
                                <span>{likesCount}</span>
                            </button>
                            <button
                                onClick={() => handleReaction('dislike')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${reactionType === 'dislike'
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <ThumbsDown size={18} className={reactionType === 'dislike' ? 'fill-current' : ''} />
                                <span>{dislikesCount}</span>
                            </button>

                            <div className="ml-auto text-sm text-slate-500">
                                {views} views
                            </div>
                        </div>

                        <CommentSection articleId={article._id} />

                    </div>
                </main>
            </div>
        </div>
    );
};

export default ArticlePage;
