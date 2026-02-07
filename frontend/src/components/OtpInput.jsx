import React, { useRef, useEffect } from 'react';

const OtpInput = ({ length = 6, value, onChange, isLightMode }) => {
    const inputRefs = useRef([]);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleChange = (index, e) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newValue = value.split('');
        // Handle paste or multi-character input
        if (val.length > 1) {
            const pastedData = val.slice(0, length).split('');
            onChange(pastedData.join(''));
            // Focus last filled box
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        newValue[index] = val;
        const updatedValue = newValue.join('');
        onChange(updatedValue);

        // Move focus to next input if value is entered
        if (val && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // Move focus to previous input on backspace if current is empty
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            onChange(pastedData);
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <div className="flex gap-1.5 sm:gap-3 justify-center" onPaste={handlePaste}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={length}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-[13%] aspect-square max-w-[48px] sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 outline-none transition-all
                        ${isLightMode
                            ? 'bg-white border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-gray-900'
                            : 'bg-gray-800/50 border-gray-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 text-white'
                        }`}
                />
            ))}
        </div>
    );
};

export default OtpInput;
