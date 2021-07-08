import * as bcrypt from 'bcryptjs';
import express from 'express';
import { User } from '~/user/User';

const app = express();
app.use(express.json());

app.post('/api/1.0/users', (req, res) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = {
      username: req.body.username,
      email: req.body.email,
      password: hash,
    };
    User.create(user).then(() => {
      return res.send({ message: 'User created' });
    });
  });
});

export { app };
