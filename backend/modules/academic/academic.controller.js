const AcademicConfig = require('./AcademicConfig');
const Subject = require('./Subject');
const Timetable = require('./Timetable');
const DailyTask = require('./DailyTask');
const AcademicEvent = require('./AcademicEvent');
const AttendanceRecord = require('./AttendanceRecord');
const TimetableOverride = require('./TimetableOverride');
const User = require('../../models/User');
const { format } = require('date-fns');
const { sendWhatsAppMessage } = require('../whatsapp/whatsapp.service');
const { generateSetupCompleteMessage } = require('../assistant/messageGenerator');
const { calculateAttendance, getTodaySubjects, getDaysLeft } = require('./utils');

/**
 * Save academic configuration
 */
exports.saveSetup = async (req, res) => {
  try {
    const { 
      semester, collegeStartDate, lastWorkingDay, examStartDate, examEndDate,
      collegeStartTime, collegeEndTime, classDuration,
      lunchStartTime, lunchEndTime, breakStartTime, breakEndTime
    } = req.body;
    const userId = req.userId;

    // Validation: examStartDate >= lastWorkingDay (only if provided)
    if (examStartDate && lastWorkingDay && new Date(examStartDate) < new Date(lastWorkingDay)) {
      return res.status(400).json({ error: 'Exam start date cannot be before last working day' });
    }

    const config = await AcademicConfig.findOneAndUpdate(
      { userId },
      { 
        semester, collegeStartDate, lastWorkingDay, examStartDate, examEndDate,
        collegeStartTime, collegeEndTime, classDuration,
        lunchStartTime, lunchEndTime, breakStartTime, breakEndTime,
        trackingStartDate: req.body.trackingStartDate || Date.now(),
        catchUpMode: req.body.catchUpMode || 'none',
        attendanceThreshold: req.body.attendanceThreshold || 85
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Update user setup progress
    await User.findByIdAndUpdate(userId, { setupProgress: 'dates_done' });

    res.status(200).json({ message: 'Academic configuration saved successfully', config });
  } catch (error) {
    console.error('Save Setup Error:', error);
    res.status(500).json({ error: 'Failed to save academic configuration' });
  }
};

/**
 * Add multiple subjects
 */
exports.saveSubjects = async (req, res) => {
  try {
    const { subjects } = req.body; // Array of subject objects
    const userId = req.userId;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Invalid subjects data' });
    }

    // Delete existing subjects for this user to perform a full sync or update?
    // User said "Add multiple subjects", but usually setup means replacing or syncing.
    // I will use bulkWrite or just delete and insert for simplicity in setup.
    await Subject.deleteMany({ userId });

    const subjectsToSave = subjects.map(subject => ({
      userId,
      subjectName: subject.subjectName,
      totalClasses: subject.totalClasses || 0,
      attendedClasses: subject.attendedClasses || 0,
      lastUpdatedDate: subject.lastUpdatedDate,
      internal01: subject.internal01,
      internal02: subject.internal02,
      quiz01: subject.quiz01,
      quiz02: subject.quiz02,
      abl01: subject.abl01,
      abl02: subject.abl02,
      color: subject.color || '#4F46E5'
    }));

    const savedSubjects = await Subject.insertMany(subjectsToSave);

    res.status(200).json({ message: 'Subjects saved successfully', subjects: savedSubjects });
  } catch (error) {
    console.error('Save Subjects Error:', error);
    res.status(500).json({ error: 'Failed to save subjects' });
  }
};

/**
 * Save weekly timetable
 */
exports.saveTimetable = async (req, res) => {
  try {
    const { monday, tuesday, wednesday, thursday, friday, saturday } = req.body;
    const userId = req.userId;

    const timetable = await Timetable.findOneAndUpdate(
      { userId },
      { monday, tuesday, wednesday, thursday, friday, saturday },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Timetable saved successfully', timetable });
  } catch (error) {
    console.error('Save Timetable Error:', error);
    res.status(500).json({ error: 'Failed to save timetable' });
  }
};

/**
 * Get academic dashboard data
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.userId;

    const [config, subjects, timetable, user] = await Promise.all([
      AcademicConfig.findOne({ userId }),
      Subject.find({ userId }),
      Timetable.findOne({ userId }),
      User.findById(userId).select('phone whatsappEnabled priority name')
    ]);

    if (!config) {
      return res.status(404).json({ error: 'Academic setup not found' });
    }

    // Process dashboard data
    const todaySubjects = getTodaySubjects(timetable);
    
    const attendanceData = subjects.map(s => ({
      subjectName: s.subjectName,
      attendancePercentage: calculateAttendance(s.attendedClasses, s.totalClasses),
      attendedClasses: s.attendedClasses,
      totalClasses: s.totalClasses,
      internal01: s.internal01,
      internal02: s.internal02,
      quiz01: s.quiz01,
      quiz02: s.quiz02,
      abl01: s.abl01,
      abl02: s.abl02,
      color: s.color
    }));

    const daysToExams = getDaysLeft(config.examStartDate);

    res.status(200).json({
      config,
      todaySubjects,
      attendanceData,
      daysToExams,
      timetable,
      attendanceRecords: await AttendanceRecord.find({ userId }),
      timetableOverrides: await TimetableOverride.find({ userId }),
      user
    });
  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

/**
 * Finalize academic setup (phone, whatsapp, priority, todos)
 */
exports.finalizeSetup = async (req, res) => {
  try {
    const { phone, whatsappEnabled, priority, todos } = req.body;
    const userId = req.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { phone, whatsappEnabled, priority, todos, setupProgress: 'complete' },
      { new: true }
    );

    if (whatsappEnabled && phone) {
      const welcomeMsg = generateSetupCompleteMessage();
      await sendWhatsAppMessage(phone, welcomeMsg);
    }

    res.status(200).json({ message: 'Academic setup finalized successfully', user });
  } catch (error) {
    console.error('Finalize Setup Error:', error);
    res.status(500).json({ error: 'Failed to finalize academic setup' });
  }
};

/**
 * Reset/Delete academic setup
 */
exports.deleteSetup = async (req, res) => {
  try {
    const userId = req.userId;

    await Promise.all([
      AcademicConfig.deleteMany({ userId }),
      Subject.deleteMany({ userId }),
      Timetable.deleteMany({ userId })
    ]);

    // Optional: Reset user fields
    await User.findByIdAndUpdate(userId, {
      whatsappEnabled: false,
      todos: []
    });

    res.status(200).json({ message: 'Academic setup reset successfully' });
  } catch (error) {
    console.error('Reset Setup Error:', error);
    res.status(500).json({ error: 'Failed to reset academic setup' });
  }
};

/**
 * Get daily tasks for a specific date
 */
exports.getDailyTasks = async (req, res) => {
  try {
    const { date } = req.query; // Date string
    const userId = req.userId;

    if (!date) return res.status(400).json({ error: 'Date is required' });

    // Normalize date to 00:00:00 UTC
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const dailyTask = await DailyTask.findOne({ userId, date: normalizedDate });

    res.status(200).json({ tasks: dailyTask ? dailyTask.tasks : [] });
  } catch (error) {
    console.error('Get Daily Tasks Error:', error);
    res.status(500).json({ error: 'Failed to fetch daily tasks' });
  }
};

/**
 * Save/Update daily tasks
 */
exports.saveDailyTasks = async (req, res) => {
  try {
    const { date, tasks } = req.body;
    const userId = req.userId;

    if (!date || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Invalid task data' });
    }

    if (tasks.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 tasks per day allowed' });
    }

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    const dailyTask = await DailyTask.findOneAndUpdate(
      { userId, date: normalizedDate },
      { tasks },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Daily tasks saved successfully', tasks: dailyTask.tasks });
  } catch (error) {
    console.error('Save Daily Tasks Error:', error);
    res.status(500).json({ error: 'Failed to save daily tasks' });
  }
};

/**
 * Get manual academic events
 */
exports.getAcademicEvents = async (req, res) => {
  try {
    const userId = req.userId;
    const { date, month, year } = req.query;

    let query = { userId };
    
    if (date) {
      const normalizedDate = new Date(date);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      query.date = normalizedDate;
    } else if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const events = await AcademicEvent.find(query).sort({ date: 1 });
    res.status(200).json({ events });
  } catch (error) {
    console.error('Get Academic Events Error:', error);
    res.status(500).json({ error: 'Failed to fetch overall attendance percentage' });
  }
};

/**
 * Add or swap a class on the timetable for a specific date
 */
exports.addTimetableOverride = async (req, res) => {
  try {
    const { date, type, originalTimeSlot, newSubjectName, startTime, endTime } = req.body;
    const userId = req.userId;

    const newOverride = new TimetableOverride({
      userId,
      date,
      type,
      originalTimeSlot,
      newSubjectName,
      startTime,
      endTime
    });

    await newOverride.save();

    res.status(201).json({ message: 'Override added successfully', override: newOverride });
  } catch (error) {
    console.error('Add Timetable Override Error:', error);
    res.status(500).json({ error: 'Failed to add timetable override' });
  }
};

/**
 * Save/Add academic event
 */
exports.saveAcademicEvent = async (req, res) => {
  try {
    const { date, title, type, color, description, subject, startTime, endTime } = req.body;
    const userId = req.userId;

    if (!date || !title) {
      return res.status(400).json({ error: 'Date and Title are required' });
    }

    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // Overlap Check (Simplified: Check if same subject+type already exists at same time)
    if (startTime && endTime) {
      const existing = await AcademicEvent.findOne({
        userId,
        date: normalizedDate,
        $or: [
          { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
          { startTime: { $lt: endTime }, endTime: { $gte: endTime } }
        ]
      });

      if (existing) {
        return res.status(400).json({ error: `Event overlaps with ${existing.title} (${existing.startTime}-${existing.endTime})` });
      }
    }

    const event = new AcademicEvent({
      userId,
      date: normalizedDate,
      title,
      type,
      color: color || '#4F46E5',
      description,
      subject,
      startTime,
      endTime
    });

    await event.save();
    res.status(201).json({ message: 'Event added successfully', event });
  } catch (error) {
    console.error('Save Academic Event Error:', error);
    res.status(500).json({ error: 'Failed to save academic event' });
  }
};

/**
 * Delete academic event
 */
exports.deleteAcademicEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const event = await AcademicEvent.findOneAndDelete({ _id: id, userId });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete Academic Event Error:', error);
    res.status(500).json({ error: 'Failed to delete academic event' });
  }
};

/**
 * Admin trigger for WhatsApp Morning Report
 */
exports.triggerWhatsApp = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    // Check if admin
    if (!user.isAdmin && user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin only.' });
    }

    if (!user.phone || !user.whatsappEnabled) {
      return res.status(400).json({ error: 'WhatsApp not enabled or phone missing' });
    }

    const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Kolkata'});
    const today = new Date(todayStr);
    const hour = new Date().getHours(); // For greeting, local hour is fine or use IST
    let greetingPrefix = 'Good Morning';
    if (hour >= 12 && hour < 17) greetingPrefix = 'Good Afternoon';
    else if (hour >= 17 || hour < 4) greetingPrefix = 'Good Evening';

    today.setUTCHours(0, 0, 0, 0);
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).toLowerCase();

    // 1. Fetch Today's Data
    const [config, subjects, timetable, manualEvents, dailyTask] = await Promise.all([
      AcademicConfig.findOne({ userId }),
      Subject.find({ userId }),
      Timetable.findOne({ userId }),
      AcademicEvent.find({ userId, date: today }),
      DailyTask.findOne({ userId, date: today })
    ]);

    if (!config || !timetable) {
      return res.status(404).json({ error: 'Academic setup not found' });
    }

    const todayClasses = timetable[dayName] || [];
    const todayTasks = dailyTask ? dailyTask.tasks : [];
    const todayEvents = manualEvents || [];

    // 2. Class Suspension Logic
    const suspended = [];
    const finalClasses = todayClasses.filter(cls => {
      if (cls.subject === 'Unnamed Subject' || !cls.subject) return false;
      
      const overlap = todayEvents.some(evt => {
        if (!evt.startTime || !evt.endTime) return false;
        // Check time overlap
        return (evt.startTime <= cls.start && evt.endTime > cls.start) ||
               (evt.startTime < cls.end && evt.endTime >= cls.end) ||
               (cls.start <= evt.startTime && cls.end > evt.startTime);
      });

      if (overlap) {
        suspended.push(cls);
        return false;
      }
      return true;
    });

    // 3. Construct Message
    let message = `*🌟 ${greetingPrefix}, ${user.name}!* \n\n`;
    message += `📅 *Today's Briefing* (${format(today, 'do MMMM')})\n\n`;

    // Tasks Section
    if (todayTasks.length > 0) {
      message += `📝 *Daily To-Do:*\n`;
      todayTasks.forEach((t, i) => {
        message += `${i+1}. ${t.text} ${t.completed ? '✅' : '⏳'}\n`;
      });
      message += `\n`;
    }

    // Events Section
    if (todayEvents.length > 0) {
      message += `🚩 *Events & Deadlines:*\n`;
      todayEvents.forEach(e => {
        const time = e.startTime ? ` (${e.startTime}-${e.endTime})` : '';
        message += `• ${e.title}${time}\n`;
      });
      message += `\n`;
    }

    // Classes Section
    if (finalClasses.length > 0) {
      message += `📚 *Today's Classes:*\n`;
      finalClasses.forEach(c => {
        message += `• ${c.subject} (${c.start}-${c.end})\n`;
      });
    } else {
      message += `📚 *No regular classes today.* \n`;
    }

    if (suspended.length > 0) {
      message += `\n⚠️ *Suspended Classes:* \n`;
      suspended.forEach(s => {
        message += `• ~${s.subject} (${s.start}-${s.end})~\n`;
      });
      message += `_(Replaced by assigned events)_\n`;
    }

    message += `\nHave a productive day ahead! 🚀`;

    // 4. Send WhatsApp
    await sendWhatsAppMessage(user.phone, message);

    res.status(200).json({ 
      message: 'WhatsApp report triggered successfully!',
      suspendedCount: suspended.length,
      classesCount: finalClasses.length
    });

  } catch (error) {
    console.error('Trigger WhatsApp Error:', error);
    res.status(500).json({ error: 'Failed to trigger WhatsApp report' });
  }
};

