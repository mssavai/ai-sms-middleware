import express from 'express';
import messagingRoutes from './modules/messaging/messaging.routes.js';
import errorHandler from './shared/middleware/errorHandler.js';
import requestLogger from './shared/middleware/requestLogger.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use('/webhooks/twilio', messagingRoutes);

app.use(errorHandler);

export default app;