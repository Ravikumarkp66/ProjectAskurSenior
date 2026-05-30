const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GRADE_MAP = {
    'O': 90,
    'A+': 80,
    'A': 70,
    'B+': 60,
    'B': 55,
    'C': 50,
    'P': 40
};

// --- CALCULATORS ---

function calculateGradeRequirement(cie, targetGrade, seeMax = 100) {
    const gradeThresholdPercent = GRADE_MAP[targetGrade.toUpperCase()];
    if (!gradeThresholdPercent) return null;

    const totalSubjectMarks = 50 + seeMax; // Assume 50 CIE max + SEE max
    const requiredTotalMarks = Math.ceil((gradeThresholdPercent / 100) * totalSubjectMarks);
    const requiredSEE = requiredTotalMarks - cie;

    return `🎯 Required SEE Marks for ${targetGrade.toUpperCase()} Grade

Formula:
Required Total = ${gradeThresholdPercent}% × Total Subject Marks

Calculation:
Total Subject Marks = 50 (CIE) + ${seeMax} (SEE) = ${totalSubjectMarks}
Required Total = ${gradeThresholdPercent}% × ${totalSubjectMarks} = ${requiredTotalMarks}
Required SEE Marks = ${requiredTotalMarks} − ${cie} (CIE)
Required SEE Marks = ${requiredSEE}

✅ Final Result
You need at least ${requiredSEE} marks out of ${seeMax} in SEE to secure an ${targetGrade.toUpperCase()} Grade.`;
}

