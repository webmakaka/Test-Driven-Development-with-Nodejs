import { app } from 'app';
import request from 'supertest';

describe('User Registration', () => {
  it('returns 200 OK when signup request is valid', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({ username: 'user1', email: 'user1@example.com', password: 'pass1234' })
      .then((response) => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });

  it('returns success message when signup request is valid', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({ username: 'user1', email: 'user1@example.com', password: 'pass1234' })
      .then((response) => {
        expect(response.body.message).toBe('User created');
        done();
      });
  });
});
