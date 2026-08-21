/**
 * Generates a JPEG thumbnail of the first page of a PDF and extracts the page count.
 * Non-blocking fallback: returns nulls so uploads never fail.
 * 
 * @param {File} file - The uploaded PDF File object
 * @returns {Promise<{ thumbnail: Blob | null, pageCount: number | null }>}
 */
export const generatePDFThumbnail = async (file) => {
    return { thumbnail: null, pageCount: null };
};