function calculateSGPA(credits, points) {
    if (!Array.isArray(credits) || !Array.isArray(points) || credits.length !== points.length || credits.length === 0) {
        return null;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    for (let i = 0; i < credits.length; i++) {
        totalPoints += credits[i] * points[i];
        totalCredits += credits[i];
    }

    const sgpa = (totalPoints / totalCredits).toFixed(2);

    return `🎯 SGPA Calculation

Formula:
SGPA = Σ (Grade Points × Credits) / Σ Credits

Calculation:
Total Credits = ${totalCredits}
Total Points Earned = ${totalPoints}
SGPA = ${totalPoints} / ${totalCredits}

✅ Final Result
Your SGPA is ${sgpa}.`;
}

function calculateCGPA(sgpas) {
    if (!Array.isArray(sgpas) || sgpas.length === 0) return null;
    
    const sum = sgpas.reduce((a, b) => a + b, 0);
    const cgpa = (sum / sgpas.length).toFixed(2);

    return `🎯 CGPA Calculation

Formula:
CGPA = Average of all SGPAs

Calculation:
Sum of SGPAs = ${sum.toFixed(2)}
Number of Semesters = ${sgpas.length}
CGPA = ${sum.toFixed(2)} / ${sgpas.length}

✅ Final Result
Your CGPA is ${cgpa}.`;
}

function calculateAttendance(currentPercentage, classesConducted, targetPercentage = 75) {
    // Current attended classes
    const attended = Math.round((currentPercentage / 100) * classesConducted);
    
    // We want: (attended + x) / (classesConducted + x) = targetPercentage / 100
    // let t = targetPercentage / 100
    // attended + x = t * classesConducted + t * x
    // x(1 - t) = t * classesConducted - attended
    // x = (t * classesConducted - attended) / (1 - t)

    const t = targetPercentage / 100;
    
    if (currentPercentage >= targetPercentage) {
        return `🎯 Attendance Calculation

✅ Final Result
Your attendance is already ${currentPercentage}%, which is above the required ${targetPercentage}%. Keep it up!`;
    }

    const requiredClasses = Math.ceil((t * classesConducted - attended) / (1 - t));

    return `🎯 Attendance Requirement Calculation

Formula:
Target Attendance = (Attended Classes + New Classes) / (Conducted Classes + New Classes)

Calculation:
Current Percentage = ${currentPercentage}%
Classes Conducted = ${classesConducted}
Classes Attended = ${attended}

To reach ${targetPercentage}%:
Required Classes to Attend = Math.ceil((${t} * ${classesConducted} - ${attended}) / (1 - ${t}))
Required Classes = ${requiredClasses}

✅ Final Result
You need to attend the next ${requiredClasses} consecutive classes to reach ${targetPercentage}% attendance.`;
}

function calculateCIE(test1, test2, quiz, abl) {
    // Basic theoretical CIE rules based on average/sums
    const testsTotal = (test1 || 0) + (test2 || 0);
    const testConverted = (testsTotal / 100) * 34; // Reduced to 34
    
    const quizConverted = ((quiz || 0) / 40) * 8;
    const ablConverted = ((abl || 0) / 40) * 8;
    
    const total = Math.round(testConverted + quizConverted + ablConverted);

    return `🎯 CIE Marks Calculation (Standard Theory)

Formula:
CIE = Tests (Reduced to 34) + Quiz (Reduced to 8) + ABL (Reduced to 8)

Calculation:
Tests Total = ${testsTotal}/100 → Converted: ${testConverted.toFixed(2)}/34
Quiz = ${quiz || 0}/40 → Converted: ${quizConverted.toFixed(2)}/8
ABL = ${abl || 0}/40 → Converted: ${ablConverted.toFixed(2)}/8

Total CIE = ${testConverted.toFixed(2)} + ${quizConverted.toFixed(2)} + ${ablConverted.toFixed(2)} = ${total}

✅ Final Result
Your calculated final CIE marks are ${total}/50.`;
}

// --- ROUTER & PARSER ---

async function parseIntentAndVariables(question) {
    const prompt = `
You are an intent parser for an academic calculator.
Analyze the user's question and determine if they are asking for a mathematical calculation related to their academics.

Supported Intents:
1. "grade_requirement" (Requires: cie, targetGrade. IMPORTANT: totalSubjectMarks is strictly optional. Do NOT set isMissingVariables to true if totalSubjectMarks is not provided.)
2. "sgpa" (Requires: credits (array of numbers), points (array of numbers))
3. "cgpa" (Requires: sgpas (array of numbers))
4. "attendance" (Requires: currentPercentage, classesConducted, optionally targetPercentage)
5. "cie" (Requires: test1, test2, optionally quiz, abl)
6. "none" (For standard questions, rulebook questions, or material search)

Return ONLY a valid JSON object.
Format:
{
    "intent": "intent_name",
    "variables": { ... }
}

Example 1:
Question: "I have 42 CIE. How much for O grade?"
{
    "intent": "grade_requirement",
    "variables": { "cie": 42, "targetGrade": "O" }
}

Example 2:
Question: "My attendance is 72%. Conducted is 60. How to get 75%?"
{
    "intent": "attendance",
    "variables": { "currentPercentage": 72, "classesConducted": 60, "targetPercentage": 75 }
}

Example 3:
Question: "What is SGPA?"
{
    "intent": "none"
}

Question: "${question}"
`;

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile", // Use a faster model for parsing
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (err) {
        console.error("Intent parsing failed", err);
        return { intent: "none" };
    }
}

async function processAcademicCalculation(question) {
    console.log(`[ACADEMIC CALCULATOR] Processing: ${question}`);
    const parsed = await parseIntentAndVariables(question);
    
    console.log(`[ACADEMIC CALCULATOR] Parsed:`, parsed);

    if (!parsed || parsed.intent === "none" || !parsed.variables) {
        return null;
    }

    const { intent, variables } = parsed;
    console.log("Intent:", intent);

    try {
        switch (intent) {
            case "grade_requirement":
                if (variables.cie === undefined || !variables.targetGrade) {
                    return "Please provide both your current CIE marks and your target grade to calculate the required SEE marks.";
                }
                return calculateGradeRequirement(variables.cie, variables.targetGrade, variables.totalSubjectMarks || 100);
            case "sgpa":
                if (!variables.credits || !variables.points) return null;
                return calculateSGPA(variables.credits, variables.points);
            case "cgpa":
                if (!variables.sgpas) return null;
                return calculateCGPA(variables.sgpas);
            case "attendance":
                if (variables.currentPercentage === undefined || variables.classesConducted === undefined) {
                    return "Please provide both your current attendance percentage and the total number of classes conducted.";
                }
                return calculateAttendance(variables.currentPercentage, variables.classesConducted, variables.targetPercentage || 75);
            case "cie":
                if (variables.test1 === undefined || variables.test2 === undefined) return null;
                return calculateCIE(variables.test1, variables.test2, variables.quiz, variables.abl);
            default:
                return null;
        }
    } catch (err) {
        console.error("[ACADEMIC CALCULATOR] Calculation Error:", err);
        return null;
    }
}

module.exports = {
    processAcademicCalculation
};
