class TimetableGeneratorService {
    /**
     * Generates a structured template of timetable slots based on configuration parameters
     * @param {Object} config - Timetable configuration
     * @returns {Array} List of generated slots (unpersisted objects)
     */
    generateSlots(studentId, config) {
        const {
            collegeStartMinute,
            collegeEndMinute,
            classDuration,
            workingDays,
            breaks
        } = config;

        const generatedSlots = [];

        const dayNumToKey = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun' };

        // Loop through days 1 to 7 (1 = Monday, 7 = Sunday)
        for (let day = 1; day <= 7; day++) {
            const dayKey = dayNumToKey[day];
            let dayType = 'Holiday';
            if (workingDays) {
                if (typeof workingDays.get === 'function') {
                    dayType = workingDays.get(day.toString()) || workingDays.get(day) || workingDays.get(dayKey);
                } else {
                    dayType = workingDays[day.toString()] || workingDays[day] || workingDays[dayKey];
                }
            }
            if (!dayType) {
                dayType = day <= 5 ? 'Full Day' : day === 6 ? 'Half Day' : 'Holiday';
            }
            
            if (dayType === 'Holiday') {
                continue; // Skip holiday days
            }

            // Calculate active working duration for this day
            const startLimit = collegeStartMinute;
            const endLimit = dayType === 'Half Day'
                ? Math.min(collegeEndMinute, startLimit + Math.round((collegeEndMinute - startLimit) / 2))
                : collegeEndMinute;

            let currentMinute = startLimit;

            // Sort breaks by start minute ascending
            const sortedBreaks = [...breaks].sort((a, b) => a.startMinute - b.startMinute);

            while (currentMinute < endLimit) {
                // Check if a break starts exactly at currentMinute
                const exactBreak = sortedBreaks.find(b => b.startMinute === currentMinute);
                if (exactBreak) {
                    generatedSlots.push({
                        student: studentId,
                        dayOfWeek: day,
                        startMinute: currentMinute,
                        endMinute: currentMinute + exactBreak.duration,
                        subject: null,
                        room: '',
                        faculty: '',
                        lectureType: 'Break',
                        status: 'Scheduled'
                    });
                    currentMinute += exactBreak.duration;
                    continue;
                }

                // Check if a break starts during the proposed class duration
                const upcomingBreak = sortedBreaks.find(b => b.startMinute > currentMinute && b.startMinute < currentMinute + classDuration);
                if (upcomingBreak) {
                    const classEnd = upcomingBreak.startMinute;
                    // Only create slot if it represents a reasonable block of time (>= 15 mins)
                    if (classEnd - currentMinute >= 15) {
                        generatedSlots.push({
                            student: studentId,
                            dayOfWeek: day,
                            startMinute: currentMinute,
                            endMinute: classEnd,
                            subject: null,
                            room: '',
                            faculty: '',
                            lectureType: 'Lecture',
                            status: 'Scheduled'
                        });
                    }
                    currentMinute = classEnd;
                    continue;
                }

                // Normal class slot (no break conflict)
                const proposedEnd = Math.min(endLimit, currentMinute + classDuration);
                if (proposedEnd - currentMinute >= 15) {
                    generatedSlots.push({
                        student: studentId,
                        dayOfWeek: day,
                        startMinute: currentMinute,
                        endMinute: proposedEnd,
                        subject: null,
                        room: '',
                        faculty: '',
                        lectureType: 'Lecture',
                        status: 'Scheduled'
                    });
                }
                currentMinute = proposedEnd;
            }
        }

        return generatedSlots;
    }

    /**
     * Helper to migrate/preserve existing subject assignments into newly generated slot templates.
     * Maps assignments if dayOfWeek matches and there is any temporal overlap between old and new slot boundaries.
     * @param {Array} oldSlots - Existing StudentTimetable documents in database
     * @param {Array} newSlots - Newly generated slot templates
     * @returns {Array} Migrated slots with subject/room/faculty fields copied where appropriate
     */
    migrateAssignments(oldSlots, newSlots) {
        return newSlots.map(slot => {
            if (slot.lectureType === 'Break') {
                return slot;
            }

            // Find overlapping class slots on the same day from old timetable
            const match = oldSlots.find(old => {
                if (old.dayOfWeek !== slot.dayOfWeek || old.lectureType === 'Break') return false;
                
                // Overlap condition:
                // max(start1, start2) < min(end1, end2)
                const maxStart = Math.max(old.startMinute, slot.startMinute);
                const minEnd = Math.min(old.endMinute, slot.endMinute);
                return maxStart < minEnd;
            });

            if (match) {
                return {
                    ...slot,
                    subject: match.subject || null,
                    room: match.room || '',
                    faculty: match.faculty || '',
                    lectureType: match.lectureType || 'Lecture',
                    status: match.status || 'Scheduled'
                };
            }

            return slot;
        });
    }
}

module.exports = new TimetableGeneratorService();
