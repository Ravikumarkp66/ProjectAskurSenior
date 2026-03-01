const fs = require('fs');
const path = require('path');

const file = 'c:/Users/Ravikumar K P/OneDrive/Desktop/AskUrSenior/frontend/src/components/Sidebar.jsx';
let content = fs.readFileSync(file, 'utf8');

// Find the first occurrence of Toggle Theme button
// It has "Toggle theme" in its title
const themeTitleIdx = content.indexOf('title="Toggle theme"');
if (themeTitleIdx === -1) {
    console.error("Theme button not found!");
    process.exit(1);
}

// Find the closing </button> after that
const themeButtonEndIndex = content.indexOf('</button>', themeTitleIdx) + '</button>'.length;

// Find the string ending the menu
const endString = '                            </div>\\n                        )}\\n                        </nav>\\n                    </div>\\n                </div>\\n            </>\\n    );\\n};'.replace(/\\n/g, '\n');

// Actually let's just find the last occurrence of '</div>\n                        )}'
const endMenuIdx = content.lastIndexOf('</div>\n                        )}');

if (endMenuIdx === -1) {
    // maybe different whitespace
    const endMenuAlt = content.lastIndexOf('</div>');
    console.log("fallback to alt end", endMenuAlt);
}

const cleanPart1 = content.substring(0, themeButtonEndIndex);
const cleanPart3 = content.substring(endMenuIdx);

const logoutButton = `

                                <button
                                    type="button"
                                    onClick={logout}
                                    className={\`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition\`}
                                    title="Log out"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Log out</span>
                                </button>
`;

const newContent = cleanPart1 + logoutButton + cleanPart3;
fs.writeFileSync(file, newContent);
console.log("File fixed!");
