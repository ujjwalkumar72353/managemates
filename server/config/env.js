const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.jwt_secret) {
  if (isProduction) {
    throw new Error("jwt_secret is required in production");
  }
  process.env.jwt_secret = "local-development-only-secret";
}

module.exports = { isProduction };
