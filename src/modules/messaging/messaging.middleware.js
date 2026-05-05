import twilio from 'twilio';
import crypto from 'crypto';
import redis from '../../config/redis.js';
import { log } from '../../shared/logger.js';


const { validateRequest } = twilio;

/**
 * In-memory store (replace with Redis in production)
 */
const processedRequests = new Map();
const TTL_MS = 5 * 60 * 1000;

/**
 * 1. Request Tracing (Correlation ID)
 */
export const attachRequestId = (req, res, next) => {
  const requestId =
    req.headers['x-request-id'] || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};

/**
 * 2. Twilio Signature Validation
 */
export const validateTwilioRequest = (req, res, next) => {
  try {
    // Skip in dev if needed
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    const signature = req.headers['x-twilio-signature'];

    if (!signature) {
      return res.status(403).send('Missing Twilio signature');
    }

    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      signature,
      url,
      req.body
    );

    if (!isValid) {
      return res.status(403).send('Invalid Twilio signature');
    }

    next();
  } catch (err) {
    console.error('Twilio validation error:', err);
    return res.status(500).send('Validation error');
  }
};

const TTL_SECONDS = 300; // 5 minutes

export const preventReplayAttack = async (req, res, next) => {
  try {
    const uniqueId = req.body.MessageSid || req.body.CallSid;

    if (!uniqueId) {
      return res.status(400).send('Missing unique identifier');
    }

    const key = `twilio:idempotency:${uniqueId}`;

    const result = await redis.set(key, '1', 'NX', 'EX', TTL_SECONDS);

    if (!redis.status || redis.status !== 'ready') {
        log('warn', 'Redis unavailable, skipping idempotency', {
            requestId: req.requestId,
        });
        return next();
    }

    if (result === null) {
      log('warn', 'Replay attack detected', {
        requestId: req.requestId,
        key,
      });

      return res.status(409).send('Duplicate request detected');
    }

    next();
  } catch (err) {
    log('error', 'Redis idempotency failure', {
      requestId: req.requestId,
      error: err.message,
    });

    return res.status(500).send('Internal error');
  }
};


const WINDOW_MS = 60 * 1000; // 1 minute

const LIMITS = {
    '/sms': 5,
    '/voice': 3,
  };
  
const MAX_REQUESTS = LIMITS[endpoint] || 5;

export const rateLimitByPhone = async (req, res, next) => {
  try {
    const phone = req.body.From;
    const endpoint = req.path; // /sms or /voice

    if (!phone) {
      return res.status(400).send('Missing phone number');
    }

    const key = `twilio:rate:${endpoint}:${phone}`;
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    /**
     * Redis sorted set:
     * score = timestamp
     * value = unique request ID
     */
    const requestId = `${now}-${Math.random()}`;

    /**
     * Pipeline for performance
     */
    const pipeline = redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Add current request
    pipeline.zadd(key, now, requestId);

    // Count current requests
    pipeline.zcard(key);

    // Set TTL to auto-clean
    pipeline.expire(key, Math.ceil(WINDOW_MS / 1000));

    const [, , countResult] = await pipeline.exec();
    const current = countResult[1];

    if (current > MAX_REQUESTS) {
      log('warn', 'Rate limit exceeded (sliding window)', {
        requestId: req.requestId,
        phone,
        endpoint,
        count: current,
      });

      return res.status(429).send('Too many requests');
    }

    // Optional headers (nice touch)
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));

    next();
  } catch (err) {
    log('error', 'Sliding rate limiter failure', {
      requestId: req.requestId,
      error: err.message,
    });

    // Fail open (important)
    next();
  }
};