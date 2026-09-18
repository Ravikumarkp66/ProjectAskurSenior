import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Info, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BLOCK_TYPES, extractSectionsFromBlocks } from '../../../data/editorial/contentModel';

/**
 * Editorial Theme Palette for Dark Charcoal & Neutral Light Study Sheet
 */
const getEditorialTheme = (isDark) => isDark ? {
    pageBg: '#1E1E1E',
    title: '#EDEDED',
    h2: '#E0E0E0',
    h3: '#D4D4D4',
    h4: '#C8C8C8',
    body: '#C8C8C8',
    bodyMedium: '#E0E0E0',
    bodyBold: '#EDEDED',
    quoteBorder: '#404040',
    quoteText: '#A8A8A8',
    quoteHighlight: '#E0E0E0',
    divider: '#2D2D2D',
    breadcrumbBase: '#777777',
    breadcrumbSlash: '#444444',
    breadcrumbActive: '#A0A0A0',
    tocTitle: '#7A7A7A',
    tocBorder: '#2D2D2D',
    tocActive: '#EDEDED',
    tocInactive: '#808080',
    progressTrack: '#2D2D2D',
    progressFill: '#7A7A7A',
    progressLabel: '#7A7A7A',
    progressSublabel: '#999999',
    preBg: '#141414',
    preBorder: '#2D2D2D',
    preText: '#D4D4D4',
    codeBg: '#1A1A1A',
    codeHeaderBg: '#262626',
    codeBorder: '#333333',
    codeText: '#D4D4D4',
    calloutInfoBg: 'rgba(59, 130, 246, 0.08)',
    calloutInfoBorder: 'rgba(59, 130, 246, 0.25)',
    calloutInfoText: '#93C5FD',
    calloutTipBg: 'rgba(16, 185, 129, 0.08)',
    calloutTipBorder: 'rgba(16, 185, 129, 0.25)',
    calloutTipText: '#6EE7B7',
    calloutWarnBg: 'rgba(245, 158, 11, 0.08)',
    calloutWarnBorder: 'rgba(245, 158, 11, 0.25)',
    calloutWarnText: '#FCD34D'
} : {
    pageBg: '#F6F7F9',
    title: '#1F242D',
    h2: '#2B303A',
    h3: '#374151',
    h4: '#4B5563',
    body: '#4B5563',
    bodyMedium: '#1F2937',
    bodyBold: '#111827',
    quoteBorder: '#D1D5DB',
    quoteText: '#6B7280',
    quoteHighlight: '#1F2937',
    divider: '#E5E7EB',
    breadcrumbBase: '#9CA3AF',
    breadcrumbSlash: '#D1D5DB',
    breadcrumbActive: '#4B5563',
    tocTitle: '#6B7280',
    tocBorder: '#E5E7EB',
    tocActive: '#111827',
    tocInactive: '#6B7280',
    progressTrack: '#E5E7EB',
    progressFill: '#4B5563',
    progressLabel: '#6B7280',
    progressSublabel: '#374151',
    preBg: '#F0F1F3',
    preBorder: '#E2E4E8',
    preText: '#1F2937',
    codeBg: '#F8F9FA',
    codeHeaderBg: '#ECEEF1',
    codeBorder: '#E1E4E8',
    codeText: '#24292F',
    calloutInfoBg: '#EFF6FF',
    calloutInfoBorder: '#BFDBFE',
    calloutInfoText: '#1D4ED8',
    calloutTipBg: '#ECFDF5',
    calloutTipBorder: '#A7F3D0',
    calloutTipText: '#047857',
    calloutWarnBg: '#FFFBEB',
    calloutWarnBorder: '#FDE68A',
    calloutWarnText: '#B45309'
};

/**
 * Generic Syntax-Highlighted Code Block
 */
