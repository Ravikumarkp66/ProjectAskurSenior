const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentAcademicEventSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'StudentAccount', required: true },
    title: { type: String, required: true },
    eventType: { 
        type: String, 
        enum: ['Exam', 'CIE / Test', 'Quiz', 'Vacation', 'Semester End', 'Government Holiday', 'College Fest', 'Custom'], 
        required: true 
    },
    scope: { type: String, enum: ['college', 'personal'], default: 'personal' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isAllDay: { type: Boolean, default: true },
    classesSuspended: { type: Boolean, default: false },
    suspensionType: { type: String, enum: ['none', 'full_day', 'time_range'], default: 'none' },
    suspensionStartMinute: { type: Number, default: 0 },
    suspensionEndMinute: { type: Number, default: 0 },
    affectedSubjects: [{ type: Schema.Types.ObjectId, ref: 'AcademicSubjectCms' }],
    description: { type: String, default: '' },
    repeat: { type: String, enum: ['none', 'weekly', 'monthly', 'yearly'], default: 'none' }
}, { timestamps: true, collection: 'student_academic_events', versionKey: false });

studentAcademicEventSchema.index({ student: 1, startDate: 1, endDate: 1 });
module.exports = mongoose.model('StudentAcademicEvent', studentAcademicEventSchema);
