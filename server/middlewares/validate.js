const { z } = require("zod");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issue = result.error.issues[0];
    return res.status(400).send({
      success: false,
      message: `${issue.path.join(".") || "Request"}: ${issue.message}`,
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate, objectId };
