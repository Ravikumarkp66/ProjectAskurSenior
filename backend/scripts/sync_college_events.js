require('dotenv').config();
const mongoose = require('mongoose');

async function syncEvents() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const sourceItems = await db.collection('academic_calendar_items').find().toArray();
    console.log(`Found ${sourceItems.length} items in academic_calendar_items`);

    for (const item of sourceItems) {
        const title = (item.title || '').trim();
        const isFullDay = item.classImpact === 'FULL_DAY' || item.kind === 'HOLIDAY' || item.holidayCategory === 'GOVERNMENT' || /holiday|closure|vacation|preparation.*holiday/i.test(title);
        const isTimeRange = item.classImpact === 'TIME_RANGE';
        const isNone = item.classImpact === 'NONE';
        const isTestOrExam = /test[-\s]?\d+|cie[-\s]?\d+|exam|see\b/i.test(title);

        const classesSuspended = isFullDay || isTimeRange || (isTestOrExam && !isNone);
        const suspensionType = isFullDay ? 'full_day' : (isTimeRange ? 'time_range' : ((isTestOrExam && !isNone) ? 'full_day' : 'none'));

        const updateResult = await db.collection('college_events').updateMany(
            { title: item.title },
            {
                $set: {
                    classesSuspended,
                    suspensionType,
                    classImpact: item.classImpact || (classesSuspended ? suspensionType : 'NONE'),
                    allDay: item.isAllDay !== false,
                    suspensionStartTime: item.suspensionStartMinute ? `${Math.floor(item.suspensionStartMinute / 60).toString().padStart(2, '0')}:${(item.suspensionStartMinute % 60).toString().padStart(2, '0')}` : null,
                    suspensionEndTime: item.suspensionEndMinute ? `${Math.floor(item.suspensionEndMinute / 60).toString().padStart(2, '0')}:${(item.suspensionEndMinute % 60).toString().padStart(2, '0')}` : null
                }
            }
        );
        console.log(`Synced "${item.title}": classesSuspended=${classesSuspended}, suspensionType=${suspensionType}, matched=${updateResult.matchedCount}`);
    }

    // Also clear cached expected schedules so they regenerate with zero classes on suspended days
    const delResult = await db.collection('student_expected_schedules').deleteMany({});
    console.log(`Cleared ${delResult.deletedCount} cached student_expected_schedules`);

    await mongoose.disconnect();
}

syncEvents().catch(console.error);
