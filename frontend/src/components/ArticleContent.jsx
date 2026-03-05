import React from 'react';
import './ArticleContent.css'; // Will create typography styles

const ArticleContent = ({ content }) => {
    return (
        <div
            className="article-content prose prose-invert prose-purple max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default ArticleContent;
