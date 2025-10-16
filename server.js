// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ✅ Configure CORS properly
app.use(cors({
  origin: [
    "http://localhost:5173",                   // local dev frontend (Vite)
    "http://localhost:8080",                   // added for local dev frontend on port 8080
    "https://sonafaculty-dashboard.netlify.app", // deployed frontend on Netlify
    "https://sonafaculty-dashboard.vercel.app" // deployed frontend on Vercel
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
}));

app.use(express.json());

// ✅ Main connection for studentidreq database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Models for studentidreq database
const idCardSchema = new mongoose.Schema({}, { strict: false });
const IdCard = mongoose.model("IdCard", idCardSchema, "idcards");
const RejectedIdCard = mongoose.model("RejectedIdCard", idCardSchema, "rejectedidcards");
const PrintId = mongoose.model("PrintId", idCardSchema, "printids");  // ✅ added here

// ✅ facultynumbers collection
const facultySchema = new mongoose.Schema({
  facNumber: { type: String, required: true, unique: true }
});
const FacultyNumber = mongoose.model("FacultyNumber", facultySchema, "facultynumbers");

// ✅ PATCH API to approve/reject requests
app.patch("/api/requests/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await IdCard.findById(id);
    if (!request) {
      return res.status(404).send({ message: "Request not found" });
    }

    if (status === "approved") {
      request.status = "approved";

      // ✅ Save into printids collection in same DB
      const printReq = new PrintId(request.toObject());
      await printReq.save();
    } else if (status === "rejected") {
      const rejectedReq = new RejectedIdCard(request.toObject());
      await rejectedReq.save();
    }

    // ✅ Remove from pending (idcards) after moving
    await IdCard.findByIdAndDelete(id);

    res.send({ message: `Request ${status} successfully` });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// ✅ GET APIs
app.get("/api/pending", async (req, res) => {
  try {
    const data = await IdCard.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.get("/api/approved", async (req, res) => {
  try {
    const data = await PrintId.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching approved requests:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.get("/api/rejected", async (req, res) => {
  try {
    const data = await RejectedIdCard.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching rejected requests:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// ✅ check faculty ID existence
app.get("/api/check-faculty/:id", async (req, res) => {
  try {
    const facultyId = req.params.id;
    const faculty = await FacultyNumber.findOne({ facNumber: facultyId });
    res.json({ valid: !!faculty });
  } catch (error) {
    console.error("Error checking faculty ID:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// ✅ History models
const accHistorySchema = new mongoose.Schema({}, { strict: false });
const AccHistoryId = mongoose.model("AccHistoryId", accHistorySchema, "acchistoryids");

const rejHistorySchema = new mongoose.Schema({}, { strict: false });
const RejHistoryId = mongoose.model("RejHistoryId", rejHistorySchema, "rejhistoryids");

// ✅ History APIs
app.get("/api/acchistoryids", async (req, res) => {
  try {
    const data = await AccHistoryId.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching approved history data:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

app.get("/api/rejhistoryids", async (req, res) => {
  try {
    const data = await RejHistoryId.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching rejected history data:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// ✅ Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "ReIDentify Backend API is running",
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ReIDentify Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
});