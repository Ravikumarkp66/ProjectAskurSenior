const User = require('../../models/User');
const Subject = require('../academic/Subject');
const AttendanceSession = require('./AttendanceSession');
const WrapUpSession = require('./WrapUpSession');
const DailyTask = require('../academic/DailyTask');
const Timetable = require('../academic/Timetable');
const { sendWhatsAppMessage } = require('./whatsapp.service');

const handleWebhook = async (req, res) => {
  const { Body, From } = req.body;
  const phone = From.replace('whatsapp:', '');
  const input = Body.trim().toLowerCase();

  try {
    // 1. Check for Active Wrap-Up Session (Higher Priority)
    const wrapSession = await WrapUpSession.findOne({ phone, status: 'active' });
    if (wrapSession) {
      return await handleWrapUpReply(wrapSession, input, res);
    }

    // 2. Check for Pending Attendance Session
    const attendSession = await AttendanceSession.findOne({ phone, status: 'pending' });
    if (attendSession) {
      return await handleAttendanceReply(attendSession, input, res);
    }

    // No active session found
    console.log(`No active session for ${phone}`);
    return res.status(200).send('No active session');
  } catch (error) {
    console.error('Webhook Handler Error:', error);
    res.status(500).send('Error processing message');
  }
};

/**
 * Handle Class Attendance Replies (1/2 or yes/no)
 */
async function handleAttendanceReply(session, input, res) {
  const isYes = ['1', 'yes', 'y'].includes(input);
  const isNo = ['2', 'no', 'n'].includes(input);

  if (!isYes && !isNo) {
    return res.status(200).send('Invalid input');
  }

  const subject = await Subject.findOne({ userId: session.userId, subjectName: session.subject });
  if (!subject) return res.status(200).send('Subject not found');

  if (isYes) {
    subject.attendedClasses += 1;
    subject.totalClasses += 1;
  } else {
    subject.totalClasses += 1;
  }

  await subject.save();
  session.status = 'completed';
  await session.save();

  const msg = isYes ? '✅ Attendance marked as PRESENT' : '❌ Marked as ABSENT';
  await sendWhatsAppMessage(session.phone, msg);
  res.status(200).send('Attendance updated');
}

/**
 * Handle Multi-Step Wrap-Up Replies
 */
