import messagingService from './messaging.service.js';
import { log } from '../../shared/logger.js';

export const handleIncomingSMS = async (req, res) => {
  try {
    const { Body, From } = req.body;

    log('info', 'Incoming SMS', {
      requestId: req.requestId,
      from: From,
      message: Body,
    });

    const response = await messagingService.processMessage({
      message: Body,
      from: From,
      requestId: req.requestId,
    });

    log('info', 'Response sent', {
      requestId: req.requestId,
      response,
    });

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${response}</Message></Response>`);
  } catch (err) {
    log('error', 'Processing failed', {
      requestId: req.requestId,
      error: err.message,
    });

    res.status(500).send('Error processing message');
  }
};