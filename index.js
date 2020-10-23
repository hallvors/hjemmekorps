const express = require("express");

const app = express();

app.use(express.static("./client"));

app.use("/api", (req, res) => {
  res.json({
    msg: "Hei!",
  });
});

const PORT = 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
