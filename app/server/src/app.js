import express from 'express';
import { router as UserRouter } from './user/UserRouter';

const app = express();

app.use(express.json());
app.use(UserRouter);

export { app };
