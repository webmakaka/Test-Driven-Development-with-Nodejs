import * as bcrypt from 'bcryptjs';
import { User } from '~/user/User';

const save = async (body) => {
  const hash = await bcrypt.hash(body.password, 10);
  const user = {
    ...body,
    password: hash,
  };
  await User.create(user);
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

export const UserService = {
  save,
  findByEmail,
};
