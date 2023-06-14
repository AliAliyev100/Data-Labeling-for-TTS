const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not Authenticated");
    error.status = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "someuppersecretsecret");
  } catch (err) {
    return res.status(401).json({ message: "Not logged in" });
  }
  if (!decodedToken) {
    const error = new Error("Not Authenticated");
    error.status = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
};
