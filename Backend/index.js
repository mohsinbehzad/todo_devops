const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tododb' || 'mongodb+srv://todo_admin:8DsOp0apEbGBTOq0@cluster0.ym7jtyv.mongodb.net/?appName=Cluster0';

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json());

// ── MongoDB Connection ────────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// ── Todo Schema ───────────────────────────────────────────────────
const todoSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  priority:    { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  category:    { type: String, trim: true, default: 'General' },
  completed:   { type: Boolean, default: false },
  dueDate:     { type: Date, default: null },
  createdAt:   { type: Date, default: Date.now }
});

const Todo = mongoose.model('Todo', todoSchema);

// ── Routes ────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Todo API running', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// GET all todos (with optional filters)
app.get('/api/todos', async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    let filter = {};
    if (status === 'completed')   filter.completed = true;
    if (status === 'pending')     filter.completed = false;
    if (priority)                 filter.priority  = priority;
    if (category)                 filter.category  = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const todos = await Todo.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: todos.length, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single todo
app.get('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create todo
app.post('/api/todos', async (req, res) => {
  try {
    const todo = new Todo(req.body);
    const saved = await todo.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH toggle complete
app.patch('/api/todos/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    todo.completed = !todo.completed;
    await todo.save();
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, message: 'Todo deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET stats
app.get('/api/stats', async (req, res) => {
  try {
    const total     = await Todo.countDocuments();
    const completed = await Todo.countDocuments({ completed: true });
    const pending   = await Todo.countDocuments({ completed: false });
    const high      = await Todo.countDocuments({ priority: 'High', completed: false });
    res.json({ success: true, data: { total, completed, pending, highPriority: high } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST seed sample data
app.post('/api/seed', async (req, res) => {
  try {
    await Todo.deleteMany({});
    const samples = [
      { title: 'Set up AWS EC2 instance',        priority: 'High',   category: 'DevOps',   description: 'Launch and configure Ubuntu 22.04 t2.micro' },
      { title: 'Write Dockerfile for backend',   priority: 'High',   category: 'DevOps',   description: 'Node.js alpine image with Express API' },
      { title: 'Configure Nginx reverse proxy',  priority: 'Medium', category: 'DevOps',   description: 'Route /api to backend, / to frontend' },
      { title: 'Push images to Docker Hub',      priority: 'Medium', category: 'DevOps',   description: 'Tag and push backend and frontend images' },
      { title: 'Install Jenkins on EC2',         priority: 'High',   category: 'CI/CD',    description: 'Set up Jenkins with Docker and Git plugins' },
      { title: 'Create Jenkins pipeline',        priority: 'High',   category: 'CI/CD',    description: 'Write Jenkinsfile with checkout and deploy stages' },
      { title: 'Configure GitHub webhook',       priority: 'Medium', category: 'CI/CD',    description: 'Point webhook to Jenkins server port 8080' },
      { title: 'Write assignment report',        priority: 'Low',    category: 'Academic', description: 'Document all steps with screenshots', completed: true },
      { title: 'Submit Google Form',             priority: 'Medium', category: 'Academic', description: 'Add GitHub and deployment URLs' },
      { title: 'Add instructor as collaborator', priority: 'Low',    category: 'Academic', description: 'Add qasimalik@gmail.com to GitHub repo', completed: true },
    ];
    const todos = await Todo.insertMany(samples);
    res.json({ success: true, message: `${todos.length} todos seeded`, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Todo API running on port ${PORT}`));
