const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '2MB' }));
app.use(bodyParser.json({ limit: '2MB' }));

const apiRouter = require('./api/');

app.get("/", (req, res) => {
  res.json({
    msg: "Hei!",
  });
});

app.use('/api', apiRouter);

module.exports = app;
