import express from 'express';
import { UserService } from '~/user/UserService';

const router = express.Router();

const validateUsername = (req, res, next) => {
  const user = req.body;
  if (!user.username) {
    req.validationErrors = {
      username: 'Username cannot be null',
    };
  }
  next();
};

const validateEmail = (req, res, next) => {
  const user = req.body;
  if (!user.email) {
    req.validationErrors = {
      ...req.validationErrors,
      email: 'Email cannot be null',
    };
  }
  next();
};

router.post(
  '/api/1.0/users',
  validateUsername,
  validateEmail,
  async (req, res) => {
    if (req.validationErrors) {
      return res
        .status(400)
        .send({ validationErrors: { ...req.validationErrors } });
    }

    await UserService.save(req.body);
    return res.send({ message: 'User created' });
  }
);

export { router };
