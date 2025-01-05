const express = require("express");
const router = express.Router();
const Card = require("../models/Card");

// In-memory store for demo
let cards = [];

// Create
router.post("/", (req, res) => {
  const { uid, lastAssigned, isValid } = req.body;
  const newCard = new Card(uid, lastAssigned, isValid);
  cards.push(newCard);
  res.json(newCard);
});

// Read
router.get("/", (req, res) => {
  res.json(cards);
});

// Update
router.put("/:uid", (req, res) => {
  const cardIndex = cards.findIndex(c => c.uid === req.params.uid);
  if (cardIndex > -1) {
    cards[cardIndex] = { ...cards[cardIndex], ...req.body };
    return res.json(cards[cardIndex]);
  }
  res.status(404).json({ error: "Card not found" });
});

// Delete
router.delete("/:uid", (req, res) => {
  cards = cards.filter(c => c.uid !== req.params.uid);
  res.json({ success: true });
});

module.exports = router;