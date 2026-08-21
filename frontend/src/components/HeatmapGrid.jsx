/**
 * HeatmapGrid — Universal contribution heatmap engine.
 *
 * Layout: Month-First Partition (TUF / Academic style)
 * ─────────────────────────────────────────────────────
 *   1. Each month is rendered as an independent block of week columns.
 *   2. August's block ends with August days active and September days as padding.
 *   3. September's block starts with August days as padding and September days active.
 *      This separates months strictly by their actual calendar boundaries: August ends on
 *      August 31st (Thursday) and September starts on September 1st (Friday) in their respective blocks.
 *   4. Fits 100% of the available width using a pure CSS flex layout:
 *        • Month blocks scale proportionally to their columns using `flex: [numColumns]`.
 *        • Columns inside the month block scale evenly with `flex: 1`.
 *        • Cells use `aspectRatio: '1'` to remain perfect squares.
 *      This completely eliminates rounding errors from Math.floor, keeping card sizes large and
 *      practically identical across all years regardless of the weekday layout.
 *   5. Month labels are centered above each month's columns (`textAlign: 'center'`).
 *
 * Domain-agnostic: palette, activities, and tooltips are injected by the consumer.
 *
 * Props
 * ─────
 *   startDate     Date      First day of the activity range (inclusive)
 *   endDate       Date      Last day of the activity range  (inclusive)
 *   activities    object    { "YYYY-MM-DD": { status: string, meta?: any } }
 *   palette       object    { [status]: { bg, border?, shadow? } }
 *   defaultStatus string    Status for dates absent from the activities map
 *   cellGap       number    Gap between cells in px         (default 3)
 *   monthGap      number    Gap between month blocks in px  (default 10)
 *   getCellTitle  fn        (date: Date, activity | null) => string
 */

import React, { useMemo } from 'react';

const MONTH_LABEL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Pure date utilities ───────────────────────────────────────────────────────────

function isoKey(date) {
    return (
        `${date.getFullYear()}-` +
        `${String(date.getMonth() + 1).padStart(2, '0')}-` +
        `${String(date.getDate()).padStart(2, '0')}`
    );
}

/** Monday of the ISO week containing `date`. */
function mondayOf(date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return d;
}

/** Sunday on or after `date`. */
function sundayOnOrAfter(date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const dow = d.getDay();
    if (dow !== 0) d.setDate(d.getDate() + (7 - dow));
    return d;
}

