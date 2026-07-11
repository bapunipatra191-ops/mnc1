# MNC Interview Preparation Portal

An all-in-one preparation portal for MNC placement interviews. Built using a Node.js + Express.js backend, a modern CSS3 HSL design system, and clean Javascript frontend logic.

## 🚀 Key Features

- **Responsive Theme:** Glassmorphism-style styling using modern typography, pulsing gradient cards, and animated dashboard charts.
- **Unified Authentication:** User registrations and logins leveraging secure bcrypt hashing and stateful JWT tokens.
- **Dynamic Dashboard:** Progress metrics circles highlighting preparation levels across all components.
- **Practice Hubs:**
  - **Aptitude practice:** Quantitative, Logical Reasoning, and Verbal drills with solutions.
  - **Technical MCQs:** Subject filters for Java, C++, Python, Web Dev, OS, and DBMS questions.
  - **Coding Sandbox:** Split-pane editor compiled against hidden unit test cases using safe sandbox execution scripts.
  - **HR interview tools:** STAR method answer parser providing constructive structural reviews and sample solutions.
  - **Company sheets:** Hiring patterns and recruitment guides for TCS, Infosys, Wipro, Amazon, and Google.
- **Simulated Mock Exams:** Simulated timed exams combining Aptitude, Technical MCQs, and Coding problems with score breakdowns.
- **Admin Panel:** Statistics dashboards, user auditing grid, and forms to instantly add or delete practice MCQs and coding challenges.

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Vanilla variable tokens), ES6 JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL (Primary client database)
- **Zero-Config Database Fallback:** Automatic JSON-based file store fallback (`config/fallback_db.json`) if MySQL server configuration is omitted.

---

## ⚡ Fast Run Setup Guide (Instant Zero-Config Mode)

The application detects if MySQL is absent and automatically runs on an internal pre-seeded JSON file database, meaning it is **immediately executable out of the box** with zero configurations.

1. **Open your terminal inside the project workspace directory**
2. **Install node dependencies:**
   ```bash
   npm install
   ```
3. **Start the application server:**
   ```bash
   npm run start
   ```
4. **Access the portal in your browser:**
   Open [http://localhost:3000](http://localhost:3000)

---

## 🔗 Configuring with MySQL Database

When you are ready to link the portal with your local MySQL server, follow these database installation steps:

1. **Import Database Schema:**
   Ensure MySQL is running. Open your MySQL client and execute the queries inside:
   ```sql
   source database.sql;
   ```
2. **Configure Environment Variables:**
   Create a `.env` file in the project root directory and insert your credentials:
   ```env
   PORT=3000
   JWT_SECRET=your_custom_secret_key_string
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=mnc_prep_db
   ```
3. **Run the server:**
   ```bash
   npm run dev
   ```
   The backend console will print: `MySQL connection established successfully.`

---

## 🔐 Seeded Accounts for Testing

Use the following seeded accounts to inspect the application dashboard:

### 1. Student Account
- **Email:** `john@student.com`
- **Password:** `student123`

### 2. Administrator Account
- **Email:** `admin@prep.com`
- **Password:** `admin123`
