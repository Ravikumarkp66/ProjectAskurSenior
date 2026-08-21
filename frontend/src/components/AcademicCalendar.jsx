import React, { useMemo, useState, useEffect } from 'react';
import academicAPI from '../services/academicService';
import { useAuth } from '../utils/hooks';
import { logAcademicActivity } from '../utils/academicStreak';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  addMonths,
  subMonths,
  getDay
} from 'date-fns';

const EVENT_TYPES = [
  { id: 'internal', label: 'Internal', color: '#EF4444', icon: '🖋️' },
  { id: 'quiz', label: 'Quiz', color: '#F59E0B', icon: '⚡' },
  { id: 'abl', label: 'ABL Activity', color: '#10B981', icon: '🎨' },
  { id: 'exam', label: 'Exam', color: '#4F46E5', icon: '📝' },
  { id: 'other', label: 'Other', color: '#6B7280', icon: '📌' }
];

const AcademicCalendar = ({ config, timetable, subjects = [], isLightMode, isCollapsed, setIsCollapsed, selectedDate, setSelectedDate }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [manualEvents, setManualEvents] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [triggering, setTriggering] = useState(false);

  const handleTriggerWhatsApp = async () => {
    try {
      setTriggering(true);
      const res = await academicAPI.triggerWhatsApp();
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger report');
    } finally {
      setTriggering(false);
    }
  };

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: 'internal',
    subject: '',
    startTime: '10:00',
    endTime: '11:00'
  });

  // Fetch all manual events for the current month
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const res = await academicAPI.getAcademicEvents({ month, year });
        setManualEvents(res.data.events || []);
      } catch (err) {
        console.error('Error fetching manual events:', err);
      }
    };
    fetchEvents();
  }, [currentDate]);

  // Load tasks when selected date changes or modal opens
  const loadTasks = async (date) => {
    try {
      setTasksLoading(true);
      const res = await academicAPI.getDailyTasks(format(date, 'yyyy-MM-dd'));
      setDailyTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleDateClick = (day) => {
    if (isSameDay(day, selectedDate)) {
      loadTasks(day);
      setIsModalOpen(true);
    } else {
      setSelectedDate(day);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || dailyTasks.length >= 3) return;
    const updatedTasks = [...dailyTasks, { text: newTask, completed: false }];
    setDailyTasks(updatedTasks);
    setNewTask('');
    try {
      await academicAPI.saveDailyTasks(format(selectedDate, 'yyyy-MM-dd'), updatedTasks);
    } catch (err) {
      console.error('Error saving tasks:', err);
    }
  };

  const toggleTask = async (idx) => {
    const previous = dailyTasks[idx];
    const updatedTasks = dailyTasks.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t);
    setDailyTasks(updatedTasks);
    if (previous && !previous.completed && updatedTasks[idx]?.completed) {
      logAcademicActivity({
        type: 'planner_task',
        label: `Completed Planner Task: ${previous.text || 'Task'}`,
        meta: { date: format(selectedDate, 'yyyy-MM-dd') },
      });
    }
    try {
      await academicAPI.saveDailyTasks(format(selectedDate, 'yyyy-MM-dd'), updatedTasks);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleSaveEvent = async () => {
    const et = EVENT_TYPES.find(e => e.id === eventForm.type);
    const title = eventForm.type === 'other' ? 'Special Event' : `${et.label}: ${eventForm.subject}`;

    try {
      const res = await academicAPI.saveAcademicEvent({
        date: selectedDate.toISOString(),
        title,
        type: eventForm.type,
        color: et.color,
        subject: eventForm.subject,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime
      });
      setManualEvents([...manualEvents, res.data.event]);
      setShowEventForm(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add event. Check for overlaps!');
    }
  };

  const deleteEvent = async (id) => {
    try {
      await academicAPI.deleteAcademicEvent(id);
      setManualEvents(manualEvents.filter(e => e._id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const allEvents = useMemo(() => {
    if (!config) return [];

    const events = [
      { date: new Date(config.collegeStartDate), label: 'College Start', color: '#10B981', icon: '🚀', isGlobal: true },
      { date: new Date(config.lastWorkingDay), label: 'Last Working Day', color: '#F59E0B', icon: '🏁', isGlobal: true }
    ];

    if (config.examStartDate) {
      events.push({ date: new Date(config.examStartDate), label: 'Exams Start', color: '#EF4444', icon: '📝', isGlobal: true });
    }

    subjects.forEach(subject => {
      const eventTypes = [
        { field: 'internal01', label: 'Internal 01', icon: '🖋️' },
        { field: 'internal02', label: 'Internal 02', icon: '🖋️' },
        { field: 'quiz01', label: 'Quiz 01', icon: '⚡' },
        { field: 'quiz02', label: 'Quiz 02', icon: '⚡' },
        { field: 'abl01', label: 'ABL 01', icon: '🎨' },
        { field: 'abl02', label: 'ABL 02', icon: '🎨' }
      ];

      eventTypes.forEach(et => {
        if (subject[et.field]) {
          events.push({
            date: new Date(subject[et.field]),
            label: `${subject.subjectName} - ${et.label}`,
            color: subject.color || '#4F46E5',
            icon: et.icon,
            isGlobal: false
          });
        }
      });
    });

    manualEvents.forEach(me => {
      const timeStr = me.startTime ? ` (${me.startTime})` : '';
      events.push({
        date: new Date(me.date),
        label: `${me.title}${timeStr}`,
        color: me.color,
        icon: EVENT_TYPES.find(e => e.id === me.type)?.icon || '📌',
        isGlobal: false,
        id: me._id,
        startTime: me.startTime,
        endTime: me.endTime
      });
    });

    return events;
  }, [config, subjects, manualEvents]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayEvents = (day) => {
    return allEvents.filter(event => isSameDay(event.date, day));
  };

  const getDayName = (day) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[getDay(day)];
  };

  const selectedDayClasses = useMemo(() => {
    if (!timetable || !selectedDate) return [];
    const dayName = getDayName(selectedDate);
    const classes = timetable[dayName] || [];
    return [...classes].sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  }, [timetable, selectedDate]);

  return (
    <div className={`p-6 rounded-3xl border ${isLightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/5 border-white/10'} transition-all`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className={`text-xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          {(user?.isAdmin || user?.role === 'admin') && (
            <button
              onClick={handleTriggerWhatsApp}
              disabled={triggering}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {triggering ? 'Sending...' : 'Trigger Briefing'}
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${isLightMode ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white/5 border-white/10 text-gray-400'
              }`}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className={`p-2 rounded-xl border ${isLightMode ? 'hover:bg-gray-100 border-gray-200' : 'hover:bg-white/5 border-white/10'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className={`p-2 rounded-xl border ${isLightMode ? 'hover:bg-gray-100 border-gray-200' : 'hover:bg-white/5 border-white/10'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 pb-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isPast = isBefore(day, new Date()) && !isToday(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`relative min-h-[60px] sm:min-h-[80px] p-2 rounded-2xl border cursor-pointer transition-all ${!isCurrentMonth ? 'opacity-20' : ''
                    } ${isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                      : isToday(day)
                        ? 'border-indigo-400/50 bg-indigo-400/5'
                        : isLightMode ? 'border-gray-50' : 'border-white/[0.02]'
                    } ${dayEvents.length > 0 ? 'ring-1 ring-offset-2 ring-offset-transparent' : ''}`}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-indigo-500' :
                      isToday(day) ? 'text-indigo-400' :
                        isPast ? 'text-gray-400 line-through' :
                          isLightMode ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                    {format(day, 'd')}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((event, i) => (
                        <div
                          key={i}
                          title={event.label}
                          className={`text-[8px] sm:text-[9px] font-bold p-1 rounded-md text-white truncate leading-tight shadow-sm`}
                          style={{ backgroundColor: event.color }}
                        >
                          {event.icon} {event.label.split(' - ')[1] || event.label}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] text-gray-400 font-bold ml-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {isToday(day) && !isSelected && (
                    <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 py-4 border-t border-white/5">
            {allEvents.filter(e => e.isGlobal).map((sd, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sd.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{sd.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Date Actions Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-4xl rounded-3xl shadow-2xl border ${isLightMode ? 'bg-white border-gray-100' : 'bg-gray-900 border-white/10'} p-8 animate-slideUp`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-2xl font-black text-indigo-500">{format(selectedDate, 'do MMMM')}</h4>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{format(selectedDate, 'EEEE')}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setShowEventForm(false); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Classes Section */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Scheduled Classes</h5>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedDayClasses.length > 0 ? (
                    selectedDayClasses.map((cls, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{cls.subject}</p>
                        <p className="text-[9px] font-bold text-gray-500 mt-1">{cls.start} - {cls.end}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No Classes</p>
                    </div>
                  )}
                </div>
              </div>

              {/* To-Do List Section */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Daily To-Do ({dailyTasks.length}/3)</h5>
                <div className="space-y-2">
                  {tasksLoading ? (
                    <div className="h-4 w-full bg-gray-100 dark:bg-white/5 animate-pulse rounded" />
                  ) : dailyTasks.map((task, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={task.completed} onChange={() => toggleTask(i)} className="w-3 h-3 rounded border-emerald-500 text-emerald-500" />
                        <span className={`text-xs font-bold ${task.completed ? 'text-gray-400 line-through' : ''}`}>{task.text}</span>
                      </div>
                      <button onClick={() => {
                        const updated = dailyTasks.filter((_, idx) => idx !== i);
                        setDailyTasks(updated);
                        academicAPI.saveDailyTasks(format(selectedDate, 'yyyy-MM-dd'), updated);
                      }} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {dailyTasks.length < 3 && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                        className="flex-1 bg-gray-50 dark:bg-white/5 border-none rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        onClick={handleAddTask}
                        className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Events Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-500">Assign Events</h5>
                  {!showEventForm && (
                    <button onClick={() => setShowEventForm(true)} className="text-[8px] font-black uppercase tracking-widest bg-orange-500 text-white px-2 py-1 rounded">New Event</button>
                  )}
                </div>

                {showEventForm ? (
                  <div className="space-y-3 p-4 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 animate-fadeIn">
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                      className="w-full bg-white dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {EVENT_TYPES.map(et => (
                        <option key={et.id} value={et.id}>{et.label}</option>
                      ))}
                    </select>

                    {eventForm.type !== 'other' && (
                      <select
                        value={eventForm.subject}
                        onChange={(e) => setEventForm({ ...eventForm, subject: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((s, i) => (
                          <option key={i} value={s.subjectName}>{s.subjectName}</option>
                        ))}
                      </select>
                    )}

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[8px] font-bold text-gray-400 block mb-1">Start Time</label>
                        <input
                          type="time"
                          value={eventForm.startTime}
                          onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                          className="w-full bg-white dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[8px] font-bold text-gray-400 block mb-1">End Time</label>
                        <input
                          type="time"
                          value={eventForm.endTime}
                          onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                          className="w-full bg-white dark:bg-gray-800 border-none rounded-lg px-2 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setShowEventForm(false)} className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-[10px] font-bold">Cancel</button>
                      <button
                        onClick={handleSaveEvent}
                        disabled={eventForm.type !== 'other' && !eventForm.subject}
                        className="flex-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                    {allEvents.filter(e => isSameDay(e.date, selectedDate) && !e.isGlobal).length > 0 ? (
                      allEvents.filter(e => isSameDay(e.date, selectedDate) && !e.isGlobal).map((e, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 group">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                              <span className="text-xs font-bold truncate max-w-[120px]">{e.label}</span>
                            </div>
                            {(e.startTime || e.endTime) && (
                              <span className="text-[9px] text-gray-400 font-medium ml-4">
                                {e.startTime || '??:??'} - {e.endTime || '??:??'}
                              </span>
                            )}
                          </div>
                          {e.id && (
                            <button onClick={() => deleteEvent(e.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-500 italic text-center py-4">No events assigned.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCalendar;
