import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const AccordionItem = ({ title, children, isOpen, onClick }) => {
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (isOpen && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [isOpen]);

    return (
        <div className={`p-5 lg:p-6 rounded-2xl border transition-all duration-300 mb-3 ${isOpen ? 'bg-[#1a1a1e] border-purple-500/30' : 'bg-[#141416] border-white/5 hover:border-white/10'}`}>
            <button
                className="w-full flex items-center justify-between text-left focus:outline-none gap-4"
                onClick={onClick}
            >
                <h4 className={`text-base sm:text-lg font-bold transition-colors ${isOpen ? 'text-white' : 'text-slate-200'}`}>
                    {title}
                </h4>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-purple-500/20 text-purple-400 rotate-180' : 'bg-white/5 text-slate-400'}`}>
                    <ChevronDown size={18} />
                </div>
            </button>
            <div
                className="overflow-hidden transition-[height,opacity] duration-300 ease-in-out"
                style={{ height: `${height}px`, opacity: isOpen ? 1 : 0 }}
            >
                <div ref={contentRef} className="pt-4 text-slate-300 text-sm md:text-base leading-relaxed space-y-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const Accordion = ({ children }) => {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <div className="w-full">
            {React.Children.map(children, (child, index) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        isOpen: openIndex === index,
                        onClick: () => setOpenIndex(openIndex === index ? null : index)
                    });
                }
                return child;
            })}
        </div>
    );
};
