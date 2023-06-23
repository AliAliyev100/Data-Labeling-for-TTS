const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const { exec } = require("child_process");
const cron = require("node-cron");

const textfile = require("./models/textfile");
const User = require("./models/user");

const audioRouter = require("./routes/audio");
const filesRouter = require("./routes/files");
const adminRouter = require("./routes/admin");
const authRouter = require("./routes/auth");

const isAuth = require("./middleware/is-auth");
const isAdmin = require("./middleware/is-admin");

const app = express();
app.use(express.json());

const fileStorageAudio = multer.diskStorage({
  destination: (req, file, cb) => {
    let folderName;
    return User.findById(req.userId)
      .then((user) => {
        folderName = "Audios/" + user.name + "_audios";
        if (!fs.existsSync(folderName)) {
          fs.mkdirSync(folderName);
        }
      })
      .then((result) => {
        cb(null, folderName);
      });
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname + ".wav");
  },
});

const fileStorageText = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Texts");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilterText = (req, file, cb) => {
  if (
    file.mimetype === "text/plain" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const fileFilterAudio = (req, file, cb) => {
  if (file.mimetype === "audio/wav") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploadAudio = multer({
  storage: fileStorageAudio,
  fileFilter: fileFilterAudio,
}).single("audio");

const uploadText = multer({
  storage: fileStorageText,
  fileFilter: fileFilterText,
}).single("text");

app.use(express.static("public"));
app.use("/audios", express.static(path.join(__dirname, "Audios")));

app.use("/audio", isAuth, uploadAudio, audioRouter);
app.use("/files", isAuth, uploadText, filesRouter);
app.use("/admin", isAuth, isAdmin, uploadText, adminRouter);
app.use("/auth", authRouter);

authRouter;

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message;
  const data = error.data;
  // res.redirect("./error.html")
  res.status(status).json({ message: message, data: data });
});

const mongoURI = "mongodb://127.0.0.1:27017/tts";

const password = "AdminAliyev1!";

mongoose
  .connect(mongoURI)
  .then(() => {
    // bcrypt.hash(password, 12).then((hashedPassword) => {
    //   const user = new User({
    //     password: hashedPassword,
    //     name: "Ali",
    //     isAdmin: true
    //   });
    //   return user.save();
    // });

    app.listen(3000);

    cron.schedule("0 21 * * *", () => {
      performBackup();
    });

    // Function to perform MongoDB backup
    async function performBackup() {
      try {
        const backupDir = __dirname + "/backups"; // Specify the backup directory here

        const currentDate = new Date().toISOString().replace(/:/g, "-");
        const backupFileName = `backup_${currentDate}`;
        const command = `mongodump --uri=${mongoURI} --out=${backupDir}/${backupFileName}`;

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("MongoDB backup failed:", error);
          } else {
            console.log("MongoDB backup completed");
          }
        });
      } catch (error) {
        console.error("MongoDB backup failed:", error);
      }
    }

    // backup -> mongorestore --mongorestore --uri=mongodb://localhost:27017 --dir=backups\backup_2023-06-22T12-51-00.745Z/tts
    process.on("SIGINT", () => {
      mongoose.connection.close(() => {
        server.close(() => {
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => {
    throw new Error(err);
  });
