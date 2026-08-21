const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentTimetableBackupSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'StudentAccount', required: true },
    semester: { type: Number, required: true },
    configuration: { type: Schema.Types.Mixed },
    slots: { type: Schema.Types.Array },
    attendanceEntries: { type: Schema.Types.Array },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // 24-hour TTL index
});

module.exports = mongoose.model('StudentTimetableBackup', studentTimetableBackupSchema);
