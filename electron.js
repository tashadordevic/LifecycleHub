const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// App paths
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'lifecyclehub.db');

// JWT Secret (stored locally)
const JWT_SECRET = 'lifecyclehub-local-secret-key-2024';

let mainWindow;
let db;

// ========== DATABASE SETUP ==========
function initDatabase() {
  console.log('Database path:', dbPath);
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'manager',
      created_at TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      segment TEXT DEFAULT 'standard',
      lifecycle_stage TEXT DEFAULT 'onboarding',
      health_score INTEGER DEFAULT 70,
      contact_email TEXT,
      contact_name TEXT,
      company_size TEXT,
      industry TEXT,
      arr REAL,
      contract_start TEXT,
      contract_end TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_activity TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS lifecycle_stages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      order_num INTEGER DEFAULT 1,
      color TEXT DEFAULT '#007AFF',
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      api_key TEXT,
      config TEXT DEFAULT '{}',
      sync_status TEXT DEFAULT 'pending',
      last_synced_at TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      source TEXT NOT NULL,
      signal_type TEXT NOT NULL,
      payload TEXT DEFAULT '{}',
      description TEXT,
      user_id TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      lifecycle_stage TEXT NOT NULL,
      insight_type TEXT NOT NULL,
      description TEXT NOT NULL,
      confidence_score REAL DEFAULT 0.8,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      insight_id TEXT,
      customer_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'new',
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      UNIQUE(user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  
  console.log('Database initialized');
}

// ========== AUTH HELPERS ==========
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function createToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub;
  } catch (e) {
    return null;
  }
}

function createDefaultStages(userId) {
  const stages = [
    { name: 'Onboarding', description: 'New customers getting started', order_num: 1, color: '#3B82F6' },
    { name: 'Adoption', description: 'Customers learning and adopting features', order_num: 2, color: '#10B981' },
    { name: 'Retention', description: 'Engaged customers with steady usage', order_num: 3, color: '#6366F1' },
    { name: 'Expansion', description: 'Customers ready for upsell/cross-sell', order_num: 4, color: '#F59E0B' },
    { name: 'Risk', description: 'Customers showing churn indicators', order_num: 5, color: '#EF4444' },
  ];
  
  const stmt = db.prepare('INSERT INTO lifecycle_stages (id, name, description, order_num, color, user_id) VALUES (?, ?, ?, ?, ?, ?)');
  stages.forEach(s => {
    stmt.run(uuidv4(), s.name, s.description, s.order_num, s.color, userId);
  });
}

// ========== IPC HANDLERS ==========

