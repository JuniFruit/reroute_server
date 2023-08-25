require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8000;
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const client = require("https");
const util = require("util");
const log_file = fs.createWriteStream(__dirname + "/debug.log", { flags: "w" });
const log_stdout = process.stdout;

console.log = function (d) {
  //
  const log = addTimestamp() + d;
  log_file.write(util.format(log) + "\n");
  log_stdout.write(util.format(log) + "\n");
};

app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
app.use(express.json());
app.use("/", express.static(path.resolve(__dirname, "./public")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./public", "index.html"));
});

app.get("/load-wsklad-image", async (req, res) => {
  const { image_url } = req.query;
  const auth_header = req.headers["authorization"];

  if (!auth_header) return res.status(401).send({ message: "No auth header" });

  try {
    const response = await fetch(image_url, {
      method: "GET",
      headers: {
        Authorization: auth_header,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      return res.status(response.statusCode).send();
    }

    client.get(response["url"], response => {
      console.log(response.statusMessage);
      console.log(response.statusCode);
      response.pipe(res);
    });
  } catch (error) {
    res.status(500).send(error);
  }
});
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./public", "index.html"));
});

app.use((err, req, res, next) => {
  console.log(`Unresolved err: ${err}`);
  res.status(500).send({ message: "Что-то пошло не так." });

  next();
});

const start = () => {
  try {
    app.listen(PORT, () => {
      console.log("Starting app");
      console.log(`App is listening on port: ${PORT}`);
      console.log(`App started: ${new Date()}`);
    });
  } catch (error) {
    console.log(`Failed to start: ${error.stack}`);
  }
};

start();

/* utils */

function addTimestamp() {
  const date = new Date();

  return `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] `;
}

function objToStr(obj) {
  if (typeof obj !== "object") return "not object";
  return JSON.stringify(obj);
}
