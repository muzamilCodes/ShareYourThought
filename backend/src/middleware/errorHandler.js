export function errorHandler(error, _req, res, _next) {
  let status = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';

  // Handle Mongoose duplicate key error (E11000)
  if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists`;
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    status = 400;
    const messages = Object.values(error.errors || {}).map((e) => e.message);
    message = messages.join(', ') || 'Validation error';
  }

  // Handle Mongoose invalid ObjectId (CastError)
  if (error.name === 'CastError') {
    status = 400;
    message = `Invalid identifier format: ${error.value}`;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid authentication token';
  }
  if (error.name === 'TokenExpiredError') {
    status = 401;
    message = 'Authentication session expired, please login again';
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}
