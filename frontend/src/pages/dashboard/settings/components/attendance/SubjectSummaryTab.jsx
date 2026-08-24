import React from 'react';
import { BookOpen } from 'lucide-react';
import SubjectProgressList from '../SubjectProgressList';

const SubjectSummaryTab = ({
    overallMetrics,
    progressList = []
}) => {
    const collegeThreshold = overallMetrics?.collegeThreshold || 85;
    const userThreshold = overallMetrics?.userThreshold || overallMetrics?.threshold || collegeThreshold;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#fff',
            width: '100%'
        }}>
            {/* Subject Summary Table */}
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
                        collegeDefaultThreshold={collegeThreshold}
                        userDefaultThreshold={userThreshold}
                    />
                )}
            </div>
        </div>
    );
};

export default SubjectSummaryTab;
