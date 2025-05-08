/**
 * This file exports Express instance for specifically for the deployment of the app on Vercel.
 */

import { AppFactory } from '../src/AppFactory.js';

const app = AppFactory.create().expressApp;

// Add a simple logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

export default app;
