import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArticleCard from './ArticleCard';
import { articleAPI } from '../services/articleAPI';
import { ArrowRight } from 'lucide-react';

const HomeBlogSection = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const data = await articleAPI.getArticles();
                setArticles(data.slice(0, 3)); // Only show latest 3
            } catch (err) {
                console.error('Failed to load blog posts', err);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    if (loading) {
        return (
            <section className="py-20 bg-[#0a0a0b] border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex justify-center mt-10">
                    <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
            </section>
        );
    }

    if (articles.length === 0) {
        return null; // Don't show the section if no articles
    }

    return (
        <section className="py-24 bg-[#0a0a0b] relative z-10 border-t border-white/5 font-sans">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-4 font-outfit">
                            Latest Articles & Guides
                        </h2>
                        <p className="text-slate-400 text-lg max-w-2xl font-outfit">
                            Stay updated with recent news, helpful college guides, and tips published by our team.
                        </p>
                    </div>

                    <Link to="/blog" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium whitespace-nowrap bg-purple-500/10 hover:bg-purple-500/20 px-6 py-3 rounded-full font-outfit">
                        View all posts
                        <ArrowRight size={18} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map(article => (
                        <ArticleCard key={article._id} article={article} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HomeBlogSection;
