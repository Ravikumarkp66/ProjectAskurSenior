const mongoose = require('mongoose');
const WrapUpSession = require('./modules/whatsapp/WrapUpSession');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const session = await WrapUpSession.findOne({ status: 'active' });
  console.log("Active Session:", session);
  process.exit(0);
}
check();