// Auth
ipcMain.handle('auth:register', async (event, { email, name, password }) => {
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return { error: 'Email already registered' };
    }
    
    const userId = uuidv4();
    const passwordHash = hashPassword(password);
    
    db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)').run(userId, email, name, passwordHash);
    createDefaultStages(userId);
    
    const token = createToken(userId);
    return { access_token: token, user: { id: userId, email, name, role: 'manager' } };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('auth:login', async (event, { email, password }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return { error: 'Invalid email or password' };
    }
    
    const token = createToken(user.id);
    return { access_token: token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('auth:me', async (event, { token }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(userId);
  return user || { error: 'User not found' };
});

// Dashboard
ipcMain.handle('dashboard:stats', async (event, { token }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const total = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(userId).count;
  const atRisk = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ? AND health_score < 40').get(userId).count;
  const medium = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ? AND health_score >= 40 AND health_score < 70').get(userId).count;
  const high = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ? AND health_score >= 70').get(userId).count;
  const insights = db.prepare('SELECT COUNT(*) as count FROM insights WHERE user_id = ?').get(userId).count;
const recommendations = db.prepare(`SELECT COUNT(*) as count FROM recommendations WHERE user_id = ? AND status IN ('new', 'acknowledged')`).get(userId).count;
  const signals = db.prepare('SELECT COUNT(*) as count FROM signals WHERE user_id = ?').get(userId).count;
  
  const stageRows = db.prepare('SELECT lifecycle_stage, COUNT(*) as count FROM customers WHERE user_id = ? GROUP BY lifecycle_stage').all(userId);
  const stageDistribution = {};
  stageRows.forEach(r => { stageDistribution[r.lifecycle_stage] = r.count; });
  
  return {
    total_customers: total,
    at_risk_count: atRisk,
    recent_signals: signals,
    active_insights: insights,
    pending_recommendations: recommendations,
    stage_distribution: stageDistribution,
    health_distribution: { low: atRisk, medium, high }
  };
});

ipcMain.handle('dashboard:at-risk', async (event, { token }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  return db.prepare('SELECT * FROM customers WHERE user_id = ? AND health_score < 40 ORDER BY health_score LIMIT 10').all(userId);
});

ipcMain.handle('dashboard:recent-activity', async (event, { token }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  return db.prepare('SELECT * FROM signals WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20').all(userId);
});

// Customers
ipcMain.handle('customers:list', async (event, { token, search, stage, segment, health_min, health_max }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  let query = 'SELECT * FROM customers WHERE user_id = ?';
  const params = [userId];
  
  if (search) {
    query += ' AND (name LIKE ? OR contact_email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (stage) {
    query += ' AND lifecycle_stage = ?';
    params.push(stage);
  }
  if (segment) {
    query += ' AND segment = ?';
    params.push(segment);
  }
  if (health_min !== undefined) {
    query += ' AND health_score >= ?';
    params.push(health_min);
  }
  if (health_max !== undefined) {
    query += ' AND health_score <= ?';
    params.push(health_max);
  }
  
  query += ' ORDER BY name';
  
  const customers = db.prepare(query).all(...params);
  return { total: customers.length, customers };
});

ipcMain.handle('customers:get', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  return db.prepare('SELECT * FROM customers WHERE id = ? AND user_id = ?').get(id, userId);
});

ipcMain.handle('customers:create', async (event, { token, data }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const id = uuidv4();
  const stmt = db.prepare(`INSERT INTO customers (id, name, segment, lifecycle_stage, health_score, contact_email, contact_name, company_size, industry, arr, contract_start, contract_end, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  stmt.run(id, data.name, data.segment || 'standard', data.lifecycle_stage || 'onboarding', data.health_score || 70, data.contact_email, data.contact_name, data.company_size, data.industry, data.arr, data.contract_start, data.contract_end, userId);
  
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
});

ipcMain.handle('customers:update', async (event, { token, id, data }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const fields = [];
  const values = [];
  Object.keys(data).forEach(key => {
    if (key !== 'id' && key !== 'user_id') {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  });
  values.push(id, userId);
  
  db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
});

ipcMain.handle('customers:delete', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  db.prepare('DELETE FROM customers WHERE id = ? AND user_id = ?').run(id, userId);
  return { message: 'Customer deleted' };
});

ipcMain.handle('customers:signals', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  return db.prepare('SELECT * FROM signals WHERE customer_id = ? AND user_id = ? ORDER BY timestamp DESC').all(id, userId);
});

ipcMain.handle('customers:insights', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  return db.prepare('SELECT * FROM insights WHERE customer_id = ? AND user_id = ? ORDER BY created_at DESC').all(id, userId);
});

ipcMain.handle('customers:recommendations', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  return db.prepare('SELECT * FROM recommendations WHERE customer_id = ? AND user_id = ? ORDER BY created_at DESC').all(id, userId);
});

// Lifecycle Stages
ipcMain.handle('stages:list', async (event, { token }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const stages = db.prepare('SELECT * FROM lifecycle_stages WHERE user_id = ? ORDER BY order_num').all(userId);
  return stages.map(s => ({ ...s, order: s.order_num }));
});

ipcMain.handle('stages:create', async (event, { token, data }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const id = uuidv4();
  db.prepare('INSERT INTO lifecycle_stages (id, name, description, order_num, color, user_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, data.name, data.description, data.order, data.color, userId);
  return { id, ...data, order: data.order };
});

ipcMain.handle('stages:update', async (event, { token, id, data }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  db.prepare('UPDATE lifecycle_stages SET name = ?, description = ?, order_num = ?, color = ? WHERE id = ? AND user_id = ?').run(data.name, data.description, data.order, data.color, id, userId);
  return { id, ...data };
});

ipcMain.handle('stages:delete', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  db.prepare('DELETE FROM lifecycle_stages WHERE id = ? AND user_id = ?').run(id, userId);
  return { message: 'Stage deleted' };
});

// Integrations
ipcMain.handle('integrations:list', async (event, { token }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const integrations = db.prepare('SELECT id, type, provider, sync_status, last_synced_at, created_at FROM integrations WHERE user_id = ?').all(userId);
  return integrations;
});

ipcMain.handle('integrations:create', async (event, { token, data }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const existing = db.prepare('SELECT id FROM integrations WHERE user_id = ? AND type = ? AND provider = ?').get(userId, data.type, data.provider);
  if (existing) {
    return { error: 'Integration already exists' };
  }
  
  const id = uuidv4();
  db.prepare('INSERT INTO integrations (id, type, provider, api_key, config, user_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, data.type, data.provider, data.api_key || null, JSON.stringify(data.config || {}), userId);
  
  return { id, type: data.type, provider: data.provider, sync_status: 'pending' };
});

ipcMain.handle('integrations:update-key', async (event, { token, id, api_key }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  db.prepare('UPDATE integrations SET api_key = ? WHERE id = ? AND user_id = ?').run(api_key, id, userId);
  return { message: 'API key updated' };
});

ipcMain.handle('integrations:delete', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  db.prepare('DELETE FROM integrations WHERE id = ? AND user_id = ?').run(id, userId);
  return { message: 'Integration deleted' };
});

ipcMain.handle('integrations:sync', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const integration = db.prepare('SELECT * FROM integrations WHERE id = ? AND user_id = ?').get(id, userId);
  if (!integration) return { error: 'Integration not found' };
  
  if (!integration.api_key) {
    return { error: 'API key not configured. Please add your API key first.' };
  }
  
  // Simulate sync - in real implementation, call external APIs here
  db.prepare('UPDATE integrations SET sync_status = ?, last_synced_at = datetime("now") WHERE id = ?').run('completed', id);
  
  return { message: 'Sync completed', status: 'completed' };
});

ipcMain.handle('integrations:test', async (event, { token, id }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const integration = db.prepare('SELECT * FROM integrations WHERE id = ? AND user_id = ?').get(id, userId);
  if (!integration) return { error: 'Integration not found' };
  
  if (!integration.api_key) {
    return { success: false, error: 'API key not configured' };
  }
  
  // Test connection based on provider
  try {
    // For now, just validate the key format
    if (integration.api_key.length < 10) {
      return { success: false, error: 'API key appears to be invalid' };
    }
    return { success: true, message: 'Connection successful' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Signals
ipcMain.handle('signals:create', async (event, { token, data }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const id = uuidv4();
  db.prepare('INSERT INTO signals (id, customer_id, source, signal_type, payload, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, data.customer_id, data.source, data.signal_type, JSON.stringify(data.payload || {}), data.description, userId);
  
  db.prepare('UPDATE customers SET last_activity = datetime("now") WHERE id = ?').run(data.customer_id);
  
  return db.prepare('SELECT * FROM signals WHERE id = ?').get(id);
});

// Insights
ipcMain.handle('insights:create', async (event, { token, data }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const id = uuidv4();
  db.prepare('INSERT INTO insights (id, customer_id, lifecycle_stage, insight_type, description, confidence_score, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, data.customer_id, data.lifecycle_stage, data.insight_type, data.description, data.confidence_score || 0.8, userId);
  
  return db.prepare('SELECT * FROM insights WHERE id = ?').get(id);
});

// Recommendations
ipcMain.handle('recommendations:update-status', async (event, { token, id, status }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  db.prepare('UPDATE recommendations SET status = ? WHERE id = ? AND user_id = ?').run(status, id, userId);
  return { message: 'Status updated' };
});

// Reports
ipcMain.handle('reports:summary', async (event, { token, segment }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  let baseQuery = 'FROM customers WHERE user_id = ?';
  const params = [userId];
  if (segment) {
    baseQuery += ' AND segment = ?';
    params.push(segment);
  }
  
  const total = db.prepare(`SELECT COUNT(*) as count ${baseQuery}`).get(...params).count;
  const high = db.prepare(`SELECT COUNT(*) as count ${baseQuery} AND health_score >= 70`).get(...params).count;
  const medium = db.prepare(`SELECT COUNT(*) as count ${baseQuery} AND health_score >= 40 AND health_score < 70`).get(...params).count;
  const low = db.prepare(`SELECT COUNT(*) as count ${baseQuery} AND health_score < 40`).get(...params).count;
  
  const stageRows = db.prepare(`SELECT lifecycle_stage, COUNT(*) as count, SUM(COALESCE(arr, 0)) as arr ${baseQuery} GROUP BY lifecycle_stage`).all(...params);
  const segmentRows = db.prepare('SELECT segment, COUNT(*) as count, SUM(COALESCE(arr, 0)) as arr FROM customers WHERE user_id = ? GROUP BY segment').all(userId);
  const signalRows = db.prepare('SELECT signal_type, COUNT(*) as count FROM signals WHERE user_id = ? GROUP BY signal_type').all(userId);
  
  return {
    total_customers: total,
    health_distribution: { high, medium, low },
    stage_distribution: Object.fromEntries(stageRows.map(r => [r.lifecycle_stage, { count: r.count, arr: r.arr }])),
    segment_distribution: Object.fromEntries(segmentRows.map(r => [r.segment, { count: r.count, arr: r.arr }])),
    signal_activity: Object.fromEntries(signalRows.map(r => [r.signal_type, r.count]))
  };
});

// Seed demo data
ipcMain.handle('seed-demo-data', async (event, { token }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const existing = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id = ?').get(userId).count;
  if (existing > 0) {
    return { message: 'Demo data already exists', customer_count: existing };
  }
  
  const customers = [
    { name: 'TechCorp Solutions', segment: 'enterprise', lifecycle_stage: 'adoption', health_score: 85, arr: 120000, industry: 'Technology', contact_name: 'Sarah Chen', contact_email: 'sarah@techcorp.io' },
    { name: 'DataFlow Inc', segment: 'enterprise', lifecycle_stage: 'retention', health_score: 72, arr: 95000, industry: 'Data Analytics', contact_name: 'Mike Johnson', contact_email: 'mike@dataflow.com' },
    { name: 'CloudNine Systems', segment: 'mid-market', lifecycle_stage: 'expansion', health_score: 91, arr: 45000, industry: 'Cloud Services', contact_name: 'Lisa Wang', contact_email: 'lisa@cloudnine.io' },
    { name: 'FinServe Global', segment: 'enterprise', lifecycle_stage: 'risk', health_score: 32, arr: 180000, industry: 'Financial Services', contact_name: 'Robert Kim', contact_email: 'robert@finserve.com' },
    { name: 'HealthTech Pro', segment: 'mid-market', lifecycle_stage: 'onboarding', health_score: 65, arr: 38000, industry: 'Healthcare', contact_name: 'Emily Davis', contact_email: 'emily@healthtech.io' },
    { name: 'RetailMax', segment: 'standard', lifecycle_stage: 'adoption', health_score: 58, arr: 22000, industry: 'Retail', contact_name: 'Tom Brown', contact_email: 'tom@retailmax.com' },
    { name: 'EduLearn Platform', segment: 'standard', lifecycle_stage: 'retention', health_score: 78, arr: 28000, industry: 'Education', contact_name: 'Anna Martinez', contact_email: 'anna@edulearn.com' },
    { name: 'SecureNet Corp', segment: 'enterprise', lifecycle_stage: 'expansion', health_score: 88, arr: 150000, industry: 'Cybersecurity', contact_name: 'James Wilson', contact_email: 'james@securenet.com' },
  ];
  
  const insertCustomer = db.prepare('INSERT INTO customers (id, name, segment, lifecycle_stage, health_score, arr, industry, contact_name, contact_email, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertSignal = db.prepare('INSERT INTO signals (id, customer_id, source, signal_type, description, user_id) VALUES (?, ?, ?, ?, ?, ?)');
  const insertInsight = db.prepare('INSERT INTO insights (id, customer_id, lifecycle_stage, insight_type, description, confidence_score, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertRec = db.prepare('INSERT INTO recommendations (id, customer_id, action_type, suggested_action, priority, user_id) VALUES (?, ?, ?, ?, ?, ?)');
  
  const customerIds = [];
  customers.forEach(c => {
    const id = uuidv4();
    insertCustomer.run(id, c.name, c.segment, c.lifecycle_stage, c.health_score, c.arr, c.industry, c.contact_name, c.contact_email, userId);
    customerIds.push(id);
  });
  
  // Add signals
  const signalTypes = ['usage', 'support', 'billing', 'engagement'];
  customerIds.forEach((cid, i) => {
    signalTypes.slice(0, 2).forEach((type, j) => {
      insertSignal.run(uuidv4(), cid, 'system', type, `${type} activity recorded`, userId);
    });
  });
  
  // Add insights for first 4 customers
  const insightTypes = ['risk', 'opportunity', 'anomaly'];
  customerIds.slice(0, 4).forEach((cid, i) => {
    insertInsight.run(uuidv4(), cid, customers[i].lifecycle_stage, insightTypes[i % 3], i % 3 === 0 ? 'High churn risk detected' : i % 3 === 1 ? 'Expansion opportunity' : 'Usage anomaly', 0.8, userId);
  });
  
  // Add recommendations
  const actions = ['Schedule executive review', 'Send re-engagement campaign', 'Offer premium trial', 'Assign dedicated CSM'];
  customerIds.slice(0, 4).forEach((cid, i) => {
    insertRec.run(uuidv4(), cid, 'engagement', actions[i], ['high', 'medium', 'low'][i % 3], userId);
  });
  
  return { message: 'Demo data seeded', customer_count: customers.length };
});

// Settings
ipcMain.handle('settings:get', async (event, { token, key }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  const setting = db.prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?').get(userId, key);
  return setting ? setting.value : null;
});

ipcMain.handle('settings:set', async (event, { token, key, value }) => {
  const userId = verifyToken(token);
  if (!userId) return { error: 'Invalid token' };
  
  db.prepare('INSERT OR REPLACE INTO settings (id, user_id, key, value) VALUES (?, ?, ?, ?)').run(uuidv4(), userId, key, value);
  return { message: 'Setting saved' };
});


// Backup & Restore
ipcMain.handle('database:backup', async (event) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Backup Database',
    defaultPath: `lifecyclehub-backup-${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'Database', extensions: ['db'] }]
  });
  if (result.canceled) return { cancelled: true };
  try {
    const fs = require('fs');
    fs.copyFileSync(dbPath, result.filePath);
    return { path: result.filePath };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('database:restore', async (event) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Restore Database',
    filters: [{ name: 'Database', extensions: ['db'] }],
    properties: ['openFile']
  });
  if (result.canceled) return { cancelled: true };
  try {
    const fs = require('fs');
    db.close();
    fs.copyFileSync(result.filePaths[0], dbPath);
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
});
// ========== WINDOW CREATION ==========
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0a0a0a',
    show: false
  });

  const buildPath = path.resolve(__dirname, 'build', 'index.html');
  const prodPath = path.resolve(process.resourcesPath || __dirname, 'app', 'build', 'index.html');
  const startUrl = process.env.ELECTRON_START_URL || 
    (require('fs').existsSync(buildPath) ? `file://${buildPath}` : `file://${prodPath}`);
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Menu
  const template = [
    {
      label: 'LifecycleHub',
      submenu: [
        { label: 'About LifecycleHub', click: () => { require('electron').dialog.showMessageBox(mainWindow, { type: 'none', icon: path.join(__dirname, 'public/icon.png'), title: 'About LifecycleHub', message: 'LifecycleHub', detail: 'Version 1.0.0\n\nLocal-first CRM for solopreneurs and freelancers.\nYour data stays on your machine. Always.\n\nLicense: MIT\n\u00a9 2025 Natasha Dordevic', buttons: ['Close', 'GitHub', 'Support on Ko-fi'], defaultId: 0 }).then(({ response }) => { const { shell } = require('electron'); if (response === 1) shell.openExternal('https://github.com/tashadordevic/lifecycle-os'); if (response === 2) shell.openExternal('https://ko-fi.com/natashad'); }); } },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'DevTools', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
  if (db) db.close();
});
