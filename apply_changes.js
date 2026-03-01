const fs = require('fs');
const { execSync } = require('child_process');

const file = 'c:/Users/Ravikumar K P/OneDrive/Desktop/AskUrSenior/frontend/src/components/Sidebar.jsx';

// Revert back to committed version to clear corruption
execSync('git checkout ' + require('path').basename(file), { cwd: require('path').dirname(file) });

let content = fs.readFileSync(file, 'utf8');

const navUpgradeButton = `
                        {/* Always-visible Upgrade button for free, non-admin users */}
                        {user?.subscription === 'free' && !user?.isAdmin && (
                            <button
                                type="button"
                                onClick={() => navigate('/pricing')}
                                className={\`\${isCollapsed ? 'w-full flex items-center justify-center' : 'w-full'} bg-blue-600 text-white hover:bg-blue-700 rounded-xl p-3 transition mt-3 \${isCollapsed ? '' : 'text-left'}\`}
                                title="Upgrade to ASK+"
                            >
                                <div className={\`flex \${isCollapsed ? 'items-center justify-center' : 'items-start'} gap-3\`}>
                                    <div className={isCollapsed ? '' : 'mt-0.5'}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    {!isCollapsed && (
                                        <div className="min-w-0">
                                            <p className={\`text-sm font-semibold\`}>Upgrade to ASK+</p>
                                        </div>
                                    )}
                                </div>
                            </button>
                        )}`;

const profileUpgradeButton = `
                                {/* Upgrade button for free users only (not admin) */}
                                {user?.subscription === 'free' && !user?.isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/pricing');
                                        }}
                                        className={\`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition\`}
                                        title="Upgrade to ASK+"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Upgrade to ASK+</span>
                                    </button>
                                )}`;

// 1. Insert navUpgradeButton AFTER CGPA / SGPA Calculator button closes.
const navBtnTarget = `                                    </div>
                                )}
                            </div>
                        </button>`;
let navBtnIdx = content.indexOf(navBtnTarget);
if (navBtnIdx !== -1) {
    navBtnIdx += navBtnTarget.length;
    content = content.slice(0, navBtnIdx) + '\\n' + navUpgradeButton + content.slice(navBtnIdx);
} else {
    console.error("Nav button target not found!");
}

// 2. Insert profileUpgradeButton AFTER Admin Panel ends.
const profileBtnTarget = `                                        <span>Admin Panel</span>
                                    </button>
                                )}`;
let profBtnIdx = content.indexOf(profileBtnTarget);
if (profBtnIdx !== -1) {
    profBtnIdx += profileBtnTarget.length;
    content = content.slice(0, profBtnIdx) + '\\n' + profileUpgradeButton + content.slice(profBtnIdx);
} else {
    console.error("Profile button target not found!");
}

fs.writeFileSync(file, content);
console.log("Done carefully.");
