import request from 'supertest';
import { app } from '~/app';
import { sequelize } from '~/config/database';
import { User } from '~/user/User';

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({
    truncate: true,
  });
});

const validUser = {
  username: 'user1',
  email: 'user1@example.com',
  password: 'pass1234',
};

const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('User Registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.statusCode).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('saves the user to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the username and email to database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@example.com');
  });

  it('hashes the password in databas', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('pass1234');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@example.com',
      password: 'pass1234',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@example.com',
      password: 'pass1234',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns Username cannot be null when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@example.com',
      password: 'pass1234',
    });
    const body = response.body;
    expect(body.validationErrors.username).toBe('Username cannot be null');
  });

  // The End
});
