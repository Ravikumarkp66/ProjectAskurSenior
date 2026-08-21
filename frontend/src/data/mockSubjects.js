export const MOCK_SUBJECTS = {
    'second-year': {
        '2022 Scheme': {
            'CSE': [
                { id: 'dbms-22', name: 'Database Management Systems', code: 'BCS301' },
                { id: 'dsa-22', name: 'Data Structures and Applications', code: 'BCS302' },
                { id: 'ade-22', name: 'Analog and Digital Electronics', code: 'BCS303' },
                { id: 'co-22', name: 'Computer Organisation and Architecture', code: 'BCS304' }
            ],
            'ISE': [
                { id: 'dbms-ise-22', name: 'Database Management Systems', code: 'BIS301' },
                { id: 'dsa-ise-22', name: 'Data Structures and Applications', code: 'BIS302' },
                { id: 'ade-ise-22', name: 'Analog and Digital Electronics', code: 'BIS303' }
            ],
            'ECE': [
                { id: 'nt-22', name: 'Network Theory', code: 'BEC301' },
                { id: 'aec-22', name: 'Analog Electronic Circuits', code: 'BEC302' },
                { id: 'dec-22', name: 'Digital Electronic Circuits', code: 'BEC303' }
            ]
        },
        '2025 Scheme': {
            'CSE': [
                { id: 'dbms-25', name: 'Database Management Systems', code: 'CCS301' },
                { id: 'dsa-25', name: 'Data Structures & Algorithms', code: 'CCS302' },
                { id: 'os-25', name: 'Operating Systems', code: 'CCS303' }
            ],
            'ISE': [
                { id: 'dbms-ise-25', name: 'Database Management Systems', code: 'CIS301' },
                { id: 'dsa-ise-25', name: 'Data Structures & Algorithms', code: 'CIS302' },
                { id: 'os-ise-25', name: 'Operating Systems', code: 'CIS303' }
            ],
            'ECE': [
                { id: 'dec-25', name: 'Digital Electronics & Circuits', code: 'CEC301' },
                { id: 'ss-25', name: 'Signals & Systems', code: 'CEC302' }
            ]
        }
    },
    'third-year': {
        '2022 Scheme': {
            'CSE': [
                { id: 'cn-22', name: 'Computer Networks', code: 'BCS501' },
                { id: 'atc-22', name: 'Automata Theory and Compiler Design', code: 'BCS502' },
                { id: 'se-22', name: 'Software Engineering', code: 'BCS503' }
            ],
            'ISE': [
                { id: 'cn-ise-22', name: 'Computer Networks', code: 'BIS501' },
                { id: 'atc-ise-22', name: 'Automata Theory and Compiler Design', code: 'BIS502' }
            ],
            'ECE': [
                { id: 'dsp-22', name: 'Digital Signal Processing', code: 'BEC501' },
                { id: 'lic-22', name: 'Linear Integrated Circuits', code: 'BEC502' }
            ]
        },
        '2025 Scheme': {
            'CSE': [
                { id: 'ai-25', name: 'Artificial Intelligence', code: 'CCS501' },
                { id: 'ml-25', name: 'Machine Learning & Applications', code: 'CCS502' },
                { id: 'cd-25', name: 'Compiler Design', code: 'CCS503' }
            ],
            'ISE': [
                { id: 'ai-ise-25', name: 'Artificial Intelligence', code: 'CIS501' },
                { id: 'ml-ise-25', name: 'Machine Learning & Applications', code: 'CIS502' }
            ],
            'ECE': [
                { id: 'dsp-25', name: 'Digital Signal Processing', code: 'CEC501' },
                { id: 'lic-25', name: 'Linear Integrated Circuits', code: 'CEC502' }
            ]
        }
    },
    'fourth-year': {
        '2022 Scheme': {
            'CSE': [
                { id: 'cc-22', name: 'Cloud Computing', code: 'BCS701' },
                { id: 'crypto-22', name: 'Cryptography & Network Security', code: 'BCS702' }
            ],
            'ISE': [
                { id: 'cc-ise-22', name: 'Cloud Computing', code: 'BIS701' }
            ],
            'ECE': [
                { id: 'wc-22', name: 'Wireless Communication', code: 'BEC701' }
            ]
        },
        '2025 Scheme': {
            'CSE': [
                { id: 'cc-25', name: 'Cloud Computing', code: 'CCS701' },
                { id: 'proj-25', name: 'Capstone Project', code: 'CCS702' }
            ],
            'ISE': [
                { id: 'cc-ise-25', name: 'Cloud Computing', code: 'CIS701' },
                { id: 'proj-ise-25', name: 'Capstone Project', code: 'CIS702' }
            ],
            'ECE': [
                { id: 'wc-25', name: 'Wireless Communication', code: 'CEC701' },
                { id: 'proj-ece-25', name: 'Capstone Project', code: 'CEC702' }
            ]
        }
    }
};

export const SCHEMES = ['2022 Scheme', '2025 Scheme'];
export const BRANCHES = ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML'];
