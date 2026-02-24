const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function applyOpacity(doc, opacity) {
    if (!doc) return;

    const o = clamp(Number(opacity), 0, 1);

    // jsPDF supports GState in many builds, but not all. Guard everything.
    if (typeof doc.GState === 'function' && typeof doc.setGState === 'function') {
        doc.setGState(new doc.GState({ opacity: o }));
        return;
    }

    // Fallback: no real opacity support. We'll keep black but very thin lines.
}

function drawStamp(doc, { size = 450, rotation = -15 } = {}) {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    const cx = w / 2;
    const cy = h / 2;

    const outerR = size * 0.34;
    const innerR = size * 0.29;

    // Rotate around center
    if (typeof doc.saveGraphicsState === 'function') doc.saveGraphicsState();
    if (typeof doc.rotate === 'function') {
        doc.rotate(rotation, { origin: [cx, cy] });
    }

    doc.setDrawColor(0);
    doc.setTextColor(0);
    doc.setLineWidth(1);

    doc.circle(cx, cy, outerR);
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, innerR);

    // Minimal text layout (straight, not curved) for compatibility.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RESULT ANALYSIS REPORT', cx, cy - innerR + 28, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text('ASK+ VERIFIED', cx, cy + innerR - 18, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    doc.text('ASK+', cx, cy + 18, { align: 'center' });

    if (typeof doc.restoreGraphicsState === 'function') doc.restoreGraphicsState();
}

export function addWatermarkToAllPages(doc, { opacity = 0.05, size = 450, rotation = -15 } = {}) {
    if (!doc) return;

    const o = clamp(Number(opacity), 0, 1);
    const s = clamp(Number(size), 120, 800);
    const r = Number(rotation) || 0;

    const pages = typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : 1;

    for (let p = 1; p <= pages; p++) {
        if (typeof doc.setPage === 'function') doc.setPage(p);

        if (typeof doc.saveGraphicsState === 'function') doc.saveGraphicsState();
        applyOpacity(doc, o);

        drawStamp(doc, { size: s, rotation: r });

        if (typeof doc.restoreGraphicsState === 'function') doc.restoreGraphicsState();
    }
}
