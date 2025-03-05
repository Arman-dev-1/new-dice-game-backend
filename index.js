import express, { json } from "express";
import cors from "cors";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

const app = express();

// Enable CORS so your frontend can communicate with this backend
app.use(cors());
app.use(json());

// POST /roll endpoint: Generate a dice roll and hash
app.post("/roll", (req, res) => {
  const { publicSeed } = req.body;
  if (!publicSeed) {
    return res.status(400).json({ error: "publicSeed is required" });
  }

  // Generate a new random serverSeed for each roll
  const serverSeed = uuidv4();

  // Create a SHA-256 hash from the concatenated seeds
  const hash = createHash("sha256")
    .update(publicSeed + serverSeed)
    .digest("hex");

  // Convert the hash to a big integer and compute dice value (1 to 6)
  const hashInt = BigInt("0x" + hash);
  const dice = Number(hashInt % 6n) + 1;

  res.json({ dice, hash, serverSeed });
});

// POST /verify endpoint: Verify dice roll authenticity
app.post("/verify", (req, res) => {
  const { publicSeed, serverSeed, originalHash } = req.body;
  if (!publicSeed || !serverSeed || !originalHash) {
    return res
      .status(400)
      .json({ error: "publicSeed, serverSeed, and originalHash are required" });
  }

  // Recompute the hash using the provided serverSeed
  const computedHash = createHash("sha256")
    .update(publicSeed + serverSeed)
    .digest("hex");

  // Check if the computed hash matches the original hash provided
  const valid = computedHash === originalHash;
  res.json({ valid });
});

// Use process.env.PORT if available, otherwise default to 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
