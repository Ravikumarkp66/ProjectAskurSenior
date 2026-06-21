import { pdfjs } from 'react-pdf';

// Configure the worker for pdfjs-dist internally used by react-pdf
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

/**
 * Generates a JPEG thumbnail of the first page of a PDF and extracts the page count.
 * Completely non-blocking: returns nulls if any error occurs to ensure uploads never fail.
 * 
 * @param {File} file - The uploaded PDF File object
 * @returns {Promise<{ thumbnail: Blob | null, pageCount: number | null }>}
 */
export const generatePDFThumbnail = async (file) => {
    try {
        if (!file || file.type !== 'application/pdf') {
            return { thumbnail: null, pageCount: null };
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const pageCount = pdf.numPages;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });

        // Target width of 600px for optimal quality/size ratio
        const targetWidth = 600;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };

        await page.render(renderContext).promise;

        // Convert canvas to blob (JPEG, 0.7 quality produces 40KB-150KB files)
        const blob = await new Promise((resolve) => {
            canvas.toBlob(
                (b) => resolve(b),
                'image/jpeg',
                0.7
            );
        });

        // Add a clean filename to the blob so multer can parse it properly
        if (blob) {
            blob.name = file.name.replace(/\.[^/.]+$/, "") + "_thumb.jpg";
        }

        return { thumbnail: blob, pageCount };
    } catch (error) {
        console.warn('Non-fatal: Failed to generate PDF thumbnail or extract page count:', error);
        // Never block the upload!
        return { thumbnail: null, pageCount: null };
    }
};
