// we want to inherit from the built in Error class
class AppError extends Error {
  constructor(message, statusCode) {
    //when ever we extend we use super() to call the parent constructor
    //in this case the parent Error only accepts message in the constructor
    super(message);
    this.statusCode = statusCode;
    //to use startsWith() we need to change the statusCode to string cause it works on strings
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // this errors are operational errors
    this.isOperational = true;

    // Stack trace to show where the error was created
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
