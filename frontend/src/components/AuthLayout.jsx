import React from 'react';

const AuthLayout = ({
    sideImageUrl,
    children
}) => {
    return (
        <div className="min-h-screen w-full overflow-hidden relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#050A1A] via-[#0B1230] to-[#2B0B45]" />
            <div className="absolute inset-0 opacity-80 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_55%)]" />

            <div className="relative z-10 w-full max-w-md md:max-w-6xl lg:max-w-7xl px-4 sm:px-6">
                <div className="mx-auto w-full overflow-hidden rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
                    <div className="grid md:grid-cols-[1.2fr_0.8fr] lg:grid-cols-[1.15fr_0.85fr] h-[680px] max-h-[calc(100vh-2rem)]">
                        {/* Left panel (hidden on mobile) */}
                        <div className="hidden md:flex flex-col border-r border-white/10 bg-white/5">
                            <div className="p-8">
                                <div className="text-xs font-semibold tracking-wide text-white/70">ASK+</div>
                                <div className="mt-2 text-2xl font-extrabold text-white">Welcome to ASK+</div>
                                <div className="mt-2 text-sm text-white/70">
                                    Pick up exactly where you left off — your progress is always saved.
                                </div>
                            </div>

                            <div className="relative flex-1 overflow-hidden">
                                {sideImageUrl && (
                                    <img
                                        src={sideImageUrl}
                                        alt=""
                                        className="absolute inset-0 h-full w-full object-cover object-left"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/45" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                            </div>
                        </div>

                        {/* Right panel */}
                        <div className="h-full bg-white/5 min-h-0">
                            <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">{children}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
