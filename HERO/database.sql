-- MNC Interview Preparation Portal Database Schema
CREATE DATABASE IF NOT EXISTS `mnc_prep_db`;
USE `mnc_prep_db`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'student',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MCQ Questions (Aptitude & Technical)
CREATE TABLE IF NOT EXISTS `mcq_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL, -- 'aptitude', 'technical'
  `subject` VARCHAR(50) NOT NULL, -- 'quantitative', 'logical', 'verbal', 'java', 'cpp', 'python', 'webdev', 'os', 'dbms'
  `question` TEXT NOT NULL,
  `option_a` VARCHAR(255) NOT NULL,
  `option_b` VARCHAR(255) NOT NULL,
  `option_c` VARCHAR(255) NOT NULL,
  `option_d` VARCHAR(255) NOT NULL,
  `correct_option` CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
  `explanation` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Coding Challenges
CREATE TABLE IF NOT EXISTS `coding_challenges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `difficulty` VARCHAR(20) NOT NULL, -- 'Easy', 'Medium', 'Hard'
  `description` TEXT NOT NULL,
  `input_format` TEXT,
  `output_format` TEXT,
  `constraints` TEXT,
  `sample_input` TEXT,
  `sample_output` TEXT,
  `test_cases` TEXT NOT NULL -- Store as JSON String: [{"input": "...", "output": "..."}]
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- HR Interview Questions
CREATE TABLE IF NOT EXISTS `hr_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `question` TEXT NOT NULL,
  `tips` TEXT,
  `sample_answer` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Progress and Scores
CREATE TABLE IF NOT EXISTS `user_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `topic` VARCHAR(50) NOT NULL, -- 'aptitude', 'mcq', 'coding', 'hr', 'mock'
  `subtopic` VARCHAR(50) NOT NULL, -- subject or challenge/test ID
  `status` VARCHAR(20) DEFAULT 'completed', -- 'started', 'completed'
  `score` INT DEFAULT NULL,
  `max_score` INT DEFAULT NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mock Tests Metadata
CREATE TABLE IF NOT EXISTS `mock_tests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(100) NOT NULL,
  `duration_minutes` INT DEFAULT 30,
  `questions` TEXT NOT NULL -- Store as JSON String representing structure of the test
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed default Admin and Student (Passwords are hashed 'admin123' and 'student123' respectively using bcrypt)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`) VALUES
(1, 'admin', 'admin@prep.com', '$2a$10$yR4b.w.2iU/x7n/PkWwBEO/FmP7h.v4.v5.6L3K2K/e4G5jL1IqS.', 'admin'),
(2, 'john_doe', 'john@student.com', '$2a$10$B5P12g/9k5lJ2F2f6CgqfO1sSg5xW3kFm6L2L.1d5i4lM.2q1y.2q', 'student');

