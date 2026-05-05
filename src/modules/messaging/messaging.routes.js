import express from 'express';
import { handleIncomingSMS } from './messaging.controller.js';

import {
    attachRequestId,
    validateTwilioRequest,
    preventReplayAttack,
    rateLimitByPhone,
  } from './messaging.middleware.js';
  
  router.post(
    '/sms',
    attachRequestId,
    validateTwilioRequest,
    preventReplayAttack,
    rateLimitByPhone,
    handleIncomingSMS,
    (req, res) => {
        res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));
      }
  );

router.post(
  '/voice',
  attachRequestId,
  validateTwilioRequest,
  preventReplayAttack,
  (req, res) => {
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Say>Your request is being processed.</Say>
      </Response>
    `);
  }
);

export default router;