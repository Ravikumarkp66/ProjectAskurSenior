const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

/**
 * Determine semester from academic subject code and year.
 * Returns integer 1-8 if reliable; returns null if ambiguous or cycle-based.
 */
function resolveSubjectSemester(code, year) {
  if (!code || !year) return null;
  const cleanCode = String(code).trim().toUpperCase();

  if (year === '2nd Year') {
    if (/^3[A-Z0-9_]/.test(cleanCode)) return 3;
    if (/^4[A-Z0-9_]/.test(cleanCode)) return 4;
  } else if (year === '3rd Year') {
    if (/^5[A-Z0-9_]/.test(cleanCode)) return 5;
    if (/^6[A-Z0-9_]/.test(cleanCode)) return 6;
  } else if (year === '4th Year') {
    if (/^7[A-Z0-9_]/.test(cleanCode)) return 7;
    if (/^8[A-Z0-9_]/.test(cleanCode)) return 8;
  }

  // 1st Year cycle subjects (CAED, MATH, PHYS, CHEM, PSC, etc.) and
  // non-numbered electives/projects are preserved as null for manual placement.
  return null;
}

async function runBackfill(options = { dryRun: false }) {
  const isStandalone = !mongoose.connection.readyState;
  if (isStandalone) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const db = mongoose.connection.db;
  const col = db.collection('academic_subjects');

  const subjects = await col.find({}).toArray();
  const stats = {
    total: subjects.length,
    updated: 0,
    bySemester: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
    unresolved: []
  };

  const bulkOps = [];

  for (const subj of subjects) {
    const sem = resolveSubjectSemester(subj.code, subj.year);

    if (sem !== null) {
      stats.bySemester[sem]++;
      if (subj.semester !== sem) {
        stats.updated++;
        bulkOps.push({
          updateOne: {
            filter: { _id: subj._id },
            update: { $set: { semester: sem } }
          }
        });
      }
    } else {
      stats.unresolved.push({
        _id: subj._id,
        code: subj.code,
        name: subj.name,
        year: subj.year
      });
      // Ensure null if previously unset or undefined
      if (subj.semester !== null && subj.semester !== undefined) {
        bulkOps.push({
          updateOne: {
            filter: { _id: subj._id },
            update: { $set: { semester: null } }
          }
        });
      }
    }
  }

  if (!options.dryRun && bulkOps.length > 0) {
    await col.bulkWrite(bulkOps);
  }

  console.log('\n====================================================');
  console.log('📚 ACADEMIC SUBJECT SEMESTER BACKFILL SUMMARY');
  console.log('====================================================');
  console.log(`Total subjects evaluated: ${stats.total}`);
  console.log(`Subjects mapped to semesters: ${stats.total - stats.unresolved.length}`);
  console.log(`Documents modified in DB: ${options.dryRun ? 0 : bulkOps.length} ${options.dryRun ? '(DRY RUN)' : ''}`);
  for (let s = 1; s <= 8; s++) {
    console.log(`  • Semester ${s}: ${stats.bySemester[s]} subjects`);
  }
  console.log(`\nUnresolved / Preserved as null: ${stats.unresolved.length} subjects`);
  console.log('Sample Unresolved:');
  stats.unresolved.slice(0, 10).forEach(u => {
    console.log(`  [${u.year}] ${u.code.padEnd(15)} : ${u.name}`);
  });
  console.log('====================================================\n');

  if (isStandalone) {
    await mongoose.disconnect();
  }

  return stats;
}

if (require.main === module) {
  runBackfill().catch(err => {
    console.error('Backfill execution failed:', err);
    process.exit(1);
  });
}

module.exports = { resolveSubjectSemester, runBackfill };
