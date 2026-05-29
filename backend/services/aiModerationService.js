const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Moderates a message using Groq's fast LLaMA model.
 * Returns the number of demerit points to award, and any specific flagged categories.
 */
const checkToxicity = async (message) => {
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `You are a strict moderation API. Analyze the student's message and determine if it contains abuse, harassment, sexual content, hate speech, or threats.
Respond ONLY with a valid JSON object in this exact format. Do not include any other text, markdown formatting, or explanations.
{
  "hate": boolean,
  "violence": boolean,
  "harassment_threat": boolean,
  "harassment": boolean,
  "sexual": boolean,
  "mild_toxicity": boolean
}`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const resultText = response.choices[0]?.message?.content || "{}";
        const cats = JSON.parse(resultText);

        let points = 0;
        let flags = [];

        if (cats.hate) { points += 10; flags.push("hate_speech"); }
        if (cats.violence) { points += 10; flags.push("violence"); }
        if (cats.harassment_threat) { points += 5; flags.push("harassment_threat"); }
        else if (cats.harassment) { points += 3; flags.push("harassment"); }
        if (cats.sexual) { points += 5; flags.push("sexual"); }
        
        if (points === 0 && cats.mild_toxicity) {
            points += 1;
            flags.push("mild_toxicity");
        }

        return {
            isFlagged: points > 0,
            points: points,
            flags: flags
        };

    } catch (error) {
        console.error("Error calling Groq Moderation:", error);
        // Fail open if the moderation API is down
        return { isFlagged: false, points: 0, flags: [] };
    }
};

module.exports = {
    checkToxicity
};
