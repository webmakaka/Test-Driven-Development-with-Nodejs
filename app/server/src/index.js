import { app } from 'app';
import { sequelize } from 'config/database';

sequelize.sync();

app.listen(3000, () => console.log('App is running'));
