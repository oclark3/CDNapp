import express from 'express';
import cors from 'cors';
import assetRoutes from './routes/asset.route';
import userRoutes from './routes/user.route';
import { ENV_VARS } from './config/envVars';

const app = express();

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const authRateLimits = new Map<string, RateLimitBucket>();

const createRateLimitMiddleware = (windowMs: number, maxRequests: number) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0].trim()
      : req.ip || req.socket.remoteAddress || 'unknown';
    const routeKey = `${req.method}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const bucketKey = `${clientIp}:${routeKey}`;

    const bucket = authRateLimits.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
      authRateLimits.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    return next();
  };
};

const authEndpointLimiter = createRateLimitMiddleware(15 * 60 * 1000, 10);

// Middleware
const corsOptions = {
  origin: ENV_VARS.ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: false,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' })); // Limit request body to 10KB; function so can parse req.body object

app.use('/api/v1/user/create', authEndpointLimiter);
app.use('/api/v1/user/authenticate', authEndpointLimiter);
app.use('/api/v1/user/forgot-password', authEndpointLimiter);
app.use('/api/v1/user/change-password', authEndpointLimiter);
app.use('/api/v1/user/delete', authEndpointLimiter);
app.use('/api/v1/user/logout', authEndpointLimiter);

// Routes
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/user', userRoutes);

// Start server
const PORT = ENV_VARS.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${ENV_VARS.NODE_ENV || 'development'}`);
});

export default app;
