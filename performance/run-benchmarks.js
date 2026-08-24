const { runDatabaseProfiler } = require('./db-profiler');
const { runApiLoadTests } = require('./load-tester');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 ASKUR SENIOR FULL PERFORMANCE TEST SUITE           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Step 1: Database Query Profiler
  console.log('▶ STEP 1: Running MongoDB Query Profiler...\n');
  const dbResults = await runDatabaseProfiler();

  // Step 2: API Load Tests
  console.log('\n▶ STEP 2: Running High-Concurrency API Load Tests...\n');
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
  let apiResults = [];
  try {
    apiResults = await runApiLoadTests(baseUrl);
  } catch (err) {
    console.warn('⚠️ API Load tests skipped or failed (ensure local backend server is running on port 5000):', err.message);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║   ✅ ALL PERFORMANCE BENCHMARKS COMPLETE (${durationSec}s)           ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n📁 Reports saved in: performance/reports/');
}

if (require.main === module) {
  main();
}
