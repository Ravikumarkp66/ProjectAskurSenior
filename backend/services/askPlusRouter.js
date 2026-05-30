const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Parses the student's question and returns strict JSON intent and entities.
 */
const routeQuestion = async (question) => {
    try {
        const prompt = `Analyze the following student query and extract the intent and entities. 
You MUST return ONLY valid JSON and absolutely nothing else. No markdown formatting, no thinking, no explanations.

Valid Intents:
1. "material": Asking for study materials, notes, pyqs, lab manuals, syllabus, question banks.
2. "interview": Asking about company interview experiences, placement data, CTC, hiring.
3. "rulebook": Asking about academic rules, attendance requirements, branch change, exam regulations, condonation, grading.
4. "calculator": Asking to calculate SGPA, CGPA, grades, attendance percentage, CIE/SEE requirements.
5. "mentorship": Asking for career advice, resume review, project ideas, internship guidance, generic advice.
6. "general": Greetings, generic chit-chat, or anything that doesn't fit above.

Entities to extract (set to null if not present):
- "subject": Name of the subject (e.g., "DBMS", "Mathematics", "ADA", "Computer Networks", "OS"). Do NOT guess. If not mentioned, null.
- "branch": "CSE", "ISE", "ECE", "EEE", "ME", "CIVIL", "AIML".
- "semester": Integer between 1-8.
- "company": Company name (e.g., "Amazon", "TCS", "Infosys").

Output Format:
{
  "intent": "material" | "interview" | "rulebook" | "calculator" | "mentorship" | "general",
  "entities": {
    "subject": string | null,
    "branch": string | null,
    "semester": number | null,
    "company": string | null
  }
}

Student Query: "${question}"`;

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (error) {
        console.error("Error in askPlusRouter:", error);
        // Fallback to general if routing fails
        return { intent: "general", entities: { subject: null, branch: null, semester: null, company: null } };
    }
};

module.exports = { routeQuestion };
