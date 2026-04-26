const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const cors = require("cors");

const Link = require("./models/Link");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URI);

// ====== CREATE SHORTLINK ======
app.post("/api/shorten", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "URL tidak valid" });
  }

  const shortId = nanoid(6);

  await Link.create({ originalUrl: url, shortId });

  res.json({
    shortUrl: `${process.env.BASE_URL}/${shortId}`
  });
});

// ====== DASHBOARD ======
app.get("/api/dashboard", async (req, res) => {
  const links = await Link.find();

  let clicks = 0;
  links.forEach(l => clicks += l.clicks);

  res.json({
    totalClicks: clicks,
    totalLinks: links.length,
    earnings: (clicks / 1000 * 3) // CPM $3
  });
});

// ====== LIST LINKS ======
app.get("/api/links", async (req, res) => {
  const links = await Link.find().sort({ createdAt: -1 });
  res.json(links);
});

// ====== INTERSTITIAL ======
app.get("/:id", async (req, res) => {
  const link = await Link.findOne({ shortId: req.params.id });

  if (!link) return res.send("Link tidak ditemukan");

  link.clicks++;
  await link.save();

  res.redirect(`/ads.html?url=${encodeURIComponent(link.originalUrl)}`);
});

// ====== START ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
