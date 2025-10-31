// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// Folder for each device’s message file
const dataDir = path.join(__dirname, "device_data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function getDeviceFile(id) {
  return path.join(dataDir, `${id}.txt`);
}

// =====================================
// GET /message?id=device1
// =====================================
app.get("/message", (req, res) => {
  const id = req.query.id || "default";
  const file = getDeviceFile(id);

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "0000000000 000");
  }

  fs.readFile(file, "utf8", (err, data) => {
    if (err) return res.status(500).send("ERROR");
    console.log(`📡 ${id} fetched: ${data.trim()}`);
    res.type("text/plain").send(data.trim());
  });
});

// =====================================
// POST /message (update device message)
// =====================================
app.post("/message", (req, res) => {
  const id = req.body.id?.trim();
  const newMessage = req.body.message?.trim();

  if (!id || !newMessage) return res.status(400).send("Missing ID or message");

  const file = getDeviceFile(id);
  fs.writeFile(file, newMessage, (err) => {
    if (err) return res.status(500).send("Failed to write");
    console.log(`✅ Updated ${id}: ${newMessage}`);
    res.send(`
      <html>
        <body style="font-family:Arial;background:#0d1117;color:#c9d1d9;text-align:center;margin-top:100px;">
          <h2>✅ Message Updated for ${id}</h2>
          <p><b>${newMessage}</b></p>
          <a href="/" style="color:#58a6ff;">Go Back</a>
        </body>
      </html>
    `);
  });
});

// =====================================
// CONTROL PANEL PAGE
// =====================================
app.get("/", (req, res) => {
  const files = fs.existsSync(dataDir)
    ? fs.readdirSync(dataDir).filter(f => f.endsWith(".txt"))
    : [];

  let list = files.map(f => `<li>${f.replace(".txt", "")}</li>`).join("") || "<li>No devices yet</li>";

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Samtronics Multi-Device Control</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; background: #0d1117; color: #c9d1d9; text-align: center; margin-top: 40px; }
        form { background: #161b22; padding: 20px; border-radius: 10px; width: 320px; margin: auto; }
        input, button { padding: 10px; margin: 5px; border-radius: 5px; border: none; width: 90%; }
        button { background: #238636; color: white; cursor: pointer; }
        ul { list-style: none; padding: 0; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>🧠 Samtronics Multi-Device Control</h1>
      <form action="/message" method="POST">
        <input type="text" name="id" placeholder="Device ID (e.g. device1)" required><br>
        <input type="text" name="message" placeholder="Message (e.g. 0741842196 100)" required><br>
        <button type="submit">Update Message</button>
      </form>
      <h3>📋 Active Devices</h3>
      <ul>${list}</ul>
    </body>
    </html>
  `);
});

// =====================================
// START SERVER
// =====================================
app.listen(PORT, () => {
  console.log(`✅ Samtronics Server running at: http://10.185.135.31:${PORT}`);
  console.log(`📡 Endpoint for ESP8266: http://10.185.135.31:${PORT}/message?id=device1`);
});
