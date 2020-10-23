const express = require("express");

const app = express();

const apiRouter = require('./api/');

app.use("/", (req, res) => {
  res.json({
    msg: "Hei!",
  });
});

app.use('/api', apiRouter);

module.exports = app;
