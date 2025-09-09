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
    "https://sonafaculty-dashboard.netlify.app" // deployed frontend on Netlify
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  //credentials: true
}));

app.use(express.json());

// Main connection for studentidreq database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Models for studentidreq database
const idCardSchema = new mongoose.Schema({}, { strict: false });
const IdCard = mongoose.model("IdCard", idCardSchema, "idcards");
const RejectedIdCard = mongoose.model("RejectedIdCard", idCardSchema, "rejectedidcards");

  
// Model for facultynumbers collection
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
      // Copy to printids collection in printidreq DB
      const printReq = new PrintId(request.toObject());
      await printReq.save();
    } else if (status === "rejected") {
      // Copy to rejectedidcards collection in studentidreq DB
      const rejectedReq = new RejectedIdCard(request.toObject());
      await rejectedReq.save();
    }

    // Delete from idcards collection after processing
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

  
// New API endpoint to check faculty ID existence
app.get("/api/check-faculty/:id", async (req, res) => {
  try {
    const facultyId = req.params.id;
    const faculty = await FacultyNumber.findOne({ facNumber: facultyId });
    if (faculty) {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error("Error checking faculty ID:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

  
// Models for acchistoryid and rejhistoryids collections
const accHistorySchema = new mongoose.Schema({}, { strict: false });
const AccHistoryId = mongoose.model("AccHistoryId", accHistorySchema, "acchistoryid");

const rejHistorySchema = new mongoose.Schema({}, { strict: false });
const RejHistoryId = mongoose.model("RejHistoryId", rejHistorySchema, "rejhistoryids");

// New API endpoints to fetch approved and rejected history data
app.get("/api/acchistoryid", async (req, res) => {
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

// Health check endpoint
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