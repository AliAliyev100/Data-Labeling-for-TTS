const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.login = (req, res, next) => {
  const name = req.body.name;
  const password = req.body.password;

  let loadedUser;

  User.findOne({ name: name })
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found.!");
        error.status = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, loadedUser.password).then((isEqual) => {
        if (!isEqual) {
          return res.status(401).json({});
        }
        let hours = 5;

        const token = jwt.sign(
          {
            userId: loadedUser._id.toString(),
          },
          "someuppersecretsecret",
          { expiresIn: hours + "h" }
        );

        const currentDate = new Date(); // Current date and time
        const expiryDate = new Date(
          currentDate.getTime() + hours * 60 * 60 * 1000
        );

        res.status(200).json({
          loginToken: token,
          userId: loadedUser._id.toString(),
          expiryDate: expiryDate,
        });
      });
    })
    .catch((err) => {
      if (!err.status) {
        err.status = 500;
      }
      next(err);
    });
};
