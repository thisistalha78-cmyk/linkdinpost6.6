import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors()); // ✅ এটা ঠিক আছে
app.use(express.json());

/* ======================
   TEST
====================== */
app.get("/", (req, res) => {
  res.send("Linkdino backend running ✅");
});

/* ======================
   LINKEDIN POST (OpenRouter)
====================== */
app.post("/api/post", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a professional LinkedIn content writer. Write engaging LinkedIn posts only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await orRes.json();
    res.json({ post: data.choices?.[0]?.message?.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Post generation failed" });
  }
});

/* ======================
   GENERATE (USED BY LANDING PAGE)
====================== */
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: "You write clean, professional LinkedIn posts.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await aiRes.json();
    res.json({
      result: data.choices?.[0]?.message?.content || "No response",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

/* ======================
   VIDEO SEARCH (Pexels)
====================== */
app.post("/api/video", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }

    const pxRes = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(
        query
      )}&per_page=1`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY,
        },
      }
    );

    const data = await pxRes.json();
    if (!data.videos || data.videos.length === 0) {
      return res.json({ video: null });
    }

    const file =
      data.videos[0].video_files.find((v) => v.quality === "hd") ||
      data.videos[0].video_files[0];

    res.json({ video: file.link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Video fetch failed" });
  }
});

/* ======================
   START SERVER (LAST)
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

