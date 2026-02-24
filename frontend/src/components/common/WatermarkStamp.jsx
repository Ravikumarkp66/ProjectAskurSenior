import React from 'react';

function WatermarkStamp({ opacity = 0.05, size = 450, rotation = -15 }) {
    const style = {
        opacity,
        '--wm-size': `${size}px`,
        '--wm-rotation': `${rotation}deg`,
    };

    return (
        <div className="watermark-container" style={style} aria-hidden="true">
            <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" className="watermark-svg" focusable="false">
                <circle cx="300" cy="300" r="260" stroke="black" strokeWidth="10" fill="none" />
                <circle cx="300" cy="300" r="220" stroke="black" strokeWidth="3" fill="none" />

                <defs>
                    <path id="watermarkTopCurve" d="M 120 300 A 180 180 0 0 1 480 300" />
                    <path id="watermarkBottomCurve" d="M 480 300 A 180 180 0 0 1 120 300" />
                </defs>

                <text fontFamily="Arial, Helvetica, sans-serif" fontSize="26" fontWeight="600" letterSpacing="3" fill="black">
                    <textPath href="#watermarkTopCurve" startOffset="50%" textAnchor="middle">
                        RESULT ANALYSIS REPORT
                    </textPath>
                </text>

                <text fontFamily="Arial, Helvetica, sans-serif" fontSize="22" fontWeight="500" letterSpacing="2" fill="black">
                    <textPath href="#watermarkBottomCurve" startOffset="50%" textAnchor="middle">
                        ASK+ VERIFIED
                    </textPath>
                </text>

                <text
                    x="300"
                    y="330"
                    fontFamily="Arial, Helvetica, sans-serif"
                    fontSize="110"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="black"
                >
                    ASK+
                </text>
            </svg>
        </div>
    );
}

export default React.memo(WatermarkStamp);
