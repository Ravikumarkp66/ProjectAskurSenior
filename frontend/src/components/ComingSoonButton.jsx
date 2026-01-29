import React from 'react';
import './ComingSoonButton.css';

export default function ComingSoonButton() {
    return (
        <button className="coming-soon-btn" disabled>
            <span className="pulse-dot" aria-hidden="true" />
            Coming Soon
        </button>
    );
}
