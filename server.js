const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt'); // Added for secure authentication 

const app = express();
const port = 3000;
const db = new sqlite3.Database('./productivity.db');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'deakin-sit774-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Login middleware
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// --- ROUTES ---

// Route 1: Home Dashboard 
app.get('/', requireLogin, (req, res) => {
  db.all(`
    SELECT *, 
    CASE 
      WHEN due_date < date('now') AND completed = 0 THEN 'Overdue'
      WHEN priority = 'High' THEN 'High'
      WHEN priority = 'Medium' THEN 'Medium'
      ELSE 'Low'
    END as display_priority
    FROM tasks ORDER BY created_at DESC
  `, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database connection failed.');
    }
    
    const total = rows.length;
    const done = rows.filter(t => t.completed === 1).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    const categories = { Work: 0, Personal: 0, Health: 0, Others: 0 };
    const catDone = { Work: 0, Health: 0, Personal: 0, Others: 0 };
    rows.forEach(task => {
      let cat = categories[task.category] !== undefined ? task.category : 'Others'; //For undefined categories we use Others
      
      categories[cat]++; // Total count for category
      
      if (task.completed === 1) {
        catDone[cat]++; // Completed count for category
      }
    });
    
    res.render('index', {
      tasks: rows,
      user: req.session.user,
      stats: { total, done, rate, categories, catDone }
    });
  });
});

// Route 2: Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Route 3: Login math problem captcha 
app.get('/api/login-captcha', (req, res) => {
  const n1 = Math.floor(Math.random() * 10);
  const n2 = Math.floor(Math.random() * 10);
  req.session.loginCaptchaAnswer = n1 + n2;
  res.json({ question: `Solve: ${n1} + ${n2}` });
});

// Route 4: Handle login with Bcrypt 
app.post('/login', (req, res) => {
  const { username, password, captcha } = req.body;
  
  // 1. Check Captcha
  if (parseInt(captcha) !== req.session.loginCaptchaAnswer) {
    return res.render('login', { error: 'Incorrect captcha answer!!' });
  }
  
  // 2. Database check with Hashed Password comparison
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) {
      console.error(err);
      return res.render('login', { error: 'Database error' });
    }
    
    if (user && await bcrypt.compare(password, user.password)) { // Compare hashed passwords
      req.session.user = { id: user.id, username: user.username };
      return res.redirect('/');
    } else {
      return res.render('login', { error: 'Invalid username/password' });
    }
  });
});

// Route 5: Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Route 6: Create Task
app.post('/tasks', requireLogin, (req, res) => {
  const { title, category, priority, due_date } = req.body;
  if (!title || title.trim().length < 3) {
    return res.redirect('/');
  }
  db.run(
    "INSERT INTO tasks (title, category, priority, due_date) VALUES (?, ?, ?, ?)",
    [title.trim(), category, priority, due_date || null],
    (err) => {
      if (err) console.error(err);
      res.redirect('/');
    }
  );
});

// Route 7: Edit Task 
app.post('/tasks/:id/edit', requireLogin, (req, res) => {
  const { title, priority, category, due_date } = req.body;
  db.run("UPDATE tasks SET title = ?, category = ?, priority = ?, due_date = ? WHERE id = ?", 
    [title, category, priority, due_date || null, req.params.id], 
    (err) => {
      if (err) console.error(err);
      res.redirect('/');
    }
  );
});

// Route 8: Mark complete where our completed is 1
app.post('/tasks/:id/complete', requireLogin, (req, res) => {
  db.run("UPDATE tasks SET completed = 1 WHERE id = ?", [req.params.id], (err) => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// Route 9: Delete task
app.post('/tasks/:id/delete', requireLogin, (req, res) => {
  db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// Route 10: Streak counter using Database
app.get('/api/streak', requireLogin, (req, res) => {
  const today = new Date().toDateString();
  const userId = req.session.user.id;

  // we get current streak data from DB
  db.get("SELECT streak, last_login_date FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) return res.json({ streak: 0 });

    if (user.last_login_date !== today) {
      const newStreak = (user.streak || 0) + 1;  // if its a new day, update the streak
      
      db.run("UPDATE users SET streak = ?, last_login_date = ? WHERE id = ?", 
        [newStreak, today, userId], 
        (updateErr) => {
          if (updateErr) console.error(updateErr);
          res.json({ streak: newStreak });
        }
      );
    } else {
      // if user already logged in today, just return current streak
      res.json({ streak: user.streak });
    }
  });
});

// Route 11: Wiki which is our documentation page
app.get('/wiki', (req, res) => res.render('wiki'));

// Error Handlers 
app.use((req, res) => {
  res.status(404).send('Page not found (404)');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Server error occurred');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});