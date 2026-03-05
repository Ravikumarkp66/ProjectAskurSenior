import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';

const ArticleCard = ({ article }) => {
    const { title, slug, author, coverImage, createdAt, content } = article;

    // Extract a short description from HTML content
    const extractText = (html) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        const text = tmp.textContent || tmp.innerText || '';
        return text.substring(0, 120) + (text.length > 120 ? '...' : '');
    };

    const description = extractText(content);

    // Format date
    const date = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Link to={`/blog/${slug}`} className="flex flex-col bg-slate-800 rounded-xl overflow-hidden hover:shadow-xl hover:shadow-purple-500/10 transition-all hover:-translate-y-1 duration-300 border border-slate-700">
            <div className="h-48 w-full overflow-hidden bg-slate-700 relative">
                {coverImage ? (
                    <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                        <span className="text-white font-bold text-xl opacity-50">{title.charAt(0)}</span>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 hover:text-purple-400 transition-colors">{title}</h3>

                <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                    {description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-1.5">
                        <User size={14} className="text-purple-400" />
                        <span>{author}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-purple-400" />
                        <span>{date}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ArticleCard;
