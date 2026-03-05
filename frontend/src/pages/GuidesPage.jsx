import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';
import { articleAPI } from '../services/articleAPI';

const GuidesPage = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async (search = '') => {
        setLoading(true);
        try {
            const data = await articleAPI.getArticles(search);
            setArticles(data);
        } catch (err) {
            console.error('Failed to load guides', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchArticles(searchQuery);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] font-outfit text-white flex flex-col pt-12">
            <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

                <Link to="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4 font-medium transition-colors">
                    <ArrowLeft size={16} />
                    <span>Back to Home</span>
                </Link>

                {/* Header Section */}
                <div className="mb-12 text-center mt-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-4">
                        Blog
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
                        Read the latest articles, guides, and updates published by admins.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search articles..."
                            className="w-full bg-[#141416]/50 border border-white/5 text-white rounded-full py-4 pl-12 pr-24 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-lg backdrop-blur-sm"
                        />
                        <button
                            type="submit"
                            className="absolute inset-y-1.5 right-1.5 bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-full font-medium transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                ) : articles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                        {articles.map(article => (
                            <ArticleCard key={article._id} article={article} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[#141416]/30 rounded-2xl border border-white/5 border-dashed">
                        <div className="text-slate-500 mb-4 flex justify-center">
                            <Search size={48} className="opacity-50" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-300 mb-2">No articles found</h3>
                        <p className="text-slate-500">We couldn't find any articles matching your search.</p>
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); fetchArticles(); }}
                                className="mt-4 text-purple-400 hover:text-purple-300 underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default GuidesPage;
