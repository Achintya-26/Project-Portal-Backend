const db = require('./db');
const bcrypt = require('bcrypt');

module.exports = {
  createUser: async ({ username, email, password }) => {
    const hash = await bcrypt.hash(password, 10);
    const res = await db.query(
      `INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING id,username,email`,
      [username, email, hash]
    );
    return res.rows[0];
  },
  findUserByEmail: async (email) => {
    const res = await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
    return res.rows[0];
  },
  getUserById: async (id) => {
    const res = await db.query(`SELECT id,username,email FROM users WHERE id=$1`, [id]);
    return res.rows[0];
  },
  createProject: async ({ user_id, topic, description, repo_link, attachments, team_members }) => {
    const res = await db.query(
      `INSERT INTO projects (user_id, topic, description, repo_link, attachments, team_members)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [user_id, topic, description, repo_link, attachments, team_members]
    );
    return res.rows[0];
  },
  getAllProjects: async () => {
    const res = await db.query(`SELECT p.*, u.username FROM projects p JOIN users u ON p.user_id = u.id ORDER BY p.id DESC`);
    return res.rows;
  },
  getProjectsByUser: async (user_id) => {
    const res = await db.query(`SELECT * FROM projects WHERE user_id=$1 ORDER BY id DESC`, [user_id]);
    return res.rows;
  },
  searchProjectsByTopic: async (search) => {
    if (!search) {
      const res = await db.query(`
      SELECT p.*, u.username 
      FROM projects p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.id DESC
    `);
      return res.rows;
    }

    const res = await db.query(`
    SELECT p.*, u.username 
    FROM projects p 
    JOIN users u ON p.user_id = u.id 
    WHERE LOWER(p.topic) LIKE $1 
    ORDER BY p.id DESC
  `, [`%${search}%`]);

    return res.rows;
  },

  getProjectById: async (id) => {
    const resData = await db.query(`
    SELECT p.*, u.username FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ${id}
  `);
    return resData;
  }
};