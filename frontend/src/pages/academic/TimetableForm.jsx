import React, { useState, useMemo, useEffect } from 'react';

const TimetableForm = ({ timetable, setTimetable, subjects, config }) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const [draggedSubject, setDraggedSubject] = useState(null);

  // Generate slots based on config
  const timeSlots = useMemo(() => {
    if (!config.collegeStartTime || !config.collegeEndTime || !config.classDuration) return [];

    const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const slots = [];
    let current = new Date(`2026-01-01T${config.collegeStartTime}:00`);
    const end = new Date(`2026-01-01T${config.collegeEndTime}:00`);
    const duration = parseInt(config.classDuration);

    const specialSlots = [
      { start: new Date(`2026-01-01T${config.lunchStartTime}:00`), end: new Date(`2026-01-01T${config.lunchEndTime}:00`), type: 'LUNCH' },
      { start: new Date(`2026-01-01T${config.breakStartTime}:00`), end: new Date(`2026-01-01T${config.breakEndTime}:00`), type: 'BREAK' }
    ].sort((a, b) => a.start - b.start);

    while (current < end) {
      // Check if a special slot starts exactly now
      const special = specialSlots.find(s => s.start.getTime() === current.getTime());
      
      if (special) {
        slots.push({ 
          start: formatTime(special.start), 
          end: formatTime(special.end), 
          type: special.type 
        });
        current = special.end;
      } else {
        // Calculate normal class end
        let slotEnd = new Date(current.getTime() + duration * 60000);
        
        // Check if this class would overlap with the NEXT special slot
        const nextSpecial = specialSlots.find(s => s.start > current && s.start < slotEnd);
        
        if (nextSpecial) {
          // Cut class short to meet the special slot
          slotEnd = nextSpecial.start;
        }

        // Cap at college end time
        if (slotEnd > end) slotEnd = end;

        slots.push({ 
          start: formatTime(current), 
          end: formatTime(slotEnd), 
          type: 'class' 
        });
        current = slotEnd;
      }
    }
    return slots;
  }, [config]);

  // Clean up any orphaned/overlapping classes from old configs
  useEffect(() => {
    if (timeSlots.length === 0) return;
    
    let isDirty = false;
    const cleanedTimetable = { ...timetable };
    
    days.forEach(day => {
      const dayClasses = cleanedTimetable[day] || [];
      const validClasses = dayClasses.filter(c => 
        timeSlots.some(slot => slot.type === 'class' && slot.start === c.start && slot.end === c.end)
      );
      
      if (validClasses.length !== dayClasses.length) {
        cleanedTimetable[day] = validClasses;
        isDirty = true;
      }
    });

    if (isDirty) {
      setTimeout(() => setTimetable(cleanedTimetable), 0);
    }
  }, [timeSlots]);

  const onDragStart = (subjectName) => {
    setDraggedSubject(subjectName);
  };

  const onDrop = (day, slotIndex) => {
    if (!draggedSubject) return;
    
    const slot = timeSlots[slotIndex];
    const newEntry = { subject: draggedSubject, start: slot.start, end: slot.end };
    
    const updatedDay = [...(timetable[day] || [])];
    // Find if a slot already exists for this time and replace it, or just add
    const existingIdx = updatedDay.findIndex(s => s.start === slot.start);
    if (existingIdx > -1) {
      updatedDay[existingIdx] = newEntry;
    } else {
      updatedDay.push(newEntry);
    }

    setTimetable({ ...timetable, [day]: updatedDay });
    setDraggedSubject(null);
  };

  const removeSlot = (day, start) => {
    const updatedDay = (timetable[day] || []).filter(s => s.start !== start);
    setTimetable({ ...timetable, [day]: updatedDay });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar: Draggable Subjects */}
        <div className="md:w-1/4 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Draggable Subjects</h3>
          <div className="flex flex-wrap md:flex-col gap-2">
            {subjects.map((sub, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => onDragStart(sub.subjectName)}
                className="px-4 py-3 bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-xl cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-all shadow-sm flex items-center gap-3 group"
              >
                <div className="w-2 h-2 bg-indigo-500 rounded-full group-hover:scale-150 transition-transform"></div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{sub.subjectName}</span>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-xs text-red-500 italic">No subjects added yet.</p>
            )}
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">Drag a subject and drop it into a time slot on the right.</p>
        </div>

        {/* Main: Timetable Grid */}
        <div className="md:w-3/4 overflow-x-auto pb-4 custom-scrollbar min-w-0">
          <div className="min-w-[800px] grid grid-cols-7 gap-4">
            {/* Header: Days */}
            <div className="sticky left-0 bg-gray-50 dark:bg-gray-900 z-10"></div>
            {days.map(day => (
              <div key={day} className="text-center py-2 bg-indigo-600 text-white rounded-t-xl text-xs font-black uppercase tracking-tighter">
                {day.substring(0, 3)}
              </div>
            ))}

            {/* Time Slots Rows */}
            {timeSlots.map((slot, sIdx) => (
              <React.Fragment key={sIdx}>
                {/* Time Label */}
                <div className="flex flex-col justify-center pr-4">
                  <span className="text-[10px] font-black text-gray-400">{slot.start}</span>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 w-full my-1"></div>
                  <span className="text-[10px] font-black text-gray-400">{slot.end}</span>
                </div>

                {/* Day Columns for this Time Slot */}
                {days.map(day => {
                  const dayEntry = (timetable[day] || []).find(s => s.start === slot.start);
                  const isSpecial = slot.type !== 'class';

                  return (
                    <div
                      key={`${day}-${sIdx}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => !isSpecial && onDrop(day, sIdx)}
                      className={`h-20 rounded-xl border-2 border-dashed transition-all flex items-center justify-center p-2 relative group ${
                        isSpecial 
                          ? 'bg-gray-100 dark:bg-gray-800/50 border-transparent cursor-not-allowed'
                          : dayEntry 
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      {isSpecial ? (
                        <span className="text-[10px] font-black tracking-widest text-gray-400 rotate-90 md:rotate-0">
                          {slot.type}
                        </span>
                      ) : dayEntry ? (
                        <>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 leading-tight">
                              {dayEntry.subject}
                            </p>
                          </div>
                          <button
                            onClick={() => removeSlot(day, slot.start)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-medium text-gray-300 group-hover:text-indigo-400">
                          Empty
                        </span>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableForm;
