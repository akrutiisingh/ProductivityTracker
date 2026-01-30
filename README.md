# ProductivityTracker
The Productivity Hub is a persistent website designed to optimize personal workflow and task management. Moving beyond a standard "To-Do" list, this project focuses on Advanced Security, and Dynamic Visualization. The tracker provides users with a secure, authenticated dashboard where they can track goals, monitor achievement ratios across different life domains, and maintain daily engagement through a permanent streak system.

# Project Structure & File Descriptions
Below is a brief description of the core files that power the Productivity Hub:

server.js: The "brain" of the app; it handles all 11 Express routes, manages user sessions, and communicates with the database.

createDB.js: A setup script used to initialize the SQLite database, create tables, and generate the initial hashed user credentials using Bcrypt.

index.ejs: The main dashboard template that dynamically renders the user's tasks, progress bars, and the Canvas-based completion meter.

login.ejs: The secure entry point of the app featuring the Math Captcha challenge and the user authentication form.

wiki.ejs: The technical documentation page (the Implementation Wiki) that explains the "how" and "why" behind the project's advanced features.

style.css: The central stylesheet containing custom gradients, card hover animations, and the layout rules for the entire hub.

productivity.db: The persistent SQLite database file where all user accounts, login history, and task data are stored.
