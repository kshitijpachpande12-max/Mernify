function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMsg =
        result.error.issues
          .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
          .join(', ') || 'Validation failed';
      return res.status(400).json({ error: errorMsg });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
