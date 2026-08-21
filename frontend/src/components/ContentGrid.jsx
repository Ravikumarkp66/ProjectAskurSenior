import React from 'react';
import ResourceCard from './ResourceCard';

/* ═══════════════════════════════════════════════════════════════════
   CONTENT GRID — Responsive card layout
   1 col (mobile) → 2 (tablet) → 3 (desktop) → 4 (large desktop)
═══════════════════════════════════════════════════════════════════ */
const ContentGrid = ({
    items,
    contentType,
    onView,
    onDownload,
    onDelete,
    showDelete,
    color
}) => {
    if (!items?.length) return null;
    return (
        <div
            className="animate-fadeIn"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
                padding: '20px 0 24px',
                width: '100%',
            }}
        >
            {items.map((item, i) => (
                <ResourceCard
                    key={item._id || i}
                    resource={item}
                    onPreview={() => onView(contentType, item._id)}
                    onDownload={() => onDownload(item._id, item.originalName || item.fileName || 'download')}
                    onDelete={onDelete}
                    showDelete={showDelete}
                    color={color}
                />
            ))}
        </div>
    );
};

export default ContentGrid;
