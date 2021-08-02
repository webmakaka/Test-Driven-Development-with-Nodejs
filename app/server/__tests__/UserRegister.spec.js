import nodemailerStub from 'nodemailer-stub';
import request from 'supertest';
import { app } from '~/app';
import { sequelize } from '~/config/database';
import { EmailService } from '~/email/EmailService';
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

const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');

  if (options.language) {
    agent.set('Accept-Language', options.language);
  }

  return agent.send(user);
};

describe('User Registration', () => {
  const username_null = 'Username cannot be null';
  const username_size = 'Must have minimum 4 and max 32 characters';
  const email_null = 'Email cannot be null';
  const email_invalid = 'Email is invalid';
  const password_null = 'Password cannot be null';
  const password_size = 'Password must be at least 6 characters';
  const password_pattern =
    'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';
  const email_inuse = 'Email is in use';
  const user_create_success = 'User created';
  const email_failure = 'Email Failure';

  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.statusCode).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe(user_create_success);
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

  it.each`
    field         | value                 | expectedMessage
    ${'username'} | ${null}               | ${username_null}
    ${'username'} | ${'usr'}              | ${username_size}
    ${'username'} | ${'a'.repeat(33)}     | ${username_size}
    ${'email'}    | ${null}               | ${email_null}
    ${'email'}    | ${'mail.com'}         | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}    | ${email_invalid}
    ${'email'}    | ${'user@mail'}        | ${email_invalid}
    ${'password'} | ${null}               | ${password_null}
    ${'password'} | ${'P4ss'}             | ${password_size}
    ${'password'} | ${'lllowercase'}      | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}     | ${password_pattern}
    ${'password'} | ${'1234567'}          | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'}    | ${password_pattern}
    ${'password'} | ${'lower4and5432234'} | ${password_pattern}
    ${'password'} | ${'UPPER4444'}        | ${password_pattern}
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

  it(`returns ${email_inuse} when same email is already in use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('creates user in inactive mode', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates user in inactive mode even requst body contains inactive as false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates an activationToken for user', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });

  it('sends an Account activation email with activationToken', async () => {
    await postUser();

    const lastMail = nodemailerStub.interactsWithMail.lastMail();
    expect(lastMail.to[0]).toBe(validUser.email);

    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail.content).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to delivery email' });
    const response = await postUser();
    expect(response.status).toBe(502);
    mockSendAccountActivation.mockRestore();
  });

  it('returns email failure message when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to delivery email' });
    const response = await postUser();
    expect(response.body.message).toBe(email_failure);
    mockSendAccountActivation.mockRestore();
  });

  it('does not save user to database if activation email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to delivery email' });
    const response = await postUser();
    mockSendAccountActivation.mockRestore();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });

  // The End
});

describe('Internationalization', () => {
  const username_null = 'Username не может быть null';
  const username_size = 'Должно быть минимум 4 и максимум 32 символа';
  const email_null = 'Email не может быть null';
  const email_invalid = 'Email задан неверно';
  const password_null = 'Password не может быть null';
  const password_size = 'Password быть не менее 6 символов';
  const password_pattern =
    'Password должен состоять как минимум из 1 символа в верхнем регистре, 1 символа в нижнем регистре и 1 цифры';
  const email_inuse = 'Email уже используется';
  const user_create_success = 'User создан';
  const email_failure = 'Ошибка в Email';

  it.each`
    field         | value                 | expectedMessage
    ${'username'} | ${null}               | ${username_null}
    ${'username'} | ${'usr'}              | ${username_size}
    ${'username'} | ${'a'.repeat(33)}     | ${username_size}
    ${'email'}    | ${null}               | ${email_null}
    ${'email'}    | ${'mail.com'}         | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}    | ${email_invalid}
    ${'email'}    | ${'user@mail'}        | ${email_invalid}
    ${'password'} | ${null}               | ${password_null}
    ${'password'} | ${'P4ss'}             | ${password_size}
    ${'password'} | ${'lllowercase'}      | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}     | ${password_pattern}
    ${'password'} | ${'1234567'}          | ${password_pattern}
    ${'password'} | ${'lowerandUPPER'}    | ${password_pattern}
    ${'password'} | ${'lower4and5432234'} | ${password_pattern}
    ${'password'} | ${'UPPER4444'}        | ${password_pattern}
  `(
    'returns $expectedMessage when $field is $value when language is set as russian',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'Pass1234',
      };

      user[field] = value;
      const response = await postUser(user, { language: 'ru' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it(`returns ${email_inuse} when same email is already in use when language is set as russian`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'ru' });
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it(`returns success message of ${user_create_success} when signup request is valid when language is set as russian`, async () => {
    const response = await postUser({ ...validUser }, { language: 'ru' });
    expect(response.body.message).toBe(user_create_success);
  });

  it(`returns ${email_failure} message when sending email fails when language is set as russian`, async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to delivery email' });
    const response = await postUser({ ...validUser }, { language: 'ru' });
    expect(response.body.message).toBe(email_failure);
    mockSendAccountActivation.mockRestore();
  });

  // The End
});