function addDays(date, n) {
    const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

// ─── Month block builder ───────────────────────────────────────────────────────────

function buildMonthBlocks(rangeStart, rangeEnd) {
    const rStart = new Date(rangeStart); rStart.setHours(0, 0, 0, 0);
    const rEnd   = new Date(rangeEnd);   rEnd.setHours(0, 0, 0, 0);

    const blocks = [];
    let y = rStart.getFullYear();
    let m = rStart.getMonth();

    while (true) {
        const monthStart = new Date(y, m, 1);
        if (monthStart > rEnd) break;

        const monthEnd   = new Date(y, m + 1, 0);               // last day of month
        const gridStart  = mondayOf(monthStart);                 // Monday ≤ 1st of month
        const gridEnd    = sundayOnOrAfter(                      // Sunday ≥ last day
            monthEnd <= rEnd ? monthEnd : rEnd
        );

        const weeks = [];
        let week    = [];
        let cur     = new Date(gridStart);

        while (cur <= gridEnd) {
            const inMonth = cur >= monthStart && cur <= monthEnd;
            const inRange = cur >= rStart     && cur <= rEnd;
            week.push({
                date:   new Date(cur),
                active: inMonth && inRange,   // true → active cell in this month's block
                key:    isoKey(cur),
            });
            if (week.length === 7) { weeks.push(week); week = []; }
            cur = addDays(cur, 1);
        }

        blocks.push({
            label: MONTH_LABEL[m],
            key: `${y}-${m}`,
            year: y,
            month: m,
            weeks
        });

        m++;
        if (m > 11) { m = 0; y++; }
    }

    return blocks;
}

// ─── Component ────────────────────────────────────────────────────────────────

const HeatmapGrid = ({
    startDate,
    endDate,
    activities    = {},
    palette       = {},
    defaultStatus = 'no-data',
    cellGap       = 3,
    monthGap      = 10,
    getCellTitle  = (d) => d.toLocaleDateString(),
    onCellClick   = null,
}) => {
    // Build month blocks — recomputed only when date range changes
    const blocks = useMemo(
        () => buildMonthBlocks(startDate, endDate),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [startDate?.getTime(), endDate?.getTime()]
    );

    const fallback = palette[defaultStatus] ?? {
        bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)'
    };

    return (
        <div style={{ width: '100%', overflow: 'hidden' }}>
            {/* ── Outer row: one block per calendar month ───────────────── */}
            <div style={{
                display:    'flex',
                gap:        `${monthGap}px`,
                width:      '100%',
                alignItems: 'flex-start',
            }}>
                {blocks.map(block => (
                    <div
                        key={block.key}
                        style={{
                            display:       'flex',
                            flexDirection: 'column',
                            gap:           '6px',
                            flex:          block.weeks.length,
                            minWidth:      0,
                        }}
                    >
                        {/* Month label — perfectly centered above this month's columns */}
                        <div style={{
                            fontSize:   '13px',
                            fontWeight: 700,
                            color:      '#c4b5fd',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                            textAlign:  'center',
                            width:      '100%',
                            marginBottom: '4px'
                        }}>
                            {block.label}
                        </div>

                        {/* ── Week columns for this month block ───────────────── */}
                        <div style={{ display: 'flex', gap: `${cellGap}px`, width: '100%' }}>
                            {block.weeks.map((week, wi) => (
                                <div
                                    key={wi}
                                    style={{
                                        display:       'flex',
                                        flexDirection: 'column',
                                        gap:           `${cellGap}px`,
                                        flex:          1,
                                    }}
                                >
                                    {week.map((day, di) => {
                                        if (!day.active) {
                                            return (
                                                <div
                                                    key={di}
                                                    style={{
                                                        width:        '100%',
                                                        aspectRatio:  '1',
                                                        borderRadius: '3px',
                                                    }}
                                                />
                                            );
                                        }

                                        const activity = activities[day.key] ?? null;
                                        const status   = activity?.status ?? defaultStatus;
                                        const p        = palette[status] ?? fallback;
                                        const title    = getCellTitle(day.date, activity);
                                        
                                        const overlays = activity?.overlays ?? [];
                                        const hasSemStart = overlays.includes('semesterStart');
                                        const hasSemEnd = overlays.includes('semesterEnd');
                                        const hasToday = overlays.includes('today');

                                        let borderStyle = p.border || 'none';
                                        let shadowStyle = p.shadow || 'none';

                                        if (hasSemStart) {
                                            borderStyle = '1.5px solid #a855f7';
                                        }
                                        if (hasSemEnd) {
                                            borderStyle = '1.5px solid #ec4899';
                                        }
                                        if (hasToday) {
                                            borderStyle = '1.5px solid #06b6d4';
                                            shadowStyle = '0 0 8px #06b6d4';
                                        }

                                        return (
                                            <div
                                                key={di}
                                                title={title}
                                                onClick={() => {
                                                    if (onCellClick) {
                                                        onCellClick(day.date);
                                                    }
                                                }}
                                                style={{
                                                    width:        '100%',
                                                    aspectRatio:  '1',
                                                    borderRadius: '3px',
                                                    background:   p.bg,
                                                    border:       borderStyle,
                                                    boxShadow:    shadowStyle,
                                                    cursor:       onCellClick ? 'pointer' : 'default',
                                                    transition:   'transform 0.12s',
                                                    position:     'relative',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'scale(1.35)';
                                                    e.currentTarget.style.zIndex    = '10';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.zIndex    = '0';
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeatmapGrid;
