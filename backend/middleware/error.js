exports.notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

exports.errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  let friendlyMessage = err.message;
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoError' ||
    err.name === 'MongoNetworkError' ||
    err.message.includes('buffering timed out') ||
    err.message.includes('connection')
  ) {
    friendlyMessage = 'Database service is temporarily unavailable. Please try again later.';
  }

  res.status(statusCode).json({
    message: friendlyMessage,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
