require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Validate ENV
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing from environment variables");
  process.exit(1);
}
console.log("Connecting to:", process.env.MONGODB_URI);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Schema & Model
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  status: String
});
const Job = mongoose.model('Job', jobSchema);

// Routes
app.get('/', (req, res) => {
  res.send('Job Tracker Backend is Running');
});

app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/jobs', async (req, res) => {
  console.log('POST /jobs body:', req.body);
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(200).json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/jobs/:id', async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedJob) return res.status(404).json({ error: 'Job not found' });
    res.json(updatedJob);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(400).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
