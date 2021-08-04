export const errorHandler = (err, req, res, next) => {
  const { status, message, errors } = err;

  let validationErrors;

  if (errors) {
    validationErrors = {};
    errors.forEach(
      (error) => (validationErrors[error.param] = req.t(error.msg))
    );
  }
  return res.status(status).send({ message: req.t(message), validationErrors });
};