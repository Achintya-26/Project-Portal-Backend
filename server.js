require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