const CodeBlock = ({ code = '', language = 'Text', isDark = true }) => {
    const [copied, setCopied] = useState(false);
    const th = getEditorialTheme(isDark);

    const handleCopy = async () => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (e) {
            // Ignore clipboard errors in test environments
        }
    };

    const lines = code.split('\n');

    return (
        <div 
            className="my-4 w-full max-w-[760px] rounded-lg overflow-hidden text-left font-mono border"
            style={{
                background: th.codeBg,
                borderColor: th.codeBorder
            }}
        >
            <div 
                className="flex items-center justify-between px-3 py-1.5 border-b select-none"
                style={{
                    background: th.codeHeaderBg,
                    borderColor: th.codeBorder
                }}
            >
                <span className="text-xs font-semibold px-2 py-0.5 rounded opacity-80" style={{ color: th.codeText }}>
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
                    style={{
                        background: copied ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                        color: copied ? '#10B981' : th.body
                    }}
                    title="Copy code"
                    type="button"
                >
                    {copied ? (
                        <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-[11px] font-sans font-medium text-emerald-500">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={12} />
                            <span className="text-[11px] font-sans">Copy</span>
                        </>
                    )}
                </button>
            </div>

            <div className="flex text-[13.5px] leading-[1.65] overflow-x-auto py-3 px-1 font-mono">
                <div 
                    className="flex flex-col items-end pr-3 select-none text-right opacity-40 font-mono text-xs"
                    style={{ minWidth: '32px' }}
                >
                    {lines.map((_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                </div>
                <pre className="pl-3 pr-4 flex-1 whitespace-pre m-0 bg-transparent border-0 p-0 text-inherit font-mono" style={{ color: th.codeText }}>
                    {code}
                </pre>
            </div>
        </div>
    );
};

/**
 * EditorialRenderer
 * 
 * Generic, data-driven renderer for educational editorial topics.
 * Completely decoupled from specific subjects or topics.
 * 
 * @param {Object} props
 * @param {Object} props.content - Structured editorial document { title, sections, blocks, breadcrumbs }
 * @param {boolean} [props.isDark=true] - Theme flag
 * @param {string} [props.className=''] - Optional wrapper CSS classes
 * @param {React.ReactNode} [props.actionBar=null] - Optional bottom action bar
 * @param {React.ReactNode} [props.rightColumnExtra=null] - Optional extra content below TOC (e.g. progress bar)
 */
const EditorialRenderer = ({
    content,
    isDark = true,
    className = '',
    actionBar = null,
    rightColumnExtra = null
}) => {
    // Reset scroll position to top whenever topic slug or title changes
    useEffect(() => {
        const mainContainer = (typeof document !== 'undefined' && document.querySelector('main')) || null;
        if (mainContainer) {
            mainContainer.scrollTop = 0;
        }
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }, [content?.topicSlug, content?.title]);

    // Sections for TOC: use document sections or derive from heading blocks
    const sections = useMemo(() => {
        if (Array.isArray(content?.sections) && content.sections.length > 0) {
            return content.sections;
        }
        if (Array.isArray(content?.blocks)) {
            return extractSectionsFromBlocks(content.blocks);
        }
        return [];
    }, [content?.sections, content?.blocks]);

    const [activeSectionId, setActiveSectionId] = useState('');

    useEffect(() => {
        if (!sections.length) return;
        setActiveSectionId(sections[0]?.id || '');

        const handleScroll = () => {
            const headingElements = sections
                .map(sec => document.getElementById(sec.id))
                .filter(Boolean);

            for (let i = headingElements.length - 1; i >= 0; i--) {
                const el = headingElements[i];
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 160) {
                        setActiveSectionId(sections[i].id);
                        break;
                    }
                }
            }
        };

        const container = (typeof document !== 'undefined' && document.querySelector('main')) || (typeof window !== 'undefined' ? window : null);
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, [sections]);

    if (!content || !Array.isArray(content.blocks)) {
        return null;
    }

    const th = getEditorialTheme(isDark);

    const scrollToSection = (id) => {
        if (typeof document === 'undefined') return;
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSectionId(id);
        }
    };

    const breadcrumbs = content.breadcrumbs || (content.moduleDisplayTitle ? [content.moduleDisplayTitle, content.title] : [content.title]);

    /**
     * Dispatches rendering of individual structured blocks
     */
    const renderBlock = (block, idx) => {
        if (!block || !block.type) return null;

        switch (block.type) {
            case BLOCK_TYPES.HEADING: {
                const level = block.level || 2;
                const id = block.id;

                if (level === 1) {
                    return (
                        <h1 
                            key={idx} 
                            id={id} 
                            className="scroll-mt-6 text-[28px] sm:text-[30px] font-bold tracking-tight mb-5"
                            style={{ color: th.title }}
                        >
                            {block.text}
                        </h1>
                    );
                }
                if (level === 2) {
                    return (
                        <h2 
                            key={idx} 
                            id={id} 
                            className="scroll-mt-6 text-[19px] sm:text-[21px] font-bold mt-8 mb-3"
                            style={{ color: th.h2 }}
                        >
                            {block.text}
                        </h2>
                    );
                }
                if (level === 3) {
                    return (
                        <h3 
                            key={idx} 
                            id={id} 
                            className="scroll-mt-6 text-[16px] sm:text-[17px] font-semibold mt-6 mb-2"
                            style={{ color: th.h3 }}
                        >
                            {block.text}
                        </h3>
                    );
                }
                return (
                    <h4 
                        key={idx} 
                        id={id} 
                        className="scroll-mt-6 text-[14.5px] font-semibold mt-4 mb-2"
                        style={{ color: th.h4 }}
                    >
                        {block.text}
                    </h4>
                );
            }

            case BLOCK_TYPES.PARAGRAPH: {
                const isMedium = block.variant === 'medium';
                const isBold = block.variant === 'bold';
                const textColor = isBold ? th.bodyBold : (isMedium ? th.bodyMedium : th.body);
                const fontWeight = isBold ? 700 : (isMedium ? 500 : 400);

                return (
                    <p 
                        key={idx}
                        className={`mb-3.5 text-[14.5px] sm:text-[15px] leading-[1.75] ${block.italic ? 'italic' : ''}`}
                        style={{ color: textColor, fontWeight }}
                    >
                        {block.text}
                    </p>
                );
            }

            case BLOCK_TYPES.LIST: {
                const isOrdered = block.style === 'ordered';
                const Tag = isOrdered ? 'ol' : 'ul';
                const listClass = isOrdered 
                    ? 'list-decimal pl-5 space-y-1.5 mb-4 text-[14.5px] leading-relaxed' 
                    : 'list-disc pl-5 space-y-1.5 mb-4 text-[14.5px] leading-relaxed';

                return (
                    <Tag key={idx} className={listClass} style={{ color: th.body }}>
                        {block.items.map((item, i) => (
                            <li key={i}>
                                {typeof item === 'string' ? item : (item.text || JSON.stringify(item))}
                            </li>
                        ))}
                    </Tag>
                );
            }

            case BLOCK_TYPES.BLOCKQUOTE: {
                return (
                    <div key={idx} className="my-3.5">
                        {block.label && (
                            <div className="text-[12px] font-mono uppercase tracking-wider mb-1" style={{ color: th.quoteText }}>
                                {block.label}
                            </div>
                        )}
                        <blockquote 
                            className="pl-4 border-l-2 text-[14.5px] italic leading-relaxed"
                            style={{ 
                                borderColor: th.quoteBorder, 
                                color: th.quoteText 
                            }}
                        >
                            {block.text}
                            {block.citation && (
                                <cite className="block not-italic text-xs mt-1 opacity-75">— {block.citation}</cite>
                            )}
                        </blockquote>
                    </div>
                );
            }

            case BLOCK_TYPES.CODE: {
                return (
                    <CodeBlock 
                        key={idx} 
                        code={block.code} 
                        language={block.language || 'Code'} 
                        isDark={isDark} 
                    />
                );
            }

            case BLOCK_TYPES.PREFORMATTED: {
                return (
                    <div key={idx} className="my-3.5">
                        {block.caption && (
                            <div className="text-xs font-mono mb-1 opacity-70" style={{ color: th.body }}>
                                {block.caption}
                            </div>
                        )}
                        <pre 
                            className="p-4 rounded-lg overflow-x-auto text-[13px] sm:text-[13.5px] font-mono leading-relaxed select-text border m-0"
                            style={{
                                background: th.preBg,
                                borderColor: th.preBorder,
                                color: th.preText
                            }}
                        >
                            {block.text}
                        </pre>
                    </div>
                );
            }

            case BLOCK_TYPES.FORMULA: {
                return (
                    <div 
                        key={idx} 
                        className="my-4 p-3.5 rounded-lg border text-center font-mono"
                        style={{
                            background: th.preBg,
                            borderColor: th.preBorder
                        }}
                    >
                        <div className="text-[15px] font-bold tracking-wide" style={{ color: th.title }}>
                            {block.formula}
                        </div>
                        {block.explanation && (
                            <div className="text-xs mt-1.5 opacity-75 font-sans" style={{ color: th.body }}>
                                {block.explanation}
                            </div>
                        )}
                    </div>
                );
            }

            case BLOCK_TYPES.DIVIDER: {
                return (
                    <hr 
                        key={idx} 
                        className="border-0 border-t my-7" 
                        style={{ borderColor: th.divider }} 
                    />
                );
            }

            case BLOCK_TYPES.CALLOUT: {
                const tone = block.tone || 'info';
                let toneBg = th.calloutInfoBg;
                let toneBorder = th.calloutInfoBorder;
                let toneColor = th.calloutInfoText;
                let Icon = Info;

                if (tone === 'tip' || tone === 'success') {
                    toneBg = th.calloutTipBg;
                    toneBorder = th.calloutTipBorder;
                    toneColor = th.calloutTipText;
                    Icon = Lightbulb;
                } else if (tone === 'warning') {
                    toneBg = th.calloutWarnBg;
                    toneBorder = th.calloutWarnBorder;
                    toneColor = th.calloutWarnText;
                    Icon = AlertTriangle;
                }

                return (
                    <div 
                        key={idx} 
                        className="my-4 p-3.5 rounded-lg border flex items-start gap-3 text-[13.5px] leading-relaxed"
                        style={{
                            background: toneBg,
                            borderColor: toneBorder,
                            color: toneColor
                        }}
                    >
                        <Icon size={18} className="shrink-0 mt-0.5" />
                        <div className="flex-1">
                            {block.title && <div className="font-bold mb-1">{block.title}</div>}
                            <div>{block.text}</div>
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div 
            className={`w-full text-left pt-2 pb-0 flex items-start gap-10 xl:gap-14 flex-1 ${className}`}
            style={{
                background: th.pageBg,
                '--editorial-title': th.title,
                '--editorial-h2': th.h2,
                '--editorial-body': th.body
            }}
        >
            {/* ── Left Column: Article Content (Max 760px) ── */}
            <div className="w-full flex-1 max-w-[760px] min-w-0 flex flex-col justify-between">
                <div>
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <div style={{ color: th.breadcrumbBase }} className="mb-3 text-[12px] font-mono select-none">
                            {breadcrumbs.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <span style={{ color: th.breadcrumbSlash }} className="mx-2">/</span>}
                                    <span style={{ color: idx === breadcrumbs.length - 1 ? th.breadcrumbActive : th.breadcrumbBase }}>
                                        {crumb}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Render Content Blocks */}
                    {content.blocks.map((block, idx) => renderBlock(block, idx))}
                </div>

                {/* Optional Bottom Action Bar */}
                {actionBar && (
                    <div className="mt-8 pt-4 pb-2 border-t w-full shrink-0" style={{ borderColor: th.divider }}>
                        {actionBar}
                    </div>
                )}
            </div>

            {/* ── Right Column: Sticky "ON THIS PAGE" TOC (Desktop Only) ── */}
            {sections.length > 0 && (
                <aside className="hidden xl:block w-[200px] shrink-0 sticky top-6 self-start select-none">
                    <div style={{ color: th.tocTitle }} className="text-[11px] font-mono uppercase tracking-wider font-semibold mb-3">
                        On This Page
                    </div>

                    <nav style={{ borderColor: th.tocBorder }} className="flex flex-col space-y-2.5 border-l pl-3 text-[12.5px]">
                        {sections.map((sec) => {
                            const isActive = activeSectionId === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    onClick={() => scrollToSection(sec.id)}
                                    style={{
                                        color: isActive ? th.tocActive : th.tocInactive,
                                        fontWeight: isActive ? 600 : 400
                                    }}
                                    className="text-left transition-colors cursor-pointer leading-snug bg-transparent border-0 p-0"
                                    type="button"
                                >
                                    {sec.title}
                                </button>
                            );
                        })}
                    </nav>
                    {rightColumnExtra}
                </aside>
            )}
        </div>
    );
};

export default EditorialRenderer;
