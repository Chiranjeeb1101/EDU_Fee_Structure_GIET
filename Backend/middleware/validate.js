/**
 * Input validation middleware factory.
 * Pass a schema object defining required fields per body/params/query.
 *
 * Usage:
 *   validate({ body: ['full_name', 'password'] })
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      for (const field of schema.body) {
        if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    if (schema.params) {
      for (const field of schema.params) {
        if (!req.params[field]) {
          errors.push(`Missing required param: ${field}`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    next();
  };
}

/**
 * Sanitize string inputs — trim whitespace, remove script tags.
 * Applied as middleware before controllers.
 */
function sanitize(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/[<>]/g, '');
      }
    }
  }
  next();
}

module.exports = { validate, sanitize };
