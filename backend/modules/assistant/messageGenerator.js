/**
 * Generates Morning Academic Update
 */
exports.generateMorningMessage = (data) => {
  const { user, date, dayName, schedule, todos, daysLeft } = data;
  const name = user.name || user.email.split('@')[0];

  let message = `Hlo ${name} 👋 Good Morning 🌅\n\n`;
  message += `📅 ${date} (${dayName})\n\n`;

  // Classes
  if (schedule.length > 0) {
    message += `⏰ Today's Classes:\n`;
    schedule.forEach(s => {
      const timeStr = s.start ? `${s.start} - ${s.end}` : 'Time TBD';
      message += `• ${timeStr} → ${s.subject}\n`;
    });
  } else {
    message += `🎉 No classes scheduled for today!\n`;
  }

  // Todos (Limited to 3)
  const pendingTodos = todos.filter(t => !t.done).slice(0, 3);
  if (pendingTodos.length > 0) {
    message += `\n📌 Tasks:\n`;
    pendingTodos.forEach(t => {
      message += `- ${t.text}\n`;
    });
  }

  // Exams
  if (daysLeft !== null && daysLeft >= 0) {
    message += `\n⏳ Exams in: ${daysLeft} days\n`;
    if (daysLeft <= 3) message += `🚨 Exams are VERY close!\n`;
  }

  message += `\n🔥 Start strong. Small progress matters.`;
  return message;
};

/**
 * Generates Night Academic Update
 */
exports.generateNightMessage = (data) => {
  const { user, date, dayName, schedule, todos } = data;
  const name = user.name || user.email.split('@')[0];

  let message = `Good Evening ${name} 🌙\n\n`;
  message += `📅 Tomorrow (${date})\n\n`;

  // Classes
  if (schedule.length > 0) {
    message += `⏰ Classes:\n`;
    schedule.forEach(s => {
      const timeStr = s.start ? `${s.start} - ${s.end}` : 'Time TBD';
      message += `• ${timeStr} → ${s.subject}\n`;
    });
  } else {
    message += `🎉 No classes tomorrow. Enjoy your break!\n`;
  }

  // Pending Tasks
  const pendingTodos = todos.filter(t => !t.done).slice(0, 3);
  if (pendingTodos.length > 0) {
    message += `\n📌 Pending Tasks:\n`;
    pendingTodos.forEach(t => {
      message += `- ${t.text}\n`;
    });
  }

  // Priority Advice
  if (user.priority === 'attendance') {
    message += `\n🎯 Focus: Make sure to attend all tomorrow's classes!`;
  } else if (user.priority === 'marks') {
    message += `\n🎯 Focus: Revise your notes for tomorrow's topics tonight.`;
  }

  message += `\n⚡ Plan your day now. Stay ahead!`;
  return message;
};

/**
 * Setup Complete Message
 */
exports.generateSetupCompleteMessage = () => {
  return `🎉 Setup Complete!\nYou will now receive daily academic updates on WhatsApp.\n⏰ Morning (6 AM) & Night (9 PM)\n🔥 Stay consistent!`;
};
