import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom Metrics
const yearStatsDuration = new Trend('year_stats_duration_ms');
const errorRate = new Rate('year_stats_error_rate');
const successfulRequests = new Counter('year_stats_success_count');

// Test Stages & Thresholds
export const options = {
  stages: [
    { duration: '10s', target: 1 },    // 1 user (Baseline)
    { duration: '15s', target: 10 },   // 10 users
    { duration: '20s', target: 25 },   // 25 users
    { duration: '20s', target: 50 },   // 50 users
    { duration: '20s', target: 100 },  // 100 users
    { duration: '15s', target: 250 },  // 250 users
    { duration: '10s', target: 500 },  // 500 users peak
    { duration: '10s', target: 0 },    // Cool down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // P95 < 500ms, P99 < 1s
    'year_stats_error_rate': ['rate<0.01'],            // Error rate < 1%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';

const YEARS = ['first-year', '2nd-Year', '3rd-Year', '4th-Year'];

export default function () {
  // Randomly select or iterate through years
  const selectedYear = YEARS[Math.floor(Math.random() * YEARS.length)];
  const url = selectedYear === 'first-year' 
    ? `${BASE_URL}/subjects/stats/first-year`
    : `${BASE_URL}/subjects/stats/${encodeURIComponent(selectedYear)}`;

  const res = http.get(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'AskUrSenior-k6-LoadTester/1.0',
    },
    tags: { endpoint: 'year_stats', year: selectedYear },
  });

  yearStatsDuration.add(res.timings.duration);

  const isSuccess = check(res, {
    'status is 200': (r) => r.status === 200,
    'has subjectsCount property': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.subjectsCount !== undefined;
      } catch (e) {
        return false;
      }
    },
    'has materialsCount property': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.materialsCount !== undefined;
      } catch (e) {
        return false;
      }
    },
    'has breakdown object': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.breakdown !== undefined && typeof body.breakdown === 'object';
      } catch (e) {
        return false;
      }
    },
  });

  if (isSuccess) {
    successfulRequests.add(1);
    errorRate.add(0);
  } else {
    errorRate.add(1);
  }

  // Think time between user requests (simulate realistic pacing)
  sleep(Math.random() * 1.5 + 0.5);
}
