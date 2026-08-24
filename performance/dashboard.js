import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const dashboardFullLoadTime = new Trend('dashboard_full_load_time_ms');
const yearStatsBatchDuration = new Trend('year_stats_batch_duration_ms');
const sessionErrorRate = new Rate('dashboard_session_error_rate');

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '15s', target: 20 },
    { duration: '20s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '15s', target: 200 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'dashboard_full_load_time_ms': ['p(95)<800', 'p(99)<1500'],
    'year_stats_batch_duration_ms': ['p(95)<400'],
    'dashboard_session_error_rate': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';

export default function () {
  const sessionStart = new Date().getTime();

  // 1. Emulate Dashboard Mount: 4 Parallel Year Stats Calls (Promise.allSettled)
  group('1. Dashboard Mount - 4 Parallel Year Stats Calls', function () {
    const batchStart = new Date().getTime();

    const responses = http.batch([
      ['GET', `${BASE_URL}/subjects/stats/first-year`, null, { tags: { call: 'y1_stats' } }],
      ['GET', `${BASE_URL}/subjects/stats/2nd-Year`, null, { tags: { call: 'y2_stats' } }],
      ['GET', `${BASE_URL}/subjects/stats/3rd-Year`, null, { tags: { call: 'y3_stats' } }],
      ['GET', `${BASE_URL}/subjects/stats/4th-Year`, null, { tags: { call: 'y4_stats' } }],
    ]);

    const batchDuration = new Date().getTime() - batchStart;
    yearStatsBatchDuration.add(batchDuration);

    let all200 = true;
    responses.forEach((res) => {
      if (res.status !== 200) all200 = false;
    });

    const ok = check(responses, {
      'all 4 stats calls succeeded with 200': () => all200,
    });

    if (!ok) sessionErrorRate.add(1);
    else sessionErrorRate.add(0);
  });

  sleep(1);

  // 2. User Clicks First Year Card -> Loads 30 Subjects
  group('2. Click First Year Card -> Load Subjects', function () {
    const res = http.get(`${BASE_URL}/cms/subjects?branch=CSE`, {
      tags: { call: 'load_first_year_subjects' },
    });

    const ok = check(res, {
      'subjects loaded with 200': (r) => r.status === 200,
      'has 30 first year subjects': (r) => {
        try {
          const list = JSON.parse(r.body);
          return list.filter((s) => s.year === '1st Year' || !s.year).length >= 30;
        } catch (e) {
          return false;
        }
      },
    });

    if (!ok) sessionErrorRate.add(1);
    else sessionErrorRate.add(0);
  });

  sleep(1);

  // 3. User Selects Python Programming -> Loads 16 Materials
  group('3. Select Subject -> Load Materials', function () {
    const res = http.get(`${BASE_URL}/subjects/plc6/materials`, {
      tags: { call: 'load_python_materials' },
    });

    const ok = check(res, {
      'materials loaded with 200': (r) => r.status === 200,
      'materials contain notes & pyqs': (r) => {
        try {
          const body = JSON.parse(r.body);
          return (body.notes?.length || 0) + (body.see?.length || 0) > 0;
        } catch (e) {
          return false;
        }
      },
    });

    if (!ok) sessionErrorRate.add(1);
    else sessionErrorRate.add(0);
  });

  const totalDuration = new Date().getTime() - sessionStart;
  dashboardFullLoadTime.add(totalDuration);

  sleep(Math.random() * 2 + 1);
}
