const express = require('express');
const queries = require('../models/queries');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all
router.get('/', async (req, res) => {
  const projects = await queries.getAllProjects();
  res.json(projects);
});

// Get by user
router.get('/me', async (req, res) => {
  const projects = await queries.getProjectsByUser(req.user.id);
  res.json(projects);
});

// Create
router.post('/', async (req, res) => {
  const { topic, description, repo_link, team_members } = req.body;
  const members = JSON.parse(team_members || '[]');
  const attachments = [];

  if (req.files) {
    const files = Array.isArray(req.files.attachments)
      ? req.files.attachments
      : [req.files.attachments];
    for (let f of files) {
      const fileName = Date.now() + '-' + f.name;
      const dir = path.join(__dirname, '../uploads/');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      await f.mv(path.join(dir, fileName));
      attachments.push(fileName);
    }
  }

  const project = await queries.createProject({
    user_id: req.user.id,
    topic,
    description,
    repo_link,
    attachments,
    team_members: members,
  });
  res.json(project);
});

module.exports = router;