async function handleWrapUpReply(session, input, res) {
  const userId = session.userId;
  const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Kolkata'});
  const today = new Date(todayStr);
  today.setUTCHours(0,0,0,0);

  if (session.step === 'menu') {
    if (input === '1') {
      // Today's Classes
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[today.getDay()];
      const timetable = await Timetable.findOne({ userId });
      let msg = "📅 *Today's Classes:*\n\n";
      
      if (!timetable || !timetable[dayName] || timetable[dayName].length === 0) {
        msg += "No classes scheduled for today.";
      } else {
        timetable[dayName].forEach(c => {
          msg += `• ${c.subject} (${c.start} - ${c.end})\n`;
        });
      }
      await sendWhatsAppMessage(session.phone, msg);
    } 
    else if (input === '2') {
      // Today's Attendance Summary
      const sessions = await AttendanceSession.find({ userId, date: today, status: 'completed' });
      let msg = "📊 *Today's Attendance Summary:*\n\n";
      if (sessions.length === 0) msg += "No classes tracked today.";
      else {
        sessions.forEach(s => {
          msg += `• ${s.subject} → ✅ Tracked\n`;
        });
      }
      await sendWhatsAppMessage(session.phone, msg);
    }
    else if (input === '3') {
      // Overall Attendance %
      const subjects = await Subject.find({ userId });
      let msg = "📈 *Overall Attendance %*\n\n";
      let totalAttended = 0;
      let totalClasses = 0;
      
      subjects.forEach(s => {
        const pct = s.totalClasses > 0 ? Math.round((s.attendedClasses / s.totalClasses) * 100) : 0;
        msg += `• ${s.subjectName}: ${pct}%\n`;
        totalAttended += s.attendedClasses;
        totalClasses += s.totalClasses;
      });
      
      const overall = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
      msg += `\n*Overall Average:* ${overall}%`;
      
      await sendWhatsAppMessage(session.phone, msg);
    }
    else if (input === '4') {
      // Past Date Summary
      const msg = "🗓️ *Past Date Summary*\n\nPlease reply with the date in YYYY-MM-DD format (e.g., 2023-10-15):";
      session.step = 'past_date_input';
      await session.save();
      await sendWhatsAppMessage(session.phone, msg);
      return res.status(200).send('Processing');
    }
    else if (input === '5') {
      // Today's Tasks
      const daily = await DailyTask.findOne({ userId, date: today });
      let msg = "📌 *Today's Tasks:*\n\n";
      if (!daily || daily.tasks.length === 0) {
        msg += "No tasks for today.";
        await sendWhatsAppMessage(session.phone, msg);
      } else {
        daily.tasks.forEach((t, i) => {
          msg += `${i + 1} → ${t.text} [${t.completed ? '✅ Done' : '❌ Pending'}]\n`;
        });
        msg += "\nReply with task number to toggle status, or any other key to go back.";
        session.step = 'task_toggle';
        await session.save();
        await sendWhatsAppMessage(session.phone, msg);
        return res.status(200).send('Processing');
      }
    }
    else if (input === '6') {
      // Edit Attendance Flow
      const subjects = await Subject.find({ userId });
      let msg = "✏️ *Select subject to edit:*\n\n";
      subjects.forEach((s, i) => {
        msg += `${i + 1} → ${s.subjectName}\n`;
      });
      session.step = 'edit_select';
      await session.save();
      await sendWhatsAppMessage(session.phone, msg);
      return res.status(200).send('Processing');
    }
  } 
  else if (session.step === 'past_date_input') {
    // Attempt to parse date
    const d = new Date(input);
    if (isNaN(d.getTime())) {
      await sendWhatsAppMessage(session.phone, "❌ Invalid date format. Please use YYYY-MM-DD.");
    } else {
      d.setUTCHours(0,0,0,0);
      const sessions = await AttendanceSession.find({ userId, date: d, status: 'completed' });
      let msg = `📊 *Attendance on ${input}:*\n\n`;
      if (sessions.length === 0) msg += "No classes tracked on this date.";
      else {
        sessions.forEach(s => {
          msg += `• ${s.subject} → ✅ Tracked\n`;
        });
      }
      await sendWhatsAppMessage(session.phone, msg);
      session.step = 'menu';
      session.status = 'completed';
      await session.save();
    }
  }
  else if (session.step === 'task_toggle') {
    const idx = parseInt(input) - 1;
    const daily = await DailyTask.findOne({ userId, date: today });
    if (daily && daily.tasks[idx]) {
      daily.tasks[idx].completed = !daily.tasks[idx].completed;
      await daily.save();
      const status = daily.tasks[idx].completed ? '✅ DONE' : '❌ PENDING';
      await sendWhatsAppMessage(session.phone, `Updated: *${daily.tasks[idx].text}* is now ${status}`);
    }
    session.step = 'menu';
    session.status = 'completed'; 
    await session.save();
  }
  else if (session.step === 'edit_select') {
    const idx = parseInt(input) - 1;
    const subjects = await Subject.find({ userId });
    if (subjects[idx]) {
      session.selectedSubjectId = subjects[idx]._id;
      session.step = 'edit_action';
      await session.save();
      
      const msg = `*${subjects[idx].subjectName}*\n\nReply:\n1 → Mark Present\n2 → Mark Absent`;
      await sendWhatsAppMessage(session.phone, msg);
      return res.status(200).send('Processing');
    }
  }
  else if (session.step === 'edit_action') {
    const subject = await Subject.findById(session.selectedSubjectId);
    if (subject) {
      if (input === '1') {
        subject.attendedClasses += 1;
        await subject.save();
        await sendWhatsAppMessage(session.phone, `✅ ${subject.subjectName} updated to PRESENT`);
      } else if (input === '2') {
        if (subject.attendedClasses > 0) subject.attendedClasses -= 1;
        await subject.save();
        await sendWhatsAppMessage(session.phone, `❌ ${subject.subjectName} updated to ABSENT`);
      }
    }
    session.status = 'completed';
    await session.save();
  }

  res.status(200).type('text/xml').send('<Response></Response>');
}

module.exports = { handleWebhook };
