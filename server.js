const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '2MB' }));
app.use(bodyParser.json({ limit: '2MB' }));

app.use('/api', require('./api/'));

app.use(express.static('./svelte/public'));

app.get("*", (req, res) => {
  res.sendFile(__dirname + '/svelte/public/index.html');
});


module.exports = app;
