import React, { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

import { apiV2 } from '../../../services/authService';
import AcademicCalendar from './components/AcademicCalendar';
import EventsTimeline from './components/EventsTimeline';
import EventModal from './components/EventModal';

const EventsSettings = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [initialDate, setInitialDate] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await apiV2.getAcademicEvents();
            if (res.data?.success) {
                setEvents(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching academic events:', err);
            toast.error('Failed to load academic events.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setSelectedEvent(null);
        setInitialDate(null);
        setIsModalOpen(true);
    };

    const handleDateClick = (dateStr, existingEvent) => {
        if (existingEvent) {
            setSelectedEvent(existingEvent);
            setInitialDate(null);
        } else {
            setSelectedEvent(null);
            setInitialDate(dateStr);
        }
        setIsModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setInitialDate(null);
        setIsModalOpen(true);
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event? This will restore any suspended timetable slots.')) {
            return;
        }

        try {
            const res = await apiV2.deleteAcademicEvent(id);
            if (res.data?.success) {
                toast.success('Event deleted successfully.');
                fetchEvents();
            }
        } catch (err) {
            console.error('Error deleting academic event:', err);
            toast.error('Failed to delete event.');
        }
    };

    const handleSaveEvent = async (payload) => {
        try {
            if (selectedEvent) {
                // Update
                const res = await apiV2.updateAcademicEvent(selectedEvent._id, payload);
                if (res.data?.success) {
                    toast.success('Event updated successfully.');
                    setIsModalOpen(false);
                    fetchEvents();
                }
            } else {
                // Create
                const res = await apiV2.createAcademicEvent(payload);
                if (res.data?.success) {
                    toast.success('Event created successfully.');
                    setIsModalOpen(false);
                    fetchEvents();
                }
            }
        } catch (err) {
            console.error('Error saving academic event:', err);
            toast.error(err.response?.data?.message || 'Failed to save event.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '800px',
            margin: '0 auto',
            paddingBottom: '40px'
        }}>
            {/* Header Title & Button */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                paddingBottom: '12px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarDays size={18} style={{ color: '#c4b5fd' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                            Academic Events
                        </h2>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', margin: 0 }}>
                        Configure holidays, fests, and exams that suspend schedule slots.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={fetchEvents}
                        disabled={loading}
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '8px',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleCreateClick}
                        style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Plus size={14} />
                        Add Event
                    </button>
                </div>
            </div>

            {/* Academic Heatmap Calendar */}
            <AcademicCalendar
                events={events}
                onDateClick={handleDateClick}
            />

            {/* Timeline Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Chronological Timeline
                </h3>
                <EventsTimeline
                    events={events}
                    onEditEvent={handleEditEvent}
                    onDeleteEvent={handleDeleteEvent}
                />
            </div>

            {/* Event Form Modal */}
            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                event={selectedEvent}
                initialDate={initialDate}
            />
        </div>
    );
};

export default EventsSettings;