-- Seed Aptitude Questions
INSERT INTO `mcq_questions` (`category`, `subject`, `question`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation`) VALUES
('aptitude', 'quantitative', 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?', '120 metres', '150 metres', '324 metres', '180 metres', 'B', 'Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length of train = Speed * Time = (50/3) * 9 = 150 metres.'),
('aptitude', 'quantitative', 'Find the average of all prime numbers between 30 and 50.', '37', '39.8', '41.3', '38', 'B', 'The prime numbers between 30 and 50 are 31, 37, 41, 43, 47. Average = (31+37+41+43+47)/5 = 199/5 = 39.8.'),
('aptitude', 'logical', 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?', '(1/3)', '(1/8)', '(2/8)', '(1/16)', 'B', 'This is a simple division series; each number is one-half of the previous number. 1/4 * 1/2 = 1/8.'),
('aptitude', 'logical', 'SCD, TEF, UGH, ____, WKL. What letters should fill the blank?', 'CMN', 'UJI', 'VIJ', 'IJT', 'C', 'The first letters are in alphabetical order: S, T, U, V, W. The second and third letters are BC, EF, GH, IJ, KL. Thus, VIJ is the next term.'),
('aptitude', 'verbal', 'Select the synonym of "ABANDON":', 'Retain', 'Forsake', 'Adopt', 'Keep', 'B', 'To abandon means to leave or desert. Forsake is its closest synonym.'),
('aptitude', 'verbal', 'Identify the correct spelling:', 'Receive', 'Recieve', 'Receve', 'Reiceve', 'A', 'The correct spelling is "Receive" (i before e except after c).');

-- Seed Technical MCQs
INSERT INTO `mcq_questions` (`category`, `subject`, `question`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `explanation`) VALUES
('technical', 'java', 'Which of the following is NOT a feature of Java?', 'Object Oriented', 'Use of pointers', 'Dynamic', 'Platform Independent', 'B', 'Java does not support explicit pointers to maintain memory security and simplicity.'),
('technical', 'java', 'What is the default value of local variables in Java?', 'null', '0', 'Depends on data type', 'No default value (must be initialized)', 'D', 'Local variables in Java must be initialized before use. They do not get default values.'),
('technical', 'cpp', 'Which of the following is used to achieve runtime polymorphism in C++?', 'Friend functions', 'Virtual functions', 'Operator overloading', 'Function templates', 'B', 'Virtual functions are used to achieve dynamic (runtime) polymorphism in C++ subclass overriding.'),
('technical', 'python', 'What is the correct syntax to output "Hello World" in Python?', 'print("Hello World")', 'echo("Hello World")', 'System.out.println("Hello World")', 'printf("Hello World")', 'A', 'In Python, the print() function outputs a line of text to the console.'),
('technical', 'webdev', 'Which CSS property controls the text size?', 'font-style', 'text-size', 'font-size', 'text-style', 'C', 'The font-size property is used to specify the dimensions of text characters in CSS.'),
('technical', 'os', 'What is a deadlock in Operating Systems?', 'A process that terminated unexpectedly', 'A situation where two or more processes are blocked forever, waiting for each other', 'A hard disk corruption event', 'A security breach scenario', 'B', 'A deadlock is a specific state where active processes cannot progress because each is waiting for resources held by another.'),
('technical', 'dbms', 'Which SQL clause is used to filter records in a group?', 'WHERE', 'HAVING', 'GROUP BY', 'ORDER BY', 'B', 'HAVING is used to filter groups created by GROUP BY, while WHERE filters individual records before grouping.');

-- Seed Coding Challenges
INSERT INTO `coding_challenges` (`id`, `title`, `difficulty`, `description`, `input_format`, `output_format`, `constraints`, `sample_input`, `sample_output`, `test_cases`) VALUES
(1, 'Two Sum', 'Easy', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.', 'First line: space-separated integers representing the array.\nSecond line: the target integer.', 'Two space-separated integers representing indices.', '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9', '2 7 11 15\n9', '0 1', '[{"input": "2 7 11 15\\n9", "output": "0 1"}, {"input": "3 2 4\\n6", "output": "1 2"}, {"input": "3 3\\n6", "output": "0 1"}]'),
(2, 'Reverse a String', 'Easy', 'Write a function that reverses a string. The input string is given as a string s.', 'A single string.', 'The reversed string.', 'Length of string <= 10^5', 'hello', 'olleh', '[{"input": "hello", "output": "olleh"}, {"input": "MNCPrep", "output": "perPNCM"}, {"input": "a", "output": "a"}]'),
(3, 'Fibonacci Number', 'Easy', 'The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.\nGiven n, calculate F(n).', 'A single integer n.', 'A single integer representing F(n).', '0 <= n <= 30', '4', '3', '[{"input": "0", "output": "0"}, {"input": "1", "output": "1"}, {"input": "2", "output": "1"}, {"input": "3", "output": "2"}, {"input": "4", "output": "3"}, {"input": "10", "output": "55"}]');

-- Seed HR Interview Questions
INSERT INTO `hr_questions` (`question`, `tips`, `sample_answer`) VALUES
('Tell me about yourself.', 'Focus on your academic background, major projects, relevant technical skills, and a brief highlight of your achievements. Keep it around 1.5 to 2 minutes.', 'I graduated with a degree in Computer Science, where I specialized in full-stack development and databases. During my college days, I worked on an e-learning application and spearheaded a smart-agriculture IoT system that won a regional hackathon. I am passionate about engineering clean software and look forward to contributing my technical skills in Node.js and React here.'),
('Why do you want to join our company?', 'Research the company\'s products, work culture, recent news, and values. Connect how working there aligns with your career goals.', 'I have been following your company\'s recent innovations in cloud scaling and AI-driven platforms. I want to work in an environment where technical growth is encouraged and where I can build software that impacts millions of active users daily. Your core engineering philosophy perfectly resonates with my personal career goals.'),
('What are your strengths and weaknesses?', 'Provide genuine professional strengths with examples. For weaknesses, state a real area of improvement and follow up with how you are actively addressing it.', 'My major strength is my analytical problem-solving ability. During my internship, I resolved a critical memory leak issue that decreased response times by 30%. My weakness is that I sometimes struggle with delegation, as I like to ensure everything is perfect. However, I am actively working on this by using task trackers like Trello and trusting my teammates.');

-- Seed Mock Test (JSON representing a pre-packaged test with question schemas)
INSERT INTO `mock_tests` (`id`, `title`, `duration_minutes`, `questions`) VALUES
(1, 'TCS NQT Full Length Mock Test', 30, '[{"id":1,"type":"aptitude","subject":"quantitative"},{"id":3,"type":"aptitude","subject":"logical"},{"id":5,"type":"aptitude","subject":"verbal"},{"id":1,"type":"technical","subject":"java"},{"id":3,"type":"technical","subject":"cpp"},{"id":6,"type":"technical","subject":"os"},{"id":1,"type":"coding"}]');
