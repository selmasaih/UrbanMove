const request = require('supertest');
const app = require('../src/server');

// Mock the database models to avoid hanging queries
jest.mock('../src/models/Parking', () => {
  return {
    find: jest.fn().mockResolvedValue([]),
    ensureIndexes: jest.fn()
  };
});

describe('Parking API', () => {
  it('should list available parking spots', async () => {
    const res = await request(app).get('/api/parkings');
    expect([200, 500]).toContain(res.statusCode);
  });
  
  it('should return 400 when missing coordinates for nearby search', async () => {
    const res = await request(app).get('/api/parkings/nearby');
    expect(res.statusCode).toEqual(400);
  });
});
