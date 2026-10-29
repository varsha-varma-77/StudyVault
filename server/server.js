import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';
import resourceRoutes from './routes/resources.js';
import authRoutes from './routes/auth.js';
import bookmarkRoutes from './routes/bookmarks.js';

// Force Google DNS — fixes SRV lookup failures on local routers
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/resources', resourceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Health check — shows DB connection state
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    message: 'StudyVault API is running',
    database: states[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error' });
});

// Start HTTP server FIRST — so it never goes down due to DB issues
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 StudyVault API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  // Then connect to MongoDB with retries
  connectWithRetry();
});

// ─── MongoDB connection with retry ──────────────────────────────────────────
async function connectWithRetry(attempt = 1) {
  const MAX = 10;
  const DELAY = 5000; // 5s between retries

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    console.log(`✓ MongoDB Atlas connected: ${mongoose.connection.host}`);
    await seedDemoData();
  } catch (err) {
    console.error(`✗ MongoDB attempt ${attempt}/${MAX} failed: ${err.message}`);
    if (attempt < MAX) {
      console.log(`  Retrying in ${DELAY / 1000}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), DELAY);
    } else {
      console.error('  Max retries reached. Check your MONGODB_URI and Atlas IP whitelist.');
    }
  }
}

async function seedDemoData() {
  const { default: Resource } = await import('./models/Resource.js');
  const count = await Resource.countDocuments();
  if (count > 0) return;

  console.log('ℹ  Seeding demo resources...');
  await Resource.insertMany([
    {
      title: 'Data Structures & Algorithms Comprehensive Notes',
      courseCode: 'CS201', department: 'Computer Science', fileFormat: 'PDF',
      fileSize: '4.8 MB', downloadUrl: '#', semester: 3,
      uploader: { name: 'Aarav Sharma', email: 'aarav.sharma@campus.edu', college: 'Institute of Technology' },
      uploadDate: 'Oct 24, 2026', downloadsCount: 342, likesCount: 89,
      description: 'Complete module notes covering AVL trees, graph traversals (BFS, DFS, Dijkstra), dynamic programming, and amortized complexity analysis.',
    },
    {
      title: 'Discrete Mathematics Midterm & Endterm PYQs (2022–2025)',
      courseCode: 'MATH210', department: 'Mathematics', fileFormat: 'PDF',
      fileSize: '6.2 MB', downloadUrl: '#', semester: 3,
      uploader: { name: 'Elena Rostova', email: 'elena.r@campus.edu', college: 'School of Engineering' },
      uploadDate: 'Oct 20, 2026', downloadsCount: 512, likesCount: 140,
      description: 'Compiled solved PYQs with answer schemes covering Propositional Logic, Combinatorics, Recurrence Relations, and Graph Theory.',
    },
    {
      title: 'Operating Systems Lecture Slides & Kernel Architecture',
      courseCode: 'CS304', department: 'Computer Science', fileFormat: 'PPTX',
      fileSize: '12.4 MB', downloadUrl: '#', semester: 5,
      uploader: { name: 'Devon Vance', email: 'devon.v@campus.edu', college: 'Tech University' },
      uploadDate: 'Oct 18, 2026', downloadsCount: 280, likesCount: 75,
      description: 'Slide deck for process synchronization, mutex locks, semaphores, virtual memory paging, and Unix file systems.',
    },
    {
      title: 'Digital Signal Processing Lab Manual & MATLAB Code',
      courseCode: 'EE302', department: 'Electrical', fileFormat: 'ZIP',
      fileSize: '8.1 MB', downloadUrl: '#', semester: 5,
      uploader: { name: 'Maya Lin', email: 'maya.lin@campus.edu', college: 'Institute of Technology' },
      uploadDate: 'Oct 15, 2026', downloadsCount: 198, likesCount: 64,
      description: 'DSP lab assignments with MATLAB scripts for FFT, FIR, and IIR Butterworth filter design.',
    },
    {
      title: 'Fluid Mechanics & Thermodynamics Formula Handbook',
      courseCode: 'ME203', department: 'Mechanical', fileFormat: 'PDF',
      fileSize: '3.5 MB', downloadUrl: '#', semester: 4,
      uploader: { name: 'Lucas Sterling', email: 'lucas.s@campus.edu', college: 'School of Engineering' },
      uploadDate: 'Oct 12, 2026', downloadsCount: 421, likesCount: 110,
      description: 'Compact exam revision sheet with Navier-Stokes, Bernoulli theorem, and Carnot cycle formulas.',
    },
    {
      title: 'Software Engineering & Agile Methodologies Summary',
      courseCode: 'CS402', department: 'Computer Science', fileFormat: 'DOCX',
      fileSize: '2.1 MB', downloadUrl: '#', semester: 7,
      uploader: { name: 'Siddharth Verma', email: 'siddharth.v@campus.edu', college: 'Tech University' },
      uploadDate: 'Oct 08, 2026', downloadsCount: 165, likesCount: 43,
      description: 'Scrum rituals, User Stories, UML notations, TDD, and CI/CD pipelines summarized.',
    },
    {
      title: 'Linear Algebra & Vector Spaces Lecture Summary',
      courseCode: 'MATH102', department: 'Mathematics', fileFormat: 'PDF',
      fileSize: '4.0 MB', downloadUrl: '#', semester: 2,
      uploader: { name: 'Sophia Zhang', email: 'sophia.z@campus.edu', college: 'Institute of Technology' },
      uploadDate: 'Oct 02, 2026', downloadsCount: 630, likesCount: 182,
      description: 'Eigenvalues, Eigenvectors, Diagonalization, Orthogonal Projections, and SVD in handwritten notes.',
    },
    {
      title: 'Microprocessors & 8086 Assembly Language Programming Guide',
      courseCode: 'EE205', department: 'Electrical', fileFormat: 'PDF',
      fileSize: '5.4 MB', downloadUrl: '#', semester: 4,
      uploader: { name: 'Rohan Nair', email: 'rohan.n@campus.edu', college: 'School of Engineering' },
      uploadDate: 'Sep 28, 2026', downloadsCount: 247, likesCount: 58,
      description: '8086 architecture, memory segmentation, pin diagrams, and assembly programs for peripheral interfacing.',
    },
  ]);
  console.log('✓ Demo resources seeded');
}
