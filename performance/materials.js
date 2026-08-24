import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom Metrics
const subjectsListDuration = new Trend('subjects_list_duration_ms');
const materialsLookupDuration = new Trend('materials_lookup_duration_ms');
const previewUrlDuration = new Trend('preview_url_duration_ms');
const downloadUrlDuration = new Trend('download_url_duration_ms');
const overallErrorRate = new Rate('materials_flow_error_rate');

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 25 },
    { duration: '20s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '15s', target: 250 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<600', 'p(99)<1200'],
    'materials_flow_error_rate': ['rate<0.02'], // Max 2% error
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';
const BRANCHES = ['CSE', 'ISE', 'ECE', 'MECH', 'CIVIL'];
const SAMPLE_SUBJECT_SLUGS = ['python-programming', 'mathematics', 'physics', 'software-engineering-and-project-management'];

export default function () {
  const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)];
  const subjectSlug = SAMPLE_SUBJECT_SLUGS[Math.floor(Math.random() * SAMPLE_SUBJECT_SLUGS.length)];

  // 1. Fetch Subjects list for branch
  group('1. Fetch Branch Subjects List', function () {
    const res = http.get(`${BASE_URL}/cms/subjects?branch=${branch}`, {
      tags: { step: 'cms_subjects_list' },
    });
    subjectsListDuration.add(res.timings.duration);

    const ok = check(res, {
      'subjects status is 200': (r) => r.status === 200,
      'subjects array is returned': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body));
        } catch (e) {
          return false;
        }
      },
    });
    if (!ok) overallErrorRate.add(1);
    else overallErrorRate.add(0);
  });

  sleep(0.5);

  // 2. Fetch Materials for Subject
  let materialId = null;
  group('2. Fetch Subject Materials', function () {
    const res = http.get(`${BASE_URL}/subjects/${encodeURIComponent(subjectSlug)}/materials`, {
      tags: { step: 'subject_materials' },
    });
    materialsLookupDuration.add(res.timings.duration);

    const ok = check(res, {
      'materials status is 200': (r) => r.status === 200,
      'has notes or see array': (r) => {
        try {
          const body = JSON.parse(r.body);
          if (body.notes && body.notes.length > 0) {
            materialId = body.notes[0]._id;
          } else if (body.see && body.see.length > 0) {
            materialId = body.see[0]._id;
          }
          return body.subject !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    if (!ok) overallErrorRate.add(1);
    else overallErrorRate.add(0);
  });

  sleep(0.5);

  // 3. Preview & Download URLs (if material resolved)
  if (materialId) {
    group('3. Preview Document URL', function () {
      const res = http.get(`${BASE_URL}/documents/${materialId}/preview-url`, {
        tags: { step: 'preview_url' },
      });
      previewUrlDuration.add(res.timings.duration);
      const ok = check(res, {
        'preview status is 200': (r) => r.status === 200,
        'has previewUrl': (r) => {
          try {
            return !!JSON.parse(r.body).previewUrl;
          } catch (e) {
            return false;
          }
        },
      });
      if (!ok) overallErrorRate.add(1);
      else overallErrorRate.add(0);
    });

    sleep(0.3);

    group('4. Download Document URL', function () {
      const res = http.get(`${BASE_URL}/documents/${materialId}/download`, {
        tags: { step: 'download_url' },
      });
      downloadUrlDuration.add(res.timings.duration);
      const ok = check(res, {
        'download status is 200': (r) => r.status === 200,
        'has downloadUrl': (r) => {
          try {
            return !!JSON.parse(r.body).downloadUrl;
          } catch (e) {
            return false;
          }
        },
      });
      if (!ok) overallErrorRate.add(1);
      else overallErrorRate.add(0);
    });
  }

  sleep(Math.random() * 2 + 1);
}
