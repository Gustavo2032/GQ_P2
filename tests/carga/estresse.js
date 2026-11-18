
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '10s', target: 10 },
    { duration: '10s', target: 15 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const resposta = http.get('http://127.0.0.1:3001/api/products');

  check(resposta, {
    'resposta HTTP 200': (r) => r.status === 200,
  });

  sleep(1);
}
