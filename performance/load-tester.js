const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const getTierBadge = (p95) => {
  if (p95 < 500) return '🟢 Excellent (<500ms)';
  if (p95 < 1000) return '🟢 Good (<1s)';
  if (p95 <= 2000) return '🟡 Acceptable (1-2s)';
  return '🔴 Needs work (>2s)';
};

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 500 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 500 });

function makeRequest(targetUrl, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const agent = parsed.protocol === 'https:' ? httpsAgent : httpAgent;
    const startTime = process.hrtime.bigint();

    const req = client.get(targetUrl, { 
      agent,
      timeout: timeoutMs, 
      headers: { 
        'User-Agent': 'AskUrSenior-LoadTester/1.0',
        'x-perf-benchmark': 'true'
      } 
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6;
        resolve({
          statusCode: res.statusCode,
          durationMs,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 0,
        durationMs,
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 408,
        durationMs: timeoutMs,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function runConcurrencyLevel(targetUrl, concurrency, totalRequests) {
  const durations = [];
  let successful = 0;
  let failed = 0;

  const testStart = process.hrtime.bigint();
  let completed = 0;

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const result = await makeRequest(targetUrl);
      durations.push(result.durationMs);
      if (result.success) successful++;
      else failed++;
    }
  }

  const workers = [];
  const workerCount = Math.min(concurrency, totalRequests);
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  const testEnd = process.hrtime.bigint();
  const totalTestDurationSec = Number(testEnd - testStart) / 1e9;

  durations.sort((a, b) => a - b);

  const sum = durations.reduce((acc, d) => acc + d, 0);
  const avg = durations.length > 0 ? (sum / durations.length) : 0;
  const p50 = durations.length > 0 ? durations[Math.floor(durations.length * 0.50)] : 0;
  const p95 = durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0;
  const p99 = durations.length > 0 ? durations[Math.floor(durations.length * 0.99)] : 0;
  const rps = totalTestDurationSec > 0 ? (durations.length / totalTestDurationSec).toFixed(1) : 0;
  const errorRatePct = durations.length > 0 ? ((failed / durations.length) * 100).toFixed(2) : 0;

  return {
    concurrency,
    totalRequests: durations.length,
    rps: Number(rps),
    avg: Number(avg.toFixed(1)),
    p50: Number(p50.toFixed(1)),
    p95: Number(p95.toFixed(1)),
    p99: Number(p99.toFixed(1)),
    errorRatePct: Number(errorRatePct),
    tier: getTierBadge(p95)
  };
}

async function runApiLoadTests(baseUrl = 'http://localhost:5000/api') {
  console.log('===============================================================');
  console.log('   🚀 HIGH-CONCURRENCY API LOAD & BENCHMARK SUITE             ');
  console.log('===============================================================\n');

  const concurrencyTiers = [
    { vus: 1, reqs: 5 },
    { vus: 10, reqs: 15 },
    { vus: 25, reqs: 25 },
    { vus: 50, reqs: 50 },
    { vus: 100, reqs: 100 },
  ];

  const endpoints = [
    { name: '1. Year Stats (First Year)', path: '/subjects/stats/first-year' },
    { name: '2. Year Stats (2nd Year)', path: '/subjects/stats/2nd-Year' },
    { name: '3. CMS Subjects List', path: '/cms/subjects?branch=CSE' },
    { name: '4. Subject Materials (Python)', path: '/subjects/plc6/materials' },
  ];

  const allReports = [];

  for (const ep of endpoints) {
    const fullUrl = `${baseUrl}${ep.path}`;
    console.log(`\n▶ Testing Endpoint: ${ep.name} (${fullUrl})`);
    const epResults = [];

    for (const tier of concurrencyTiers) {
      process.stdout.write(`  • Testing ${tier.vus} concurrent users (${tier.reqs} reqs)... `);
      const res = await runConcurrencyLevel(fullUrl, tier.vus, tier.reqs);
      process.stdout.write(`Done. P95: ${res.p95}ms | RPS: ${res.rps} | Errors: ${res.errorRatePct}%\n`);
      epResults.push(res);
    }

    allReports.push({
      endpoint: ep.name,
      url: ep.path,
      tiers: epResults
    });
  }

  // Print Summary Table
  console.log('\n===============================================================');
  console.log('   📊 LOAD TEST CONSOLIDATED SUMMARY (P95 & THROUGHPUT)       ');
  console.log('===============================================================\n');

  for (const report of allReports) {
    console.log(`\n📌 ${report.endpoint}`);
    console.table(report.tiers.map(t => ({
      'VUs': t.concurrency,
      'Reqs/sec': t.rps,
      'Avg (ms)': `${t.avg} ms`,
      'P50 (ms)': `${t.p50} ms`,
      'P95 (ms)': `${t.p95} ms`,
      'P99 (ms)': `${t.p99} ms`,
      'Error %': `${t.errorRatePct}%`,
      'Target Tier': t.tier
    })));
  }

  // Save Markdown Report
  let md = '# API High-Concurrency Load Test Report\n\n';
  md += `**Timestamp:** ${new Date().toISOString()}\n\n`;

  for (const r of allReports) {
    md += `### ${r.endpoint} (\`${r.url}\`)\n\n`;
    md += '| Virtual Users (VUs) | Reqs / Sec | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | Error % | Performance Tier |\n';
    md += '| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n';
    r.tiers.forEach(t => {
      md += `| **${t.concurrency}** | ${t.rps} | ${t.avg} ms | ${t.p50} ms | **${t.p95} ms** | ${t.p99} ms | ${t.errorRatePct}% | ${t.tier} |\n`;
    });
    md += '\n';
  }

  const reportPath = path.resolve('performance/reports/api-load-report.md');
  fs.writeFileSync(reportPath, md, 'utf8');
  console.log(`\nReport successfully saved to: ${reportPath}`);

  return allReports;
}

if (require.main === module) {
  const customUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
  runApiLoadTests(customUrl);
}

module.exports = { runApiLoadTests };
