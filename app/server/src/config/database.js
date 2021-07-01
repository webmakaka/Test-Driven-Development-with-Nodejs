import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('hoaxify', 'my-db-user', 'db-pass-123', {
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

export { sequelize };
