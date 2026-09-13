const express = require("express");
const router = express.Router();
const axios = require("axios");
const { handleChatQuery } = require("../controllers/chatController"); // check exact folder name/casing

router.post("/", handleChatQuery);

/**router.post("/api/chat", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:4000/api/chat",
      req.body,
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ reply: "Chat service abhi down hai" });
  }
});*/

module.exports = router;
