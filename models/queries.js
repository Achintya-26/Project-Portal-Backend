const db = require('./db');
const bcrypt = require('bcrypt');

module.exports = {
  createUser: async ({ 
    username, email, password, firstName, lastName, phone, dateOfBirth,
    designation, department, experience, skills, address, city, state, 
    country, postalCode, bio, linkedinProfile, githubProfile 
  }) => {
    const hash = await bcrypt.hash(password, 10);
    
    // Try to insert with all user fields
    try {
      const res = await db.query(
        `INSERT INTO users (
          username, email, password, first_name, last_name, phone, date_of_birth,
          designation, department, experience, skills, address, city, state,
          country, postal_code, bio, linkedin_profile, github_profile
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING id, username, email, first_name, last_name, designation`,
        [
          username, email, hash, firstName || null, lastName || null, phone || null, 
          dateOfBirth || null, designation || null, department || null, experience || null,
          skills || null, address || null, city || null, state || null, country || null,
          postalCode || null, bio || null, linkedinProfile || null, githubProfile || null
        ]
      );
      return res.rows[0];
    } catch (error) {
      console.error('Error inserting with comprehensive user fields, falling back to basic:', error.message);
      
      // Fallback to basic user creation if comprehensive fields don't exist
      const res = await db.query(
        `INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING id,username,email`,
        [username, email, hash]
      );
      return res.rows[0];
    }
  },
  findUserByEmail: async (email) => {
    const res = await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
    return res.rows[0];
  },
  getUserById: async (id) => {
    // Try to get comprehensive user data first
    try {
      const res = await db.query(`
        SELECT id, username, email, first_name, last_name, phone, date_of_birth,
               designation, department, experience, skills, address, city, state,
               country, postal_code, bio, linkedin_profile, github_profile
        FROM users WHERE id=$1
      `, [id]);
      return res.rows[0];
    } catch (error) {
      console.error('Error fetching comprehensive user data, falling back to basic:', error.message);
      
      // Fallback to basic user data
      const res = await db.query(`SELECT id,username,email FROM users WHERE id=$1`, [id]);
      return res.rows[0];
    }
  },
  
  // Get projects where user is owner or team member
  getAllProjectsForUser: async (user_id) => {
    try {
      const res = await db.query(`
        SELECT DISTINCT p.*, u.username as owner_username,
               CASE 
                 WHEN p.user_id = $1 THEN 'owner'
                 ELSE 'member'
               END as user_role
        FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = $1 
           OR (p.team_members IS NOT NULL AND p.team_members::text LIKE '%' || $1 || '%')
        ORDER BY p.id DESC
      `, [user_id]);
      return res.rows;
    } catch (error) {
      console.error('Error fetching projects with team membership, falling back to owner only:', error.message);
      
      // Fallback to projects owned by user only
      const res = await db.query(`
        SELECT p.*, u.username as owner_username, 'owner' as user_role
        FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = $1 
        ORDER BY p.id DESC
      `, [user_id]);
      return res.rows;
    }
  },
  createProject: async ({ 
    user_id,
    project_name, // Will be stored as 'topic' in the database
    description,
    attachments,
    team_members,
    search_keywords, // New field for search keywords
    // Additional fields - check if these columns exist in the database
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
    emd_bg_required,
    geography,
    group,
    sub_product,
    planned_start_date,
    planned_end_date,
    project_financial_status,
    ip_address,
    browser_info,
    geo_info,
  }) => {
    // Try to insert with all comprehensive fields
    try {
      const res = await db.query(
        `INSERT INTO projects (
          user_id, topic, description, attachments, team_members, search_keywords,
          status, source_process_template, go_live_date, agile_project, 
          task_actuals_tracking_mode, product_version, incidental_budget_amount,
          sales_person_1, sales_person_2, sales_person_3, delivery_milestone,
          modules_implemented, customer_name, customer_address, customer_contact_details,
          customer_designation, entity, region, division, pid_category,
          business_unit, sub_lob, inter_company_pid, emd_bg_required,
          geography, "group", sub_product, planned_start_date, planned_end_date,
          project_financial_status, ip_address, browser_info, geo_info
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39
        ) RETURNING *`,
        [
          user_id, 
          project_name, 
          description, 
          attachments.length > 0 ? attachments : null, // TEXT[] - pass as array
          team_members.length > 0 ? JSON.stringify(team_members) : null, // JSONB - stringify
          search_keywords || null,
          status || null,
          source_process_template || null,
          go_live_date || null,
          agile_project || false,
          task_actuals_tracking_mode || null,
          product_version || null,
          incidental_budget_amount || null,
          sales_person_1 || null,
          sales_person_2 || null,
          sales_person_3 || null,
          delivery_milestone || null,
          modules_implemented.length > 0 ? modules_implemented : null, // TEXT[] - pass as array
          customer_name || null,
          customer_address || null,
          customer_contact_details || null,
          customer_designation || null,
          entity || null,
          region || null,
          division || null,
          pid_category || null,
          business_unit || null,
          sub_lob || null,
          inter_company_pid || null,
          emd_bg_required || false,
          geography || null,
          group || null,
          sub_product || null,
          planned_start_date || null,
          planned_end_date || null,
          project_financial_status || null,
          ip_address || 'Unknown',
          browser_info || 'Unknown',
          geo_info || '{"country": "Unknown"}' // JSONB - pass as JSON string
        ]
      );
      return res.rows[0];
    } catch (error) {
      console.error('Error inserting with comprehensive fields, trying with client info only:', error.message);        // Fallback to client info fields if comprehensive fields don't exist
        try {
          const res = await db.query(
            `INSERT INTO projects (user_id, topic, description, attachments, team_members, search_keywords, ip_address, browser_info, geo_info) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
              user_id, 
              project_name, 
              description, 
              attachments.length > 0 ? attachments : null, // TEXT[] - pass as array
              team_members.length > 0 ? JSON.stringify(team_members) : null, // JSONB - stringify
              search_keywords || null,
              ip_address || 'Unknown',
              browser_info || 'Unknown',
              geo_info || '{"country": "Unknown"}' // JSONB - pass as JSON string
            ]
          );
          return res.rows[0];
        } catch (secondError) {
          console.error('Error inserting with client info, falling back to basic fields:', secondError.message);
          
          // Final fallback to basic fields if client info columns don't exist
          const res = await db.query(
            `INSERT INTO projects (user_id, topic, description, attachments, team_members, search_keywords) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
              user_id, 
              project_name, 
              description, 
              attachments.length > 0 ? attachments : null, // TEXT[] - pass as array
              team_members.length > 0 ? JSON.stringify(team_members) : null, // JSONB - stringify
              search_keywords || null
            ]
          );
          return res.rows[0];
        }
    }
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

    // Search in topic, description, and search_keywords
    const res = await db.query(`
    SELECT p.*, u.username 
    FROM projects p 
    JOIN users u ON p.user_id = u.id 
    WHERE LOWER(p.topic) LIKE $1 
       OR LOWER(p.description) LIKE $1 
       OR LOWER(p.search_keywords) LIKE $1
    ORDER BY p.id DESC
  `, [`%${search.toLowerCase()}%`]);

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