const express = require('express');
const queries = require('../models/queries');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all
// router.get('/', async (req, res) => {
//   const projects = await queries.getAllProjects();
//   res.json(projects);
// });

router.get('/', async (req, res) => {
  const search = req.query.q?.toLowerCase() || '';
  const projects = await queries.searchProjectsByTopic(search);
  res.json(projects);
});

// Get by user
router.get('/me', async (req, res) => {
  const projects = await queries.getProjectsByUser(req.user.id);
  res.json(projects);
});

// Get user profile with all projects (owned or as team member)
router.get('/user/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user data
    const user = await queries.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get all projects for user (owned or as team member)
    const projects = await queries.getAllProjectsForUser(userId);
    
    res.json({
      user,
      projects
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/user/:id', async (req, res) => {
  const projects = await queries.getProjectsByUser(req.params.id);
  res.json(projects);
});

router.get('/:id', async (req, res) => {
  const resData = await queries.getProjectById(req.params.id);

  if (resData.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json(resData.rows[0]);
});


// Create
// Legacy route - removed in favor of the comprehensive route below


router.post('/', async (req, res) => {
 const {
    project_name,
    description,
    search_keywords,
    status,
    source_process_template,
    go_live_date,
    agile_project = false,
    task_actuals_tracking_mode,
    product_version,
    incidental_budget_amount,
    sales_person_1,
    sales_person_2,
    sales_person_3,
    delivery_milestone,
    modules_implemented,
    customer_name,
    customer_address,
    customer_contact_details,
    customer_designation,
    entity,
    region,
    division,
    pid_category,
    business_unit,
    sub_lob,
    inter_company_pid,
    emd_bg_required = false,
    geography,
    group,
    function: func,
    sub_product,
    planned_start_date,
    planned_end_date,
    project_financial_status,
    team_members,
    ip_address,
    browser_info,
    geo_info
  } = req.body;


  console.log(req.body);
  // console.log('team_members raw:', team_members);
  // console.log('modules_implemented raw:', modules_implemented);
  
  // Safely parse JSON strings
  let parsedTeamMembers = [];
  let parsedModulesImplemented = [];
  
  try {
    parsedTeamMembers = team_members ? JSON.parse(team_members) : [];
  } catch (e) {
    console.error('Error parsing team_members:', e);
    parsedTeamMembers = [];
  }
  
  try {
    parsedModulesImplemented = modules_implemented ? JSON.parse(modules_implemented) : [];
  } catch (e) {
    console.error('Error parsing modules_implemented:', e);
    parsedModulesImplemented = [];
  }
  
  // Debug logging
  // console.log('parsedTeamMembers:', parsedTeamMembers);
  // console.log('parsedModulesImplemented:', parsedModulesImplemented);
  // console.log('attachments:', attachments);
  
  // console.log('attachments:', attachments);
  // console.log('parsedTeamMembers:', parsedTeamMembers);
 
  // Capture client information
  const clientIpAddress = ip_address || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown';
  const clientBrowserInfo = browser_info || req.headers['user-agent'] || 'Unknown';
  
  // Handle geo_info properly - it might be a string or an object
  let clientGeoInfo;
  try {
    if (geo_info) {
      // If geo_info is already a string, use it. If it's an object, stringify it
      clientGeoInfo = typeof geo_info === 'string' ? geo_info : JSON.stringify(geo_info);
    } else {
      clientGeoInfo = JSON.stringify({
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown'
      });
    }
  } catch (e) {
    console.error('Error processing geo_info:', e);
    clientGeoInfo = JSON.stringify({
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      timezone: 'Unknown'
    });
  }

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

  console.log('Debug info:');
  console.log('parsedTeamMembers:', parsedTeamMembers);
  console.log('parsedModulesImplemented:', parsedModulesImplemented);
  console.log('attachments:', attachments);
  console.log('clientGeoInfo:', clientGeoInfo);
  console.log('search_keywords:', search_keywords);

  const project = await queries.createProject({
    user_id: req.user.id,
    project_name: project_name, // This will map to topic in the database
    description,
    search_keywords,
    attachments,
    team_members: parsedTeamMembers,
    // Store additional fields as metadata in description or separate handling
    status,
    source_process_template,
    go_live_date,
    agile_project,
    task_actuals_tracking_mode,
    product_version,
    incidental_budget_amount,
    sales_person_1,
    sales_person_2,
    sales_person_3,
    delivery_milestone,
    modules_implemented: parsedModulesImplemented,
    customer_name,
    customer_address,
    customer_contact_details,
    customer_designation,
    entity,
    region,
    division,
    pid_category,
    business_unit,
    sub_lob,
    inter_company_pid,
    emd_bg_required,
    geography,
    group,
    function: func,
    sub_product,
    planned_start_date,
    planned_end_date,
    project_financial_status,
    ip_address: clientIpAddress,
    browser_info: clientBrowserInfo,
    geo_info: clientGeoInfo,
  });

  res.json(project);
});

module.exports = router;