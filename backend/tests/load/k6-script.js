import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  // 1. Login
  const loginPayload = JSON.stringify({
    email: 'admin@intellidocx.com', // Ensure this user exists or use seeded user
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  });

  const token = loginRes.json('accessToken');
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // 2. List Documents
  const listRes = http.get(`${BASE_URL}/documents`, authHeaders);
  check(listRes, {
    'list docs status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
