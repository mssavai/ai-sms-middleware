import express from 'express';
import messagingRoutes from './modules/messaging/messaging.routes.js';
import errorHandler from './shared/middleware/errorHandler.js';
import requestLogger from './shared/middleware/requestLogger.js';

const app = express();

/**
 * Capture raw body for Twilio validation
 */
app.use(
  express.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(express.json());

app.use(requestLogger);

app.use('/webhooks/twilio', messagingRoutes);

app.use(errorHandler);

export default app;