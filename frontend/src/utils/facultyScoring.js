/**
 * Weighted Faculty Experience Scoring Engine (0-100)
 * AskUrSenior Faculty Insights Module
 */

export const calculateSubmissionScore = (feedbackData) => {
    if (!feedbackData) return 75;

    // 1. TEACHING EXPERIENCE (Max 25 pts)
    const classroomStyle = Array.isArray(feedbackData.classroomStyle) ? feedbackData.classroomStyle : [];
    let teachingScore = 18; // base neutral starting point
    if (classroomStyle.includes('Interactive')) teachingScore += 7;
    if (classroomStyle.includes('Boring / difficult to stay engaged')) teachingScore -= 6;
    if (classroomStyle.includes('Mostly one-way teaching')) teachingScore -= 4;
    if (classroomStyle.includes('Very strict about time / discipline')) teachingScore += 1;
    teachingScore = Math.max(5, Math.min(25, teachingScore));

    // 2. STUDENT TREATMENT & FAIRNESS (Max 20 pts)
    const perfTreatment = Array.isArray(feedbackData.performanceTreatment) ? feedbackData.performanceTreatment : [];
    const singledOut = feedbackData.singledOut || "No, I haven't noticed this";

    let treatmentScore = 20;
    if (perfTreatment.includes('Tends to favor high-performing students')) treatmentScore -= 4;
    if (perfTreatment.includes('Tends to favor students who are struggling')) treatmentScore -= 2;
    if (perfTreatment.includes('Treats high-performing students more strictly')) treatmentScore -= 2;
    if (perfTreatment.includes('Treats struggling students more strictly')) treatmentScore -= 4;
    if (perfTreatment.includes('Treats students differently based on marks / academic performance')) treatmentScore -= 4;

    if (singledOut === 'Frequently') treatmentScore -= 8;
    else if (singledOut === 'Sometimes' || singledOut === 'Yes, but only in specific situations') treatmentScore -= 4;

    treatmentScore = Math.max(4, Math.min(20, treatmentScore));

    // 3. APPROACHABILITY (Max 15 pts) - Normalized
    const approachability = feedbackData.approachability || 'Usually approachable';
    let approachabilityScore = null; // null if excluded
    if (approachability === 'Very approachable') approachabilityScore = 15;
    else if (approachability === 'Usually approachable') approachabilityScore = 12;
    else if (approachability === 'Sometimes approachable') approachabilityScore = 9;
    else if (approachability === 'Often difficult to reach') approachabilityScore = 5;
    else if (approachability === 'Almost never available') approachabilityScore = 2;
    else if (approachability === 'Tends to neglect students') approachabilityScore = 1;
    else if (approachability === 'Never tried approaching') approachabilityScore = null; // Excluded from calculation

    // 4. ATTENDANCE EXPERIENCE (Max 10 pts) - Normalized
    const attendanceResponse = feedbackData.attendanceResponse || 'Considered genuine reasons on a case-by-case basis';
    let attendanceScore = null;
    if (attendanceResponse === 'Considered genuine reasons on a case-by-case basis') attendanceScore = 10;
    else if (attendanceResponse === 'Usually understanding') attendanceScore = 9;
    else if (attendanceResponse === 'Sometimes understanding') attendanceScore = 7;
    else if (attendanceResponse === 'Strict about the attendance requirement') attendanceScore = 5;
    else if (attendanceResponse === 'Usually did not make exceptions') attendanceScore = 4;
    else if (attendanceResponse === 'I never experienced this situation' || attendanceResponse === 'Not sure') attendanceScore = null; // Excluded

    // 5. EVALUATION / SCORING EXPERIENCE (Max 10 pts)
    let evalScore = 8; // default reasonable benchmark based on reported CIE/internal marks
    if (feedbackData.cieMarks !== null && feedbackData.cieMarks !== undefined) {
        if (feedbackData.cieMarks >= 40) evalScore += 2;
        else if (feedbackData.cieMarks < 25) evalScore -= 2;
    }

    // 6. OVERALL RECOMMENDATION (Max 20 pts)
    const rec = feedbackData.recommendation || 'Yes';
    let recScore = 17;
    if (rec === 'Definitely') recScore = 20;
    else if (rec === 'Yes') recScore = 17;
    else if (rec === 'Depends on the student') recScore = 12;
    else if (rec === 'Probably not') recScore = 6;
    else if (rec === 'No') recScore = 2;

    // COMPONENT WEIGHT NORMALIZATION (Handling "Not sure" / "Never tried" exclusions)
    let totalMaxPossible = 25 + 20 + (approachabilityScore !== null ? 15 : 0) + (attendanceScore !== null ? 10 : 0) + 10 + 20;
    let totalEarned = teachingScore + treatmentScore + (approachabilityScore !== null ? approachabilityScore : 0) + (attendanceScore !== null ? attendanceScore : 0) + evalScore + recScore;

    const normalizedTotalScore = Math.round((totalEarned / totalMaxPossible) * 100);
    return Math.max(10, Math.min(100, normalizedTotalScore));
};

export const getCommunityConfidence = (reviewCount = 0) => {
    if (reviewCount <= 0) return { label: 'No feedback yet', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    if (reviewCount < 5) return { label: 'Not enough feedback', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    if (reviewCount < 10) return { label: 'Early insights', badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
    if (reviewCount < 25) return { label: 'Emerging picture', badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' };
    if (reviewCount < 50) return { label: 'Good community signal', badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
    if (reviewCount < 100) return { label: 'Strong community signal', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' };
    return { label: 'Highly reviewed', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30' };
};

export const getScoreInterpretationLabel = (score = 85) => {
    if (score >= 90) return 'Exceptional Community Experience';
    if (score >= 80) return 'Very Positive';
    if (score >= 70) return 'Generally Positive';
    if (score >= 60) return 'Mixed Experience';
    if (score >= 50) return 'Needs Context';
    return 'Mixed / Challenging Experience';
};
