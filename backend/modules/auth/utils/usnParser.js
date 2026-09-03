const Branch = require('../../../models/Branch');
const Scheme = require('../../../models/Scheme');

const collegeMap = {
    'SI': 'Siddaganga Institute of Technology',
    'RV': 'R.V. College of Engineering',
    'MS': 'Ramaiah Institute of Technology',
    'BM': 'B.M.S. College of Engineering',
    'PE': 'PES College of Engineering, Mandya',
    'DS': 'Dayananda Sagar College of Engineering',
    'JS': 'JSS Academy of Technical Education',
    'SJ': 'Sri Jayachamarajendra College of Engineering',
    'NH': 'New Horizon College of Engineering',
    'MV': 'Sir M. Visvesvaraya Institute of Technology',
    'BI': 'Bangalore Institute of Technology',
    'ME': 'Malnad College of Engineering',
    'NI': 'The National Institute of Engineering',
    'DB': 'Don Bosco Institute of Technology',
    'GA': 'Global Academy of Technology',
    'OX': 'The Oxford College of Engineering',
    'CM': 'CMR Institute of Technology',
    'KS': 'K.S. Institute of Technology',
    'RN': 'R.N.S. Institute of Technology',
    'MJ': 'MVJ College of Engineering',
    'AM': 'AMC Engineering College',
    'AT': 'Atria Institute of Technology',
    'SG': 'Sambhram Institute of Technology',
    'VE': 'Vemana Institute of Technology',
    'EP': 'East Point College of Engineering & Technology',
    'HK': 'H.K.B.K. College of Engineering',
    'NC': 'Nagarjuna College of Engineering & Technology',
    'DR': 'Dr. Ambedkar Institute of Technology',
    'CG': 'Channabasaveshwara Institute of Technology',
    'KA': 'K.L.S. Gogte Institute of Technology',
    'SD': 'S.D.M. College of Engineering & Technology',
    'BL': 'B.L.D.E.A\'s V.P. Dr. P.G. Halakatti College of Engineering',
    'PD': 'P.D.A. College of Engineering',
    'RY': 'R.Y.M.E.C.'
};

const branchShortMap = {
    'CS': 'CSE',
    'IS': 'ISE',
    'EC': 'ECE',
    'EE': 'EEE',
    'ME': 'MECH',
    'CV': 'CIVIL',
    'AI': 'AIML',
    'AM': 'AIML',
    'DS': 'DS',
    'CB': 'CSBS',
    'BT': 'BT',
    'IT': 'IT',
    'CH': 'CH',
    'ET': 'ET',
    'EI': 'EI'
};

async function parseUsn(usn) {
    if (!usn) return null;
    const cleanUsn = usn.trim().toUpperCase();
    const vtuRegex = /^([1-4])([A-Z]{2})([0-9]{2})([A-Z]{2,3})([0-9]{3})$/;
    const match = cleanUsn.match(vtuRegex);
    if (!match) return null;

    const [_, regionDigit, collegeCode, yearCode, branchCode, rollCode] = match;

    const admissionYear = 2000 + parseInt(yearCode, 10);
    const graduationYear = admissionYear + 4;

    const collegeName = collegeMap[collegeCode] || `VTU College (${collegeCode})`;
    
    // Map branch code (e.g. 'IS' -> 'ISE')
    const branchShort = branchShortMap[branchCode] || branchCode;

    // Estimate Scheme based on admission year
    let schemeName = '2022 Scheme';
    if (admissionYear === 2021) {
        schemeName = '2021 Scheme';
    } else if (admissionYear >= 2018 && admissionYear <= 2020) {
        schemeName = '2018 Scheme';
    } else if (admissionYear >= 2022) {
        schemeName = '2022 Scheme';
    }

    // Estimate Semester based on current date (Month is 0-indexed: Jan=0, July=6, Aug=7)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let semesterEstimate = 1;
    const yearsDiff = currentYear - admissionYear;
    if (currentMonth >= 7 || currentMonth === 0) {
        semesterEstimate = yearsDiff * 2 + 1;
    } else {
        semesterEstimate = yearsDiff * 2;
    }

    semesterEstimate = Math.max(1, Math.min(8, semesterEstimate));

    // Resolve branch ID from database
    let branchDoc = await Branch.findOne({ shortName: branchShort });
    if (!branchDoc) {
        branchDoc = await Branch.findOne({ shortName: branchCode });
        if (!branchDoc) {
            branchDoc = await Branch.findOne(); // Grab first available
        }
    }

    // Resolve scheme ID from database
    let schemeDoc = await Scheme.findOne({ name: new RegExp(schemeName, 'i') });
    if (!schemeDoc) {
        schemeDoc = await Scheme.findOne({ name: new RegExp(`${admissionYear}`, 'i') });
        if (!schemeDoc) {
            schemeDoc = await Scheme.findOne(); // Grab first available
        }
    }

    return {
        usn: cleanUsn,
        collegeName,
        branchShort,
        branchId: branchDoc ? branchDoc._id : null,
        branchName: branchDoc ? branchDoc.name : branchShort,
        schemeId: schemeDoc ? schemeDoc._id : null,
        schemeName: schemeDoc ? schemeDoc.name : schemeName,
        admissionYear,
        graduationYear,
        currentSemesterEstimate: semesterEstimate
    };
}

const collegeDomainMap = {
    'SI': 'sit.ac.in',
    'RV': 'rvce.edu.in',
    'MS': 'msrit.edu',
    'BM': 'bmsce.ac.in',
    'DS': 'dsce.edu.in',
    'PE': 'pes.edu',
    'JS': 'jssateb.ac.in',
    'SJ': 'sjce.ac.in',
    'NI': 'nie.ac.in',
    'BI': 'bit-bangalore.edu.in'
};

function getCollegeEmailForUsn(usn) {
    if (!usn) return null;
    const clean = usn.trim().toUpperCase();
    const vtuRegex = /^([1-4])([A-Z]{2})([0-9]{2})([A-Z]{2,3})([0-9]{3})$/;
    const match = clean.match(vtuRegex);
    if (!match) return null;
    const collegeCode = match[2];
    const domain = collegeDomainMap[collegeCode] || 'sit.ac.in';
    return `${clean.toLowerCase()}@${domain}`;
}

module.exports = { parseUsn, getCollegeEmailForUsn, collegeDomainMap };
