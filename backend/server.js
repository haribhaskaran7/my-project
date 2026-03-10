const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.post("/calculate", (req, res) => {
  const { amount, rate, years } = req.body;

  const futureValue = amount * Math.pow(1 + rate / 100, years);

  res.json({
    futureValue: futureValue.toFixed(2)
  });
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});