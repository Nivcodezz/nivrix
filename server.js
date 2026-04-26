const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const cors = require("cors");
const Link = require("./models/Link");

const app = express();
app.use(express.json());
app.use(cors());

// 🔗 Koneksi MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/nivrix", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 📌 Endpoint: Buat shortlink
app.post("/api/shorten", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url.startsWith("http")) {
      return res.status(400).json({ error: "URL tidak valid" });
    }

    const shortId = nanoid(6);

    const newLink = new Link({
      originalUrl: url,
      shortId
    });

    await newLink.save();

    res.json({
      shortUrl: `http://localhost:3000/${shortId}`
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔁 Redirect + tracking
app.get("/:shortId", async (req, res) => {
  try {
    const link = await Link.findOne({ shortId: req.params.shortId });

    if (!link) return res.status(404).send("Link tidak ditemukan");

    link.clicks++;
    await link.save();

    res.redirect(link.originalUrl);

  } catch (err) {
    res.status(500).send("Error");
  }
});

// 📊 Statistik link
app.get("/api/stats/:shortId", async (req, res) => {
  try {
    const link = await Link.findOne({ shortId: req.params.shortId });

    if (!link) return res.status(404).json({ error: "Tidak ditemukan" });

    res.json({
      originalUrl: link.originalUrl,
      clicks: link.clicks,
      createdAt: link.createdAt
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ▶️ Start server
app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});