/**
 * Mark Attendance from Dashboard
 */
exports.markAttendance = async (req, res) => {
  try {
    const { subjectName, timeSlot, status } = req.body;
    const userId = req.userId;
    const dateStr = format(new Date(), 'yyyy-MM-dd');

    // Check if record already exists
    const existing = await AttendanceRecord.findOne({ userId, subjectName, date: dateStr, timeSlot });
    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this class today' });
    }

    // Save record
    const record = new AttendanceRecord({
      userId,
      subjectName,
      date: dateStr,
      timeSlot,
      status
    });
    await record.save();

    // Update Subject counts if attended or missed
    if (status === 'attended' || status === 'missed') {
      const subject = await Subject.findOne({ userId, subjectName });
      if (subject) {
        subject.totalClasses += 1;
        if (status === 'attended') {
          subject.attendedClasses += 1;
        }
        await subject.save();
      }
    }

    // Fetch updated subjects to calculate the new total attendance percentage across all subjects
    const allSubjects = await Subject.find({ userId });
    
    res.status(200).json({ 
      message: 'Attendance marked successfully', 
      record,
      updatedSubjects: allSubjects.map(s => ({
        subjectName: s.subjectName,
        totalClasses: s.totalClasses,
        attendedClasses: s.attendedClasses
      }))
    });
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

/**
 * Undo Attendance
 */
exports.undoAttendance = async (req, res) => {
  try {
    const { recordId } = req.body;
    const userId = req.userId;

    const record = await AttendanceRecord.findOne({ _id: recordId, userId });
    if (!record) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    if (record.status === 'attended' || record.status === 'missed') {
      const subject = await Subject.findOne({ userId, subjectName: record.subjectName });
      if (subject) {
        subject.totalClasses = Math.max(0, subject.totalClasses - 1);
        if (record.status === 'attended') {
          subject.attendedClasses = Math.max(0, subject.attendedClasses - 1);
        }
        await subject.save();
      }
    }

    await AttendanceRecord.deleteOne({ _id: record._id });

    const allSubjects = await Subject.find({ userId });

    res.status(200).json({
      message: 'Attendance undone successfully',
      updatedSubjects: allSubjects.map(s => ({
        subjectName: s.subjectName,
        totalClasses: s.totalClasses,
        attendedClasses: s.attendedClasses
      }))
    });
  } catch (error) {
    console.error('Undo Attendance Error:', error);
    res.status(500).json({ error: 'Failed to undo attendance' });
  }
};
