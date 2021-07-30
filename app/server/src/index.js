import { app } from '~/app';
import { sequelize } from '~/config/database';

sequelize.sync({ force: true });

app.listen(3000, () => console.log('[App] App is running!'));
