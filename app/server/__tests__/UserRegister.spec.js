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
  password: 'Pass1234',
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
      password: 'Pass1234',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@example.com',
      password: 'Pass1234',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'Pass1234',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  // it.each([
  //   ['username', 'Username cannot be null'],
  //   ['email', 'Email cannot be null'],
  //   ['password', 'Password cannot be null'],
  // ])('when %s is null % is received', async (field, expectedMessage) => {
  //   const user = {
  //     username: 'user1',
  //     email: 'user1@example.com',
  //     password: 'pass1234',
  //   };

  //   user[field] = null;
  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors[field]).toBe(expectedMessage);
  // });

  it.each`
    field         | value                 | expectedMessage
    ${'username'} | ${null}               | ${'Username cannot be null'}
    ${'username'} | ${'usr'}              | ${'Must have minimum 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}     | ${'Must have minimum 4 and max 32 characters'}
    ${'email'}    | ${null}               | ${'Email cannot be null'}
    ${'email'}    | ${'mail.com'}         | ${'Email is not valid'}
    ${'email'}    | ${'user.mail.com'}    | ${'Email is not valid'}
    ${'email'}    | ${'user@mail'}        | ${'Email is not valid'}
    ${'password'} | ${null}               | ${'Password cannot be null'}
    ${'password'} | ${'P4ss'}             | ${'Password must be at least 6 characters'}
    ${'password'} | ${'lllowercase'}      | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}     | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'1234567'}          | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerandUPPER'}    | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lower4and5432234'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPER4444'}        | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
  `(
    'returns $expectedMessage when $field is $value',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'Pass1234',
      };

      user[field] = value;
      const response = await postUser(user);
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  // it('returns size validation error when username is less than 4 characters', async () => {
  //   const user = {
  //     username: 'usr',
  //     email: 'user1@example.com',
  //     password: 'pass1234',
  //   };

  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors.username).toBe(
  //     'Must have minimum 4 and max 32 characters'
  //   );
  // });

  // The End
});
