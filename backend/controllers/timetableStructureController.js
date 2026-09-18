const mongoose = require('mongoose');
const {
  TimetableStructure,
  DEFAULT_PERIODS,
  DEFAULT_BREAKS,
  DEFAULT_WORKING_DAYS,
  buildTimeline,
  generatePeriodsFromConfig
} = require('../models/TimetableStructure');
const { SectionTimetable } = require('../models/SectionTimetable');
const College = require('../models/College');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');
const { logActivity } = require('../services/adminActivityService');

/**
 * Helper: Resolve SIT College Document or first college
 */
async function resolveCollege(collegeId = null) {
  if (collegeId) {
    if (typeof collegeId === 'object' && (collegeId.code || collegeId.name || collegeId._id)) {
      return collegeId;
    }
    if (mongoose.Types.ObjectId.isValid(collegeId)) {
      const col = await College.findById(collegeId);
      if (col) return col;
    }
  }
  let col = await College.findOne({ code: 'SIT' });
  if (!col) {
    col = await College.findOne();
  }
  return col;
}

/**
 * Helper: Get active structure or auto-seed SIT default
 */
async function getOrSeedStructure(collegeId = null) {
  const college = await resolveCollege(collegeId);
  if (!college) {
    throw new Error('College record not found. Academic structure core must be initialized.');
  }

  let structure = await TimetableStructure.findOne({ college: college._id })
    .populate('college', 'name code')
    .populate('updatedBy', 'name email username');

  if (!structure) {
    structure = await TimetableStructure.create({
      college: college._id,
      name: 'SIT Institutional Bell Schedule',
      isDefault: true,
      collegeStartMinute: 480,
      collegeEndMinute: 960,
      classDuration: 50,
      labDuration: 100,
      workingDays: DEFAULT_WORKING_DAYS,
      breaks: DEFAULT_BREAKS,
      periods: DEFAULT_PERIODS
    });

    structure = await TimetableStructure.findById(structure._id)
      .populate('college', 'name code')
      .populate('updatedBy', 'name email username');
  }

  return structure;
}

/**
 * GET /api/academic/structure/timetable-structure
 * Retrieves the institutional timetable structure for SIT (readable by all authenticated admins)
 */
async function getTimetableStructure(req, res) {
  try {
    const collegeId = req.query.collegeId || null;
    const structure = await getOrSeedStructure(collegeId);

    return res.status(200).json({
      success: true,
      data: structure
    });
  } catch (error) {
    console.error('getTimetableStructure error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve institutional timetable structure'
    });
  }
}

/**
 * PUT /api/academic/structure/timetable-structure
 * Modifies the institutional timetable structure (SUPER ADMIN ONLY)
 */
