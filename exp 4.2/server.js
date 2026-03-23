const express = require("express");
const app = express();
app.use(express.json());
let cards = [];
let nextId = 1;
const SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"];
const VALUES = ["2","3","4","5","6","7","8","9","10","Jack","Queen","King","Ace"];
function validateCard(body) {
  const errors = [];
  if (!body.suit || !SUITS.includes(body.suit))
    errors.push(`suit must be one of: ${SUITS.join(", ")}`);
  if (!body.value || !VALUES.includes(body.value))
    errors.push(`value must be one of: ${VALUES.join(", ")}`);
  if (body.condition && !["Mint","Good","Fair","Poor"].includes(body.condition))
    errors.push("condition must be Mint | Good | Fair | Poor");
  return errors;
}
app.get("/", (req, res) => {
  res.json({ message: "Playing Card Collection API", version: "1.0.0" });
});
app.get("/api/cards", (req, res) => {
  let result = [...cards];
  if (req.query.suit)
    result = result.filter((c) => c.suit.toLowerCase() === req.query.suit.toLowerCase());
  if (req.query.value)
    result = result.filter((c) => c.value.toLowerCase() === req.query.value.toLowerCase());
  res.json({ count: result.length, cards: result });
});
app.get("/api/cards/:id", (req, res) => {
  const card = cards.find((c) => c.id === parseInt(req.params.id));
  if (!card) return res.status(404).json({ error: "Card not found" });
  res.json(card);
});
app.post("/api/cards", (req, res) => {
  const errors = validateCard(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const duplicate = cards.find(
    (c) => c.suit === req.body.suit && c.value === req.body.value
  );
  if (duplicate)
    return res.status(409).json({ error: "This card already exists in your collection" });
  const card = {
    id: nextId++,
    suit: req.body.suit,
    value: req.body.value,
    condition: req.body.condition || "Mint",
    notes: req.body.notes || "",
    addedAt: new Date().toISOString(),
  };
  cards.push(card);
  res.status(201).json(card);
});
app.put("/api/cards/:id", (req, res) => {
  const index = cards.findIndex((c) => c.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Card not found" });
  const errors = validateCard(req.body);
  if (errors.length) return res.status(400).json({ errors });
  cards[index] = {
    ...cards[index],
    suit: req.body.suit,
    value: req.body.value,
    condition: req.body.condition || cards[index].condition,
    notes: req.body.notes !== undefined ? req.body.notes : cards[index].notes,
    updatedAt: new Date().toISOString(),
  };
  res.json(cards[index]);
});
app.patch("/api/cards/:id", (req, res) => {
  const index = cards.findIndex((c) => c.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Card not found" });
  if (req.body.suit && !SUITS.includes(req.body.suit))
    return res.status(400).json({ error: "Invalid suit" });
  if (req.body.value && !VALUES.includes(req.body.value))
    return res.status(400).json({ error: "Invalid value" });
  cards[index] = {
    ...cards[index],
    ...req.body,
    id: cards[index].id,
    updatedAt: new Date().toISOString(),
  };
  res.json(cards[index]);
});
app.delete("/api/cards/:id", (req, res) => {
  const index = cards.findIndex((c) => c.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Card not found" });
  const removed = cards.splice(index, 1)[0];
  res.json({ message: "Card removed", card: removed });
});
app.get("/api/stats/summary", (req, res) => {
  const bySuit = {};
  SUITS.forEach((s) => (bySuit[s] = 0));
  cards.forEach((c) => bySuit[c.suit]++);
  res.json({
    total: cards.length,
    bySuit,
    deckCompletion: `${cards.length}/52`,
    percentComplete: ((cards.length / 52) * 100).toFixed(1) + "%",
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Card Collection API running on http://localhost:${PORT}`)
);