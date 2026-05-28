const mongoose = require('mongoose');
const User = require('../models/User');
const DailyTask = require('../modules/academic/DailyTask');
require('dotenv').config();

async function addTestTasks() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const user = await User.findOne({ phone: { $ne: null } });
  if (!user) {
    console.log('No user found');
    process.exit(0);
  }

  const today = new Date();
  today.setUTCHours(0,0,0,0);

  await DailyTask.findOneAndUpdate(
    { userId: user._id, date: today },
    { 
      tasks: [
        { text: 'Complete React Components', completed: true },
        { text: 'Review Express Webhooks', completed: false },
        { text: 'Finalize Attendance Logic', completed: false }
      ]
    },
    { upsert: true, new: true }
  );

  console.log(`✅ Test tasks added for ${user.email} on ${today.toDateString()}`);
  process.exit(0);
}

addTestTasks();
