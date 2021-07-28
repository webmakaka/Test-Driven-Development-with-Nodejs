import config from 'config';
import { Sequelize } from 'sequelize';

const dbConfig = config.get('database');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    dialect: dbConfig.dialect,
    storage: dbConfig.storage,
    logging: dbConfig.logging,
  }
);

export { sequelize };
