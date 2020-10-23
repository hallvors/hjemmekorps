const express = require("express");

const app = express();

app.use("/", (req, res) => {
  res.json({
    msg: "Hei!",
  });
});

const PORT = 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
