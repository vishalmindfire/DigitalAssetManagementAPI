import { describe, expect, it } from '@jest/globals';
import request from 'supertest';

import app from '#index.js';

describe('Localhost Server Health', () => {
  it('GET / should return 200 OK', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('message');
  });
});
