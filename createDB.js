const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt'); 
const db = new sqlite3.Database('./productivity.db');

async function initDB() {
    // 1. Hash the password first for security 
    const saltRounds = 10; //2^10 iterations for hashing
    const hashedPassword = await bcrypt.hash('aks123', saltRounds); // Hashes the password 'aks123'

    db.serialize(() => {
        // 2. Clean start: Drop tables 
        db.run("DROP TABLE IF EXISTS tasks");
        db.run("DROP TABLE IF EXISTS users");
        
        // 3. Create Task Table 
        db.run(`CREATE TABLE tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'Work',
            priority TEXT DEFAULT 'Medium',
            due_date TEXT,
            completed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // 4. Create User Table 
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            streak INTEGER DEFAULT 0,       
            last_login_date TEXT
        )`);
        
        // 5. Insert Hashed User 
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", 
            ['Akruti', hashedPassword], 
            (err) => {
                if (err) console.error(err.message);
                else console.log("Database initialized with hashed password!");
            }
        );
    });
}

initDB();