async function updateTimetableStructure(req, res) {
  try {
    const userRole = req.admin?.role || req.user?.role;
    const isSuperAdminUser = userRole === 'SUPER_ADMIN' || userRole === 'superadmin';
    if (!isSuperAdminUser) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Only Super Admin can modify the institutional timetable structure.'
      });
    }

    const {
      name,
      collegeStartMinute,
      collegeEndMinute,
      classDuration,
      labDuration,
      workingDays,
      breaks,
      periods,
      timeline,
      collegeId
    } = req.body;

    const college = await resolveCollege(collegeId);
    if (!college) {
      return res.status(404).json({
        success: false,
        error: 'College record not found.'
      });
    }

    // 1. Resolve inputs: support unified timeline or separate periods/breaks
    let inputPeriods = periods;
    let inputBreaks = breaks;

    if (Array.isArray(timeline) && timeline.length > 0) {
      inputPeriods = timeline
        .filter((item) => item.type === 'period')
        .map((item, idx) => ({
          id: item.id || `p_${item.periodNumber || idx + 1}`,
          periodNumber: item.periodNumber || idx + 1,
          name: item.name || `Period ${item.periodNumber || idx + 1}`,
          startMinute: Number(item.startMinute),
          endMinute: Number(item.endMinute),
          timeSlot: item.timeSlot || `${item.startTime || ''}-${item.endTime || ''}`,
          saturdayAvailable: item.saturdayAvailable !== false,
          status: item.status || 'Active',
          order: item.order || idx + 1
        }));

      inputBreaks = timeline
        .filter((item) => item.type === 'break')
        .map((item, idx) => ({
          id: item.id || `brk_${idx + 1}`,
          name: item.name || 'Break',
          startMinute: Number(item.startMinute),
          endMinute: Number(item.endMinute),
          duration: Number(item.duration || (item.endMinute - item.startMinute)),
          timeSlot: item.timeSlot || `${item.startTime || ''}-${item.endTime || ''}`,
          afterPeriod: item.afterPeriod || null,
          status: item.status || 'Active',
          order: item.order || idx + 1
        }));
    }

    // 2. Validate durations
    let cDuration = Number(classDuration);
    if (!cDuration) {
      if (Array.isArray(inputPeriods) && inputPeriods.length > 0) {
        const firstP = inputPeriods[0];
        cDuration = Number(firstP.endMinute) - Number(firstP.startMinute) || 50;
      } else {
        cDuration = 50;
      }
    }
    if (cDuration < 15 || cDuration > 180) {
      return res.status(400).json({
        success: false,
        error: 'Class duration must be between 15 and 180 minutes.'
      });
    }

    let lDuration = Number(labDuration);
    if (!lDuration) lDuration = cDuration * 2;
    if (lDuration < 30 || lDuration > 360) {
      return res.status(400).json({
        success: false,
        error: 'Lab duration must be between 30 and 360 minutes.'
      });
    }

    const startMinute = collegeStartMinute !== undefined && collegeStartMinute !== null
      ? Number(collegeStartMinute)
      : 480;
    const endMinute = collegeEndMinute !== undefined && collegeEndMinute !== null
      ? Number(collegeEndMinute)
      : 960;

    if (isNaN(startMinute) || startMinute < 0 || startMinute > 1439) {
      return res.status(400).json({ success: false, error: 'Invalid collegeStartMinute.' });
    }
    if (isNaN(endMinute) || endMinute < 0 || endMinute > 1439 || startMinute >= endMinute) {
      return res.status(400).json({ success: false, error: 'College start time must be strictly before college end time.' });
    }

    // 3. Validate / format breaks
    const processedBreaks = [];
    if (Array.isArray(inputBreaks)) {
      for (let i = 0; i < inputBreaks.length; i++) {
        const b = inputBreaks[i];
        const start = Number(b.startMinute);
        const duration = Number(b.duration || (b.endMinute ? b.endMinute - start : 15));
        const end = Number(b.endMinute || (start + duration));

        if (!b.name || !b.name.trim()) {
          return res.status(400).json({ success: false, error: 'Break name is required.' });
        }
        if (isNaN(start) || isNaN(end) || start < 0 || end > 1439 || start >= end) {
          return res.status(400).json({
            success: false,
            error: `Break '${b.name}' has invalid timings: startMinute (${start}) must be strictly less than endMinute (${end}).`
          });
        }

        const formatTime = (mins) => {
          const h = String(Math.floor(mins / 60)).padStart(2, '0');
          const m = String(mins % 60).padStart(2, '0');
          return `${h}:${m}`;
        };

        processedBreaks.push({
          id: b.id || `brk_${i + 1}`,
          name: b.name.trim(),
          startMinute: start,
          endMinute: end,
          duration: end - start,
          timeSlot: b.timeSlot || `${formatTime(start)}-${formatTime(end)}`,
          afterPeriod: b.afterPeriod || null,
          status: b.status === 'Retired' ? 'Retired' : 'Active',
          order: b.order || i + 1
        });
      }
    }

    // 4. Resolve periods: if explicit periods array provided, validate it;
    // otherwise dynamically generate N periods from timings & breaks
    let processedPeriods = [];
    if (Array.isArray(inputPeriods) && inputPeriods.length > 0) {
      const sortedPeriods = [...inputPeriods].sort((a, b) => Number(a.periodNumber) - Number(b.periodNumber));

      for (let i = 0; i < sortedPeriods.length; i++) {
        const p = sortedPeriods[i];
        const pNum = Number(p.periodNumber);
        const start = Number(p.startMinute);
        const end = Number(p.endMinute);

        if (!Number.isInteger(pNum) || pNum !== i + 1) {
          return res.status(400).json({
            success: false,
            error: `Periods must be numbered sequentially from 1 to ${sortedPeriods.length}. Found periodNumber: ${pNum}.`
          });
        }

        if (isNaN(start) || isNaN(end) || start < 0 || end > 1439 || start >= end) {
          return res.status(400).json({
            success: false,
            error: `Period ${pNum} has invalid timings: startMinute (${start}) must be strictly less than endMinute (${end}).`
          });
        }

        const formatTime = (mins) => {
          const h = String(Math.floor(mins / 60)).padStart(2, '0');
          const m = String(mins % 60).padStart(2, '0');
          return `${h}:${m}`;
        };

        processedPeriods.push({
          id: p.id || `p_${pNum}`,
          periodNumber: pNum,
          name: p.name || `Period ${pNum}`,
          startMinute: start,
          endMinute: end,
          timeSlot: p.timeSlot || `${formatTime(start)}-${formatTime(end)}`,
          saturdayAvailable: p.saturdayAvailable !== false,
          status: p.status === 'Retired' ? 'Retired' : 'Active',
          order: p.order || pNum
        });
      }
    } else {
      // Dynamic generation of N periods
      processedPeriods = generatePeriodsFromConfig({
        collegeStartMinute: startMinute,
        collegeEndMinute: endMinute,
        classDuration: cDuration,
        breaks: processedBreaks
      });
    }

    // 5. Mutual Overlap Checks among Active Periods and Breaks
    const activePeriods = processedPeriods.filter((p) => p.status !== 'Retired');
    const activeBreaks = processedBreaks.filter((b) => b.status !== 'Retired');

    // Period vs Period overlaps
    for (let i = 0; i < activePeriods.length; i++) {
      for (let j = i + 1; j < activePeriods.length; j++) {
        const p1 = activePeriods[i];
        const p2 = activePeriods[j];
        if (p1.startMinute < p2.endMinute && p2.startMinute < p1.endMinute) {
          return res.status(400).json({
            success: false,
            error: `Period ${p2.periodNumber} (${p2.startMinute}) overlaps with Period ${p1.periodNumber} (${p1.endMinute}).`
          });
        }
      }
    }

    // Break vs Break overlaps
    for (let i = 0; i < activeBreaks.length; i++) {
      for (let j = i + 1; j < activeBreaks.length; j++) {
        const b1 = activeBreaks[i];
        const b2 = activeBreaks[j];
        if (b1.startMinute < b2.endMinute && b2.startMinute < b1.endMinute) {
          return res.status(400).json({
            success: false,
            error: `Break '${b2.name}' overlaps with Break '${b1.name}'.`
          });
        }
      }
    }

    // Period vs Break overlaps
    for (const p of activePeriods) {
      for (const b of activeBreaks) {
        if (p.startMinute < b.endMinute && b.startMinute < p.endMinute) {
          return res.status(400).json({
            success: false,
            error: `Period ${p.periodNumber} (${p.name || 'P' + p.periodNumber}) overlaps with Break '${b.name}'.`
          });
        }
      }
    }

    // 6. Period Deletion Safety Check against SectionTimetable
    const currentStructure = await TimetableStructure.findOne({ college: college._id });
    if (currentStructure && Array.isArray(currentStructure.periods) && currentStructure.periods.length > 0) {
      const newPeriodNumbers = new Set(processedPeriods.map((p) => Number(p.periodNumber)));
      const newPeriodIds = new Set(processedPeriods.map((p) => String(p.id)));

      for (const oldP of currentStructure.periods) {
        const oldNum = Number(oldP.periodNumber);
        const oldId = String(oldP.id || '');
        if (!newPeriodNumbers.has(oldNum) && (!oldId || !newPeriodIds.has(oldId))) {
          const inUse = await SectionTimetable.findOne({
            $or: [
              { 'slots.periodNumber': oldNum },
              ...(oldId ? [{ 'slots.periodId': oldId }] : [])
            ]
          });
          if (inUse) {
            return res.status(400).json({
              success: false,
              error: `This period (${oldP.name || 'Period ' + oldNum}) is used by existing timetables. Change or retire the period instead.`
            });
          }
        }
      }
    }

    // 7. Validate working days
    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Working days configuration is required.'
      });
    }

    const processedWorkingDays = [];
    const validStatuses = ['Full Day', 'Half Day', 'Non-Working', 'Holiday'];
    const totalPeriodsCount = processedPeriods.length;

    const lunchBreak = processedBreaks.find((b) => /lunch/i.test(b.name));
    let halfDayPeriods = lunchBreak
      ? processedPeriods.filter((p) => p.endMinute <= lunchBreak.startMinute).length
      : Math.ceil(totalPeriodsCount / 2);
    if (halfDayPeriods < 1) halfDayPeriods = Math.min(4, totalPeriodsCount);

    for (const wd of workingDays) {
      const day = Number(wd.dayOfWeek);
      if (!Number.isInteger(day) || day < 1 || day > 7) {
        return res.status(400).json({
          success: false,
          error: `Invalid dayOfWeek: ${day}. Must be between 1 (Monday) and 7 (Sunday).`
        });
      }

      let status = validStatuses.includes(wd.status) ? wd.status : 'Full Day';
      if (status === 'Holiday') status = 'Non-Working';

      let maxPeriods = wd.maxPeriods !== undefined && wd.maxPeriods !== null ? Number(wd.maxPeriods) : null;
      if (status === 'Non-Working') {
        maxPeriods = 0;
      } else if (status === 'Half Day') {
        maxPeriods = (maxPeriods !== null && !isNaN(maxPeriods) && maxPeriods > 0)
          ? Math.min(maxPeriods, totalPeriodsCount)
          : halfDayPeriods;
      } else {
        maxPeriods = totalPeriodsCount;
      }

      // Sunday rule: Sunday cannot be a Full Day or Half Day
      if (day === 7 && status !== 'Non-Working') {
        return res.status(400).json({
          success: false,
          error: 'Sunday is strictly a Non-Working day in the institutional academic framework.'
        });
      }

      processedWorkingDays.push({
        dayOfWeek: day,
        dayName: wd.dayName || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day - 1],
        status,
        maxPeriods
      });
    }

    processedWorkingDays.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    // Verify at least one working day exists
    const hasWorkingDay = processedWorkingDays.some((w) => w.status === 'Full Day' || w.status === 'Half Day');
    if (!hasWorkingDay) {
      return res.status(400).json({
        success: false,
        error: 'At least one working day is required.'
      });
    }

    // 8. Build Unified Timeline
    const processedTimeline = buildTimeline(processedPeriods, processedBreaks);

    const adminId = req.admin?._id || req.user?._id || null;

    const updated = await TimetableStructure.findOneAndUpdate(
      { college: college._id },
      {
        $set: {
          name: name ? String(name).trim() : 'SIT Institutional Bell Schedule',
          isDefault: true,
          collegeStartMinute: startMinute,
          collegeEndMinute: endMinute,
          classDuration: cDuration,
          labDuration: lDuration,
          workingDays: processedWorkingDays,
          breaks: processedBreaks,
          periods: processedPeriods,
          timeline: processedTimeline,
          updatedBy: adminId
        }
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('college', 'name code')
      .populate('updatedBy', 'name email username');

    // Invalidate future expected schedule projections
    await StudentExpectedSchedule.deleteMany({});

    try {
      logActivity({
        req,
        action: 'UPDATE',
        resourceType: 'ADMIN',
        resourceId: updated._id,
        metadata: {
          subType: 'TIMETABLE_STRUCTURE',
          title: updated.name,
          classDuration: cDuration,
          periodsCount: processedPeriods.length
        }
      });
    } catch (logErr) {
      // Non-fatal logging
    }

    return res.status(200).json({
      success: true,
      message: 'Institutional timetable structure updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('updateTimetableStructure error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update institutional timetable structure'
    });
  }
}

module.exports = {
  getTimetableStructure,
  updateTimetableStructure,
  getOrSeedStructure,
  resolveCollege
};
