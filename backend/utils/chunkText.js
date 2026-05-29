/**
 * Splits extracted text into smaller chunks based on word count with an overlap.
 * 
 * @param {string} text - The extracted text to chunk.
 * @param {number} chunkSize - Number of words per chunk (e.g., 400).
 * @param {number} overlap - Number of overlapping words between chunks (e.g., 80).
 * @returns {Array<string>} - Array of chunked text strings.
 */
const chunkText = (text, chunkSize = 400, overlap = 80) => {
    if (!text || typeof text !== 'string') return [];

    const words = text.split(/\s+/).filter(word => word.length > 0);
    const chunks = [];
    
    if (words.length === 0) return chunks;

    let i = 0;
    while (i < words.length) {
        // Slice the next 'chunkSize' words
        const chunkWords = words.slice(i, i + chunkSize);
        const chunkString = chunkWords.join(' ');
        
        chunks.push(chunkString);
        
        // Advance pointer, but step back by the overlap amount
        // If we reach the end or if the step is somehow 0, we must break to avoid infinite loops
        const step = chunkSize - overlap;
        if (step <= 0) break; 
        
        i += step;
    }

    return chunks;
};

module.exports = { chunkText };
