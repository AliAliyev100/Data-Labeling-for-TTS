const jwt = require("jsonwebtoken");

const User = require("../models/user");

module.exports = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      console.log(user);
      console.log("sadasdsa");
      console.log(user.isAdmin);
      console.log("```````````");
      if (!user) {
        return res.status(401).json({ message: "Not Authenticated" });
      }

      if (user.isAdmin !== true) {
        return res.status(401).json({ message: "Not Authenticated" });
      }
      next();
    })
    .catch((err) => {
      console.log(err);
    });
};
