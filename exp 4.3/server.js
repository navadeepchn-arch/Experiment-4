const express = require("express");
const redis = require("redis");
const app = express();
app.use(express.json());
const client = redis.createClient({
  url: "redis://localhost:6379",
});
client.on("error", (err) => console.error("Redis error:", err));
const TOTAL_SEATS = 100;
const LOCK_TTL = 10;
async function initSeats() {
  const exists = await client.exists("available_seats");
  if (!exists) {
    await client.set("available_seats", TOTAL_SEATS);
    console.log(`Initialized ${TOTAL_SEATS} seats`);
  }
}
app.get("/", (req, res) => {
  res.json({ message: "Concurrent Ticket Booking System", version: "1.0.0" });
});
app.get("/api/seats", async (req, res) => {
  try {
    const seats = await client.get("available_seats");
    res.json({
      totalSeats: TOTAL_SEATS,
      availableSeats: parseInt(seats),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/lock", async (req, res) => {
  const { userId } = req.body;
  if (!userId)
    return res.status(400).json({ error: "userId is required" });
  const lockKey = `lock:${userId}`;
  try {
    const alreadyLocked = await client.exists(lockKey);
    if (alreadyLocked)
      return res.status(409).json({ error: "You already have a seat locked" });
    const luaScript = `
      local seats = tonumber(redis.call('GET', KEYS[1]))
      if seats == nil or seats <= 0 then
        return 0
      end
      local locked = redis.call('SET', KEYS[2], 1, 'NX', 'EX', ARGV[1])
      if locked then
        redis.call('DECR', KEYS[1])
        return 1
      end
      return -1
    `;
    const result = await client.eval(luaScript, {
      keys: ["available_seats", lockKey],
      arguments: [String(LOCK_TTL)],
    });
    if (result === 0)
      return res.status(409).json({ error: "No seats available" });
    if (result === -1)
      return res.status(409).json({ error: "Lock failed, try again" });
    const remaining = await client.get("available_seats");
    res.json({
      success: true,
      message: "Seat locked for 10 seconds",
      userId,
      lockExpiresIn: `${LOCK_TTL} seconds`,
      remaining: parseInt(remaining),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/book", async (req, res) => {
  const { userId } = req.body;
  if (!userId)
    return res.status(400).json({ error: "userId is required" });
  const lockKey = `lock:${userId}`;
  const bookingKey = `booking:${userId}`;
  try {
    const lockExists = await client.exists(lockKey);
    if (!lockExists)
      return res.status(400).json({
        error: "No active lock. Call /api/lock first or lock expired.",
      });
    const alreadyBooked = await client.exists(bookingKey);
    if (alreadyBooked)
      return res.status(409).json({ error: "Already booked" });

    const bookingId = Date.now();
    await client.set(
      bookingKey,
      JSON.stringify({
        bookingId,
        userId,
        bookedAt: new Date().toISOString(),
      }),
      { EX: 86400 }
    );
    await client.del(lockKey);
    const remaining = await client.get("available_seats");
    res.status(201).json({
      success: true,
      bookingId,
      remaining: parseInt(remaining),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/booking/:userId", async (req, res) => {
  try {
    const data = await client.get(`booking:${req.params.userId}`);
    if (!data)
      return res.status(404).json({ error: "Booking not found" });
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/booking/:userId", async (req, res) => {
  try {
    const data = await client.get(`booking:${req.params.userId}`);
    if (!data)
      return res.status(404).json({ error: "Booking not found" });

    await client.del(`booking:${req.params.userId}`);
    await client.incr("available_seats");
    res.json({ success: true, message: "Booking cancelled, seat restored" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const PORT = process.env.PORT || 3000;
async function start() {
  await client.connect();
  await initSeats();
  app.listen(PORT, () =>
    console.log(`Booking system running on port ${PORT}`)
  );
}
start().catch(console.error);