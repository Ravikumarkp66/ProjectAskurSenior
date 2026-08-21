import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import AttendanceSummaryCard from '../AttendanceSummaryCard';
import SubjectProgressList from '../SubjectProgressList';

const SubjectSummaryTab = ({
    overallMetrics,
    progressList = [],
    onEditSubjectHistory
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#fff',
            width: '100%'
        }}>
            {/* Header Banner */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} style={{ color: '#a78bfa' }} />
                        Subject Performance & Historical Analytics
                    </h2>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                        Review subject-wise attendance percentages, streaks, predictions, and detailed timeline history.
                    </p>
                </div>
            </div>

            {/* Overall Metrics Summary Card */}
            {overallMetrics && (
                <AttendanceSummaryCard overall={overallMetrics} />
            )}

            {/* Subject Progress List */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                {progressList.length === 0 ? (
                    <div style={{
                        padding: '60px 24px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <BookOpen size={36} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>No registered subjects found.</div>
                    </div>
                ) : (
                    <SubjectProgressList
                        subjects={progressList}
                        onEditClick={onEditSubjectHistory}
                    />
                )}
            </div>
        </div>
    );
};

export default SubjectSummaryTab;
