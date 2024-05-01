const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

const server = express();
server.use(bodyParser.json());
server.use(express.json());
server.use(cors());

// Create a Sequelize instance
const sequelize = new Sequelize(
  "fileuploaded",
  "fileuploaded",
  "fileuploaded",
  {
    host: "localhost",
    dialect: "mysql",
  }
);

// Define the Photos model
const Photo = sequelize.define(
  "Photo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      type: DataTypes.STRING,
    },
    photo: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: false, // Disable createdAt and updatedAt columns
  }
);

// Set up multer storage
const storage = multer.diskStorage({
  destination: "./public/",
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array("myImages", 5);

// Function to check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Create the Records
server.post("/api/fileuploaded/add", upload, async (req, res) => {
  try {
    const photoPaths = req.files.map((file) => file.path);
    const description = req.body.description;

    // Create an array of objects containing the description and photo path
    const values = photoPaths.map((photoPath) => ({
      description: description,
      photo: photoPath,
    }));

    // Insert the values into the database using Sequelize
    await Photo.bulkCreate(values, {
      fields: ["description", "photo"],
      ignoreDuplicates: true,
    });

    res.send({ status: true, message: "Record created successfully" });
  } catch (error) {
    console.error("Error creating record:", error);
    res.send({ status: false, message: "Record creation failed" });
  }
});
server.put("/api/fileuploaded/update/:id", upload, async (req, res) => {
  try {
    let photoPaths = req.files.map((file) => file.path); // Get an array of file paths from the uploaded files
    let serializedPhotoPaths = photoPaths.join(","); // Serialize the array of file paths into a string
    let details = {
      photo: serializedPhotoPaths,
      description: req.body.description,
    };

    const id = req.params.id;
    const photo = await Photo.findByPk(id);
    if (!photo) {
      res.send({ status: false, message: "Record not found" });
    } else {
      await photo.update(details, { fields: ["photo", "description"] });
      res.send({ status: true, message: "Record updated successfully" });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: "Record update failed" });
  }
});

server.delete("/api/fileuploaded/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const photo = await Photo.findByPk(id);
    if (!photo) {
      res.send({ status: false, message: "Record not found" });
    } else {
      await photo.destroy();
      res.send({ status: true, message: "Record deleted successfully" });
    }
  } catch (error) {
    console.log(error);
    res.send({ status: false, message: "Record deletion failed" });
  }
});

server.get("/api/fileuploaded", async (req, res) => {
  try {
    const photos = await Photo.findAll();
    res.send({ status: true, data: photos });
  } catch (error) {
    console.log("Error fetching records:", error);
    res.send({ status: false, message: "Error fetching records" });
  }
});

server.get("/api/fileuploaded/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const photo = await Photo.findByPk(id);
    if (!photo) {
      res.send({ status: false, message: "Record not found" });
    } else {
      res.send({ status: true, data: photo });
    }
  } catch (error) {
    console.log("Error fetching record:", error);
    res.send({ status: false, message: "Error fetching record" });
  }
});

server.listen(9002, (error) => {
  if (error) {
    console.log("Error starting the server:", error);
  } else {
    console.log("Server started on port 9002");
  }
});
