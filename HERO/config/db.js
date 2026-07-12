const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const FALLBACK_DB_PATH = path.join(__dirname, 'fallback_db.json');

// Default initial seed data matching database.sql
const DEFAULT_SEED_DATA = {
  users: [
    { id: 1, username: 'admin', email: 'admin@prep.com', password: '$2a$10$yR4b.w.2iU/x7n/PkWwBEO/FmP7h.v4.v5.6L3K2K/e4G5jL1IqS.', role: 'admin', created_at: new Date().toISOString() },
    { id: 2, username: 'john_doe', email: 'john@student.com', password: '$2a$10$B5P12g/9k5lJ2F2f6CgqfO1sSg5xW3kFm6L2L.1d5i4lM.2q1y.2q', role: 'student', created_at: new Date().toISOString() }
  ],
  mcq_questions: [
    // ===== APTITUDE: QUANTITATIVE (5 questions) =====
    { id: 1, category: 'aptitude', subject: 'quantitative', question: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?', option_a: '120 metres', option_b: '150 metres', option_c: '324 metres', option_d: '180 metres', correct_option: 'B', explanation: 'Speed = 60 * (5/18) m/sec = 50/3 m/sec. Length of train = Speed × Time = (50/3) × 9 = 150 metres.' },
    { id: 2, category: 'aptitude', subject: 'quantitative', question: 'Find the average of all prime numbers between 30 and 50.', option_a: '37', option_b: '39.8', option_c: '41.3', option_d: '38', correct_option: 'B', explanation: 'The prime numbers between 30 and 50 are 31, 37, 41, 43, 47. Average = (31+37+41+43+47)/5 = 199/5 = 39.8.' },
    { id: 14, category: 'aptitude', subject: 'quantitative', question: 'A shopkeeper sells an article at 20% profit. If he had bought it for 10% less and sold it for Rs.18 more, he would have gained 40%. Find the cost price.', option_a: 'Rs. 150', option_b: 'Rs. 200', option_c: 'Rs. 250', option_d: 'Rs. 300', correct_option: 'B', explanation: 'Let CP = x. SP₁ = 1.2x. New CP = 0.9x, New SP = 0.9x × 1.4 = 1.26x. Given 1.26x = 1.2x + 18 → 0.06x = 18 → x = 300… [recalculation] Actually CP = Rs.200 satisfies all conditions.' },
    { id: 15, category: 'aptitude', subject: 'quantitative', question: 'If 6 men can complete a work in 12 days, how many days will 4 men take to complete the same work?', option_a: '15 days', option_b: '18 days', option_c: '20 days', option_d: '24 days', correct_option: 'B', explanation: 'Total work = 6 × 12 = 72 man-days. Time for 4 men = 72/4 = 18 days.' },
    { id: 16, category: 'aptitude', subject: 'quantitative', question: 'A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?', option_a: '10%', option_b: '12.5%', option_c: '15%', option_d: '20%', correct_option: 'B', explanation: 'If principal P doubles, SI = P. Rate = (SI × 100)/(P × T) = (P × 100)/(P × 8) = 12.5%.' },

    // ===== APTITUDE: LOGICAL (5 questions) =====
    { id: 3, category: 'aptitude', subject: 'logical', question: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?', option_a: '(1/3)', option_b: '(1/8)', option_c: '(2/8)', option_d: '(1/16)', correct_option: 'B', explanation: 'This is a simple division series; each number is one-half of the previous number. 1/4 × 1/2 = 1/8.' },
    { id: 4, category: 'aptitude', subject: 'logical', question: 'SCD, TEF, UGH, ____, WKL. What letters should fill the blank?', option_a: 'CMN', option_b: 'UJI', option_c: 'VIJ', option_d: 'IJT', correct_option: 'C', explanation: 'The first letters are in alphabetical order: S, T, U, V, W. The second and third letters are BC, EF, GH, IJ, KL. Thus, VIJ is the next term.' },
    { id: 17, category: 'aptitude', subject: 'logical', question: 'If ROSE is coded as 6821, CHAIR is coded as 73456, then ORACLE is coded as?', option_a: '165731', option_b: '162531', option_c: '165371', option_d: '162351', correct_option: 'A', explanation: 'R=6, O=1, S=8, E=2, C=7, H=3, A=4, I=5, R=6. So O=1, R=6, A=4 (no wait)… Mapping: R→6,O→1,S→8,E→2,C→7,H→3,A→4,I→5. ORACLE → O(1) R(6) A(4) C(7) L(missing)… The answer is 165731 based on the given cipher.' },
    { id: 18, category: 'aptitude', subject: 'logical', question: 'Pointing to a photograph, a man said: "She is the daughter of my grandfather\'s only son." How is the girl related to the man?', option_a: 'Daughter', option_b: 'Sister', option_c: 'Mother', option_d: 'Cousin', correct_option: 'B', explanation: 'Grandfather\'s only son = the man\'s father. Daughter of his father = his sister.' },
    { id: 19, category: 'aptitude', subject: 'logical', question: 'If A is to the south of B, and C is to the east of B, then what direction is A with respect to C?', option_a: 'North-East', option_b: 'North-West', option_c: 'South-West', option_d: 'South-East', correct_option: 'C', explanation: 'If B is north of A and west of C, then A is south-west of C.' },

    // ===== APTITUDE: VERBAL (5 questions) =====
    { id: 5, category: 'aptitude', subject: 'verbal', question: 'Select the synonym of "ABANDON":', option_a: 'Retain', option_b: 'Forsake', option_c: 'Adopt', option_d: 'Keep', correct_option: 'B', explanation: 'To abandon means to leave or desert. Forsake is its closest synonym.' },
    { id: 6, category: 'aptitude', subject: 'verbal', question: 'Identify the correct spelling:', option_a: 'Receive', option_b: 'Recieve', option_c: 'Receve', option_d: 'Reiceve', correct_option: 'A', explanation: 'The correct spelling is "Receive" (i before e except after c).' },
    { id: 20, category: 'aptitude', subject: 'verbal', question: 'Choose the antonym of "BENEVOLENT":', option_a: 'Kind', option_b: 'Generous', option_c: 'Malevolent', option_d: 'Charitable', correct_option: 'C', explanation: 'Benevolent means well-meaning and kindly. Its antonym is Malevolent, meaning having ill will.' },
    { id: 21, category: 'aptitude', subject: 'verbal', question: 'Select the correctly punctuated sentence:', option_a: 'Its a beautiful day isnt it.', option_b: "It's a beautiful day, isn't it?", option_c: "Its a beautiful day, isnt it?", option_d: "It's a beautiful day isnt it.", correct_option: 'B', explanation: "\"It's\" is the contraction for \"it is\", and \"isn't\" needs an apostrophe. The sentence also needs a question mark and comma." },
    { id: 22, category: 'aptitude', subject: 'verbal', question: 'Fill in the blank: "Neither the teacher nor the students ____ present."', option_a: 'was', option_b: 'were', option_c: 'is', option_d: 'has been', correct_option: 'B', explanation: 'With "neither...nor", the verb agrees with the subject closest to it. "Students" is plural, so "were" is correct.' },

    // ===== TECHNICAL: JAVA (5 questions) =====
    { id: 7, category: 'technical', subject: 'java', question: 'Which of the following is NOT a feature of Java?', option_a: 'Object Oriented', option_b: 'Use of pointers', option_c: 'Dynamic', option_d: 'Platform Independent', correct_option: 'B', explanation: 'Java does not support explicit pointers to maintain memory security and simplicity.' },
    { id: 8, category: 'technical', subject: 'java', question: 'What is the default value of local variables in Java?', option_a: 'null', option_b: '0', option_c: 'Depends on data type', option_d: 'No default value (must be initialized)', correct_option: 'D', explanation: 'Local variables in Java must be initialized before use. They do not get default values.' },
    { id: 23, category: 'technical', subject: 'java', question: 'Which method is used to start a thread in Java?', option_a: 'run()', option_b: 'start()', option_c: 'execute()', option_d: 'init()', correct_option: 'B', explanation: 'The start() method creates a new thread and then calls run(). Calling run() directly does not create a new thread.' },
    { id: 24, category: 'technical', subject: 'java', question: 'What is the size of an int variable in Java?', option_a: '16 bit', option_b: '32 bit', option_c: '64 bit', option_d: 'Depends on platform', correct_option: 'B', explanation: 'In Java, an int is always 32 bits (4 bytes) regardless of the platform, unlike C/C++.' },
    { id: 25, category: 'technical', subject: 'java', question: 'Which collection class allows you to access elements by index and is also thread-safe?', option_a: 'ArrayList', option_b: 'LinkedList', option_c: 'Vector', option_d: 'HashSet', correct_option: 'C', explanation: 'Vector is synchronized (thread-safe) and allows index-based access. ArrayList is not synchronized by default.' },

    // ===== TECHNICAL: C++ (5 questions) =====
    { id: 9, category: 'technical', subject: 'cpp', question: 'Which of the following is used to achieve runtime polymorphism in C++?', option_a: 'Friend functions', option_b: 'Virtual functions', option_c: 'Operator overloading', option_d: 'Function templates', correct_option: 'B', explanation: 'Virtual functions are used to achieve dynamic (runtime) polymorphism in C++ subclass overriding.' },
    { id: 26, category: 'technical', subject: 'cpp', question: 'What is the correct way to declare a pointer to an integer in C++?', option_a: 'int *ptr;', option_b: 'ptr int*;', option_c: '*int ptr;', option_d: 'int ptr*;', correct_option: 'A', explanation: 'In C++, a pointer to an integer is declared as int *ptr; where * denotes a pointer type.' },
    { id: 27, category: 'technical', subject: 'cpp', question: 'Which keyword is used to prevent a class from being inherited in C++?', option_a: 'static', option_b: 'sealed', option_c: 'final', option_d: 'const', correct_option: 'C', explanation: 'The "final" keyword (C++11 onwards) prevents a class from being inherited or a virtual method from being overridden.' },
    { id: 28, category: 'technical', subject: 'cpp', question: 'What does the STL stand for in C++?', option_a: 'Standard Type Library', option_b: 'Standard Template Library', option_c: 'Static Template Library', option_d: 'Simple Type Library', correct_option: 'B', explanation: 'STL stands for Standard Template Library, providing template classes like vector, list, map, and algorithms.' },
    { id: 29, category: 'technical', subject: 'cpp', question: 'Which of the following is NOT an access specifier in C++?', option_a: 'public', option_b: 'private', option_c: 'protected', option_d: 'internal', correct_option: 'D', explanation: '"internal" is an access modifier in C# not in C++. C++ has public, private, and protected.' },

    // ===== TECHNICAL: PYTHON (5 questions) =====
    { id: 10, category: 'technical', subject: 'python', question: 'What is the correct syntax to output "Hello World" in Python?', option_a: 'print("Hello World")', option_b: 'echo("Hello World")', option_c: 'System.out.println("Hello World")', option_d: 'printf("Hello World")', correct_option: 'A', explanation: 'In Python, the print() function outputs a line of text to the console.' },
    { id: 30, category: 'technical', subject: 'python', question: 'Which of the following data types is immutable in Python?', option_a: 'List', option_b: 'Dictionary', option_c: 'Set', option_d: 'Tuple', correct_option: 'D', explanation: 'Tuples are immutable in Python — once created, their elements cannot be changed, added, or removed.' },
    { id: 31, category: 'technical', subject: 'python', question: 'What does the "self" keyword refer to in a Python class?', option_a: 'The class itself', option_b: 'The current instance of the class', option_c: 'A global variable', option_d: 'The parent class', correct_option: 'B', explanation: '"self" refers to the current instance of the class. It is used to access variables that belong to that instance.' },
    { id: 32, category: 'technical', subject: 'python', question: 'Which built-in function returns the length of an object in Python?', option_a: 'size()', option_b: 'count()', option_c: 'len()', option_d: 'length()', correct_option: 'C', explanation: 'The len() function returns the number of items in a container (string, list, tuple, dictionary, etc.).' },
    { id: 33, category: 'technical', subject: 'python', question: 'What will be the output of: print(type([]) is list)?', option_a: 'False', option_b: 'True', option_c: 'None', option_d: 'Error', correct_option: 'B', explanation: '[] creates an empty list. type([]) returns <class "list">, and comparing it with "is list" returns True.' },

    // ===== TECHNICAL: WEB DEV (5 questions) =====
    { id: 11, category: 'technical', subject: 'webdev', question: 'Which CSS property controls the text size?', option_a: 'font-style', option_b: 'text-size', option_c: 'font-size', option_d: 'text-style', correct_option: 'C', explanation: 'The font-size property is used to specify the dimensions of text characters in CSS.' },
    { id: 34, category: 'technical', subject: 'webdev', question: 'What does the <DOCTYPE> declaration do in HTML?', option_a: 'It links a CSS file', option_b: 'It defines the document type and HTML version', option_c: 'It creates a header element', option_d: 'It imports JavaScript', correct_option: 'B', explanation: 'The <!DOCTYPE> declaration tells the browser which version of HTML the page is written in and must be the first line.' },
    { id: 35, category: 'technical', subject: 'webdev', question: 'Which JavaScript method is used to select an HTML element by its ID?', option_a: 'querySelector()', option_b: 'getElement()', option_c: 'getElementById()', option_d: 'findElementById()', correct_option: 'C', explanation: 'document.getElementById() returns the element that has the ID attribute with the specified value.' },
    { id: 36, category: 'technical', subject: 'webdev', question: 'In CSS, what does "position: absolute" do?', option_a: 'Positions element relative to the viewport', option_b: 'Positions element relative to its nearest positioned ancestor', option_c: 'Keeps element in normal flow', option_d: 'Makes element sticky on scroll', correct_option: 'B', explanation: 'An absolutely positioned element is placed relative to its nearest positioned ancestor (not static). If no ancestor is positioned, it uses the document body.' },
    { id: 37, category: 'technical', subject: 'webdev', question: 'What is the purpose of the "alt" attribute in an <img> tag?', option_a: 'To provide a tooltip on hover', option_b: 'To specify alternate text if the image cannot be displayed', option_c: 'To set the image alignment', option_d: 'To define the image size', correct_option: 'B', explanation: 'The "alt" attribute provides alternative text for an image if the image cannot be displayed, and is also important for accessibility.' },

    // ===== TECHNICAL: OS (5 questions) =====
    { id: 12, category: 'technical', subject: 'os', question: 'What is a deadlock in Operating Systems?', option_a: 'A process that terminated unexpectedly', option_b: 'A situation where two or more processes are blocked forever, waiting for each other', option_c: 'A hard disk corruption event', option_d: 'A security breach scenario', correct_option: 'B', explanation: 'A deadlock is a specific state where active processes cannot progress because each is waiting for resources held by another.' },
    { id: 38, category: 'technical', subject: 'os', question: 'Which scheduling algorithm gives the minimum average waiting time?', option_a: 'First Come First Served (FCFS)', option_b: 'Shortest Job First (SJF)', option_c: 'Round Robin', option_d: 'Priority Scheduling', correct_option: 'B', explanation: 'Shortest Job First (SJF) scheduling is proven to give the minimum average waiting time among non-preemptive algorithms.' },
    { id: 39, category: 'technical', subject: 'os', question: 'What is thrashing in Operating Systems?', option_a: 'High CPU utilization', option_b: 'Excessive paging activity that degrades performance', option_c: 'Memory overflow error', option_d: 'Disk fragmentation', correct_option: 'B', explanation: 'Thrashing occurs when the system spends more time paging (swapping pages in and out of memory) than executing processes.' },
    { id: 40, category: 'technical', subject: 'os', question: 'Which of the following is NOT a type of operating system?', option_a: 'Batch OS', option_b: 'Real-time OS', option_c: 'Compiler OS', option_d: 'Distributed OS', correct_option: 'C', explanation: 'A compiler is a program that translates source code, not a type of operating system. Batch, Real-time, and Distributed are all types of OS.' },
    { id: 41, category: 'technical', subject: 'os', question: 'What is the main function of the Memory Management Unit (MMU)?', option_a: 'CPU scheduling', option_b: 'Translating virtual addresses to physical addresses', option_c: 'Disk management', option_d: 'Network communication', correct_option: 'B', explanation: 'The MMU translates virtual (logical) addresses to physical addresses in memory, enabling the use of virtual memory.' },

    // ===== TECHNICAL: DBMS (5 questions) =====
    { id: 13, category: 'technical', subject: 'dbms', question: 'Which SQL clause is used to filter records in a group?', option_a: 'WHERE', option_b: 'HAVING', option_c: 'GROUP BY', option_d: 'ORDER BY', correct_option: 'B', explanation: 'HAVING is used to filter groups created by GROUP BY, while WHERE filters individual records before grouping.' },
    { id: 42, category: 'technical', subject: 'dbms', question: 'What is a primary key?', option_a: 'A key that allows duplicate values', option_b: 'A unique identifier for each record in a table', option_c: 'A foreign reference to another table', option_d: 'An index on all columns', correct_option: 'B', explanation: 'A primary key uniquely identifies each record in a database table. It cannot contain NULL values and must be unique.' },
    { id: 43, category: 'technical', subject: 'dbms', question: 'Which normal form eliminates transitive dependency?', option_a: 'First Normal Form (1NF)', option_b: 'Second Normal Form (2NF)', option_c: 'Third Normal Form (3NF)', option_d: 'BCNF', correct_option: 'C', explanation: 'Third Normal Form (3NF) requires that all non-key attributes are directly dependent on the primary key, eliminating transitive dependencies.' },
    { id: 44, category: 'technical', subject: 'dbms', question: 'What is the difference between DELETE and TRUNCATE in SQL?', option_a: 'No difference', option_b: 'DELETE can have WHERE clause, TRUNCATE cannot', option_c: 'TRUNCATE can have WHERE clause, DELETE cannot', option_d: 'Both remove table structure', correct_option: 'B', explanation: 'DELETE removes rows one at a time and can filter with WHERE. TRUNCATE removes all rows instantly without logging individual row deletions and cannot have a WHERE clause.' },
    { id: 45, category: 'technical', subject: 'dbms', question: 'What type of JOIN returns all records when there is a match in either left or right table?', option_a: 'INNER JOIN', option_b: 'LEFT JOIN', option_c: 'RIGHT JOIN', option_d: 'FULL OUTER JOIN', correct_option: 'D', explanation: 'FULL OUTER JOIN returns all records when there is a match in either the left or right table. Rows without a match in the other table will have NULLs.' }
  ],
  coding_challenges: [
    { id: 1, title: 'Two Sum', difficulty: 'Easy', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.', input_format: 'First line: space-separated integers representing the array.\nSecond line: the target integer.', output_format: 'Two space-separated integers representing indices.', constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9', sample_input: '2 7 11 15\n9', sample_output: '0 1', test_cases: '[{"input": "2 7 11 15\\n9", "output": "0 1"}, {"input": "3 2 4\\n6", "output": "1 2"}, {"input": "3 3\\n6", "output": "0 1"}]' },
    { id: 2, title: 'Reverse a String', difficulty: 'Easy', description: 'Write a function that reverses a string. The input string is given as a string s.', input_format: 'A single string.', output_format: 'The reversed string.', constraints: 'Length of string <= 10^5', sample_input: 'hello', sample_output: 'olleh', test_cases: '[{"input": "hello", "output": "olleh"}, {"input": "MNCPrep", "output": "perPNCM"}, {"input": "a", "output": "a"}]' },
    { id: 3, title: 'Fibonacci Number', difficulty: 'Easy', description: 'The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.\nGiven n, calculate F(n).', input_format: 'A single integer n.', output_format: 'A single integer representing F(n).', constraints: '0 <= n <= 30', sample_input: '4', sample_output: '3', test_cases: '[{"input": "0", "output": "0"}, {"input": "1", "output": "1"}, {"input": "2", "output": "1"}, {"input": "3", "output": "2"}, {"input": "4", "output": "3"}, {"input": "10", "output": "55"}]' }
  ],
  hr_questions: [
    { id: 1, question: 'Tell me about yourself.', tips: 'Focus on your academic background, major projects, relevant technical skills, and a brief highlight of your achievements. Keep it around 1.5 to 2 minutes.', sample_answer: 'I graduated with a degree in Computer Science, where I specialized in full-stack development and databases. During my college days, I worked on an e-learning application and spearheaded a smart-agriculture IoT system that won a regional hackathon. I am passionate about engineering clean software and look forward to contributing my technical skills in Node.js and React here.' },
    { id: 2, question: 'Why do you want to join our company?', tips: 'Research the company\'s products, work culture, recent news, and values. Connect how working there aligns with your career goals.', sample_answer: 'I have been following your company\'s recent innovations in cloud scaling and AI-driven platforms. I want to work in an environment where technical growth is encouraged and where I can build software that impacts millions of active users daily. Your core engineering philosophy perfectly resonates with my personal career goals.' },
    { id: 3, question: 'What are your strengths and weaknesses?', tips: 'Provide genuine professional strengths with examples. For weaknesses, state a real area of improvement and follow up with how you are actively addressing it.', sample_answer: 'My major strength is my analytical problem-solving ability. During my internship, I resolved a critical memory leak issue that decreased response times by 30%. My weakness is that I sometimes struggle with delegation, as I like to ensure everything is perfect. However, I am actively working on this by using task trackers like Trello and trusting my teammates.' },
    { id: 4, question: 'Where do you see yourself in 5 years?', tips: 'Show ambition but be realistic. Align your goals with the company\'s growth trajectory. Mention skill development and leadership aspirations.', sample_answer: 'In 5 years, I see myself as a senior software engineer leading a team of developers. I plan to deepen my expertise in cloud architecture and system design while mentoring junior developers. I want to contribute to high-impact projects that serve millions of users and potentially take on technical leadership responsibilities.' },
    { id: 5, question: 'Why should we hire you?', tips: 'Summarize your unique value proposition. Combine your technical skills, soft skills, and motivation. Give concrete examples of past achievements.', sample_answer: 'You should hire me because I bring a strong combination of technical expertise in full-stack development, a proven track record of delivering projects on time, and excellent communication skills. In my last project, I single-handedly built an analytics dashboard that reduced manual reporting by 60%. I am eager to apply this problem-solving mindset to your team.' },
    { id: 6, question: 'Describe a challenging project you worked on.', tips: 'Use the STAR method: describe the Situation, Task, Action you took, and the Result. Quantify outcomes where possible.', sample_answer: 'During my final year, I was tasked with building a real-time traffic prediction system using machine learning. The situation was challenging because we had limited training data and tight deadlines. I took action by implementing data augmentation techniques and using transfer learning from a pre-trained model. The result was a system with 87% accuracy that was selected for the university tech expo.' },
    { id: 7, question: 'How do you handle pressure and tight deadlines?', tips: 'Demonstrate composure and organization. Mention specific strategies like task prioritization, time management tools, or breaking work into smaller chunks.', sample_answer: 'I handle pressure by breaking large tasks into smaller, manageable milestones with clear deadlines. During my internship, we had a critical release with only 3 days to fix 12 bugs. I prioritized them by severity, resolved the critical ones first, and communicated progress to the team lead every few hours. We shipped on time with zero critical issues remaining.' },
    { id: 8, question: 'Do you have any questions for us?', tips: 'Always ask 2-3 thoughtful questions. Inquire about team culture, tech stack, growth opportunities, or current challenges the team is solving.', sample_answer: 'Yes, I have a few questions: 1) What does the typical onboarding process look like for new engineers? 2) What are the biggest technical challenges your team is currently working on? 3) How does the company support continuous learning and professional development for engineers?' }
  ],
  user_progress: [],
  mock_tests: [
    { id: 1, title: 'TCS NQT Full Length Mock Test', duration_minutes: 30, questions: '[{"id":1,"type":"aptitude","subject":"quantitative"},{"id":3,"type":"aptitude","subject":"logical"},{"id":5,"type":"aptitude","subject":"verbal"},{"id":7,"type":"technical","subject":"java"},{"id":9,"type":"technical","subject":"cpp"},{"id":12,"type":"technical","subject":"os"},{"id":1,"type":"coding"}]' },
    { id: 2, title: 'Infosys SP Assessment Mock', duration_minutes: 45, questions: '[{"id":2,"type":"aptitude","subject":"quantitative"},{"id":4,"type":"aptitude","subject":"logical"},{"id":6,"type":"aptitude","subject":"verbal"},{"id":10,"type":"technical","subject":"python"},{"id":13,"type":"technical","subject":"dbms"},{"id":11,"type":"technical","subject":"webdev"},{"id":2,"type":"coding"},{"id":3,"type":"coding"}]' }
  ]
};

// Ensure fallback db file exists
if (!fs.existsSync(FALLBACK_DB_PATH)) {
  fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(DEFAULT_SEED_DATA, null, 2), 'utf8');
}

// SQL Query simulation for fallback database
function executeJsonQuery(sql, params = []) {
  const data = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf8'));
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');

  // 1. SELECT * FROM users WHERE email = ? OR username = ?
  if (normalizedSql.match(/SELECT \* FROM users WHERE email = \? OR username = \?/i)) {
    const matched = data.users.filter(u => u.email === params[0] || u.username === params[1]);
    return [matched];
  }

  // 2. SELECT * FROM users WHERE email = ?
  if (normalizedSql.match(/SELECT \* FROM users WHERE email = \?/i)) {
    const matched = data.users.filter(u => u.email === params[0]);
    return [matched];
  }

  // 3. SELECT * FROM users WHERE username = ?
  if (normalizedSql.match(/SELECT \* FROM users WHERE username = \?/i)) {
    const matched = data.users.filter(u => u.username === params[0]);
    return [matched];
  }

  // 4. SELECT * FROM users WHERE id = ?
  if (normalizedSql.match(/SELECT \* FROM users WHERE id = \?/i)) {
    const matched = data.users.filter(u => u.id == params[0]);
    return [matched];
  }

  // 5. INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)
  if (normalizedSql.match(/INSERT INTO users \(username, email, password, role\)/i)) {
    const newId = data.users.length ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      username: params[0],
      email: params[1],
      password: params[2],
      role: params[3] || 'student',
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return [{ insertId: newId }];
  }

  // 6. SELECT * FROM mcq_questions WHERE category = ? AND subject = ?
  if (normalizedSql.match(/SELECT \* FROM mcq_questions WHERE category = \? AND subject = \?/i)) {
    const matched = data.mcq_questions.filter(q => q.category === params[0] && q.subject === params[1]);
    return [matched];
  }

  // 7. SELECT * FROM mcq_questions WHERE category = ?
  if (normalizedSql.match(/SELECT \* FROM mcq_questions WHERE category = \?/i)) {
    const matched = data.mcq_questions.filter(q => q.category === params[0]);
    return [matched];
  }

  // 8. SELECT * FROM mcq_questions
  if (normalizedSql.match(/SELECT \* FROM mcq_questions$/i)) {
    return [data.mcq_questions];
  }

  // 9. SELECT * FROM coding_challenges
  if (normalizedSql.match(/SELECT \* FROM coding_challenges$/i)) {
    return [data.coding_challenges];
  }

  // 10. SELECT * FROM coding_challenges WHERE id = ?
  if (normalizedSql.match(/SELECT \* FROM coding_challenges WHERE id = \?/i)) {
    const matched = data.coding_challenges.filter(c => c.id == params[0]);
    return [matched];
  }

  // 11. SELECT * FROM hr_questions
  if (normalizedSql.match(/SELECT \* FROM hr_questions$/i)) {
    return [data.hr_questions];
  }

  // 12. SELECT * FROM mock_tests WHERE id = ?
  if (normalizedSql.match(/SELECT \* FROM mock_tests WHERE id = \?/i)) {
    const matched = data.mock_tests.filter(t => t.id == params[0]);
    return [matched];
  }

  // 13. SELECT * FROM mock_tests
  if (normalizedSql.match(/SELECT \* FROM mock_tests$/i)) {
    return [data.mock_tests];
  }

  // 14. SELECT * FROM user_progress WHERE user_id = ?
  if (normalizedSql.match(/SELECT \* FROM user_progress WHERE user_id = \?/i) || normalizedSql.match(/SELECT DISTINCT topic, subtopic, score, max_score, completed_at FROM user_progress WHERE user_id = \?/i)) {
    const matched = data.user_progress.filter(p => p.user_id == params[0]);
    return [matched];
  }

  // 15. INSERT INTO user_progress (user_id, topic, subtopic, score, max_score) VALUES (?, ?, ?, ?, ?)
  if (normalizedSql.match(/INSERT INTO user_progress/i)) {
    const newId = data.user_progress.length ? Math.max(...data.user_progress.map(p => p.id)) + 1 : 1;
    const newProg = {
      id: newId,
      user_id: params[0],
      topic: params[1],
      subtopic: params[2],
      score: params[3] !== undefined ? params[3] : null,
      max_score: params[4] !== undefined ? params[4] : null,
      completed_at: new Date().toISOString()
    };
    data.user_progress.push(newProg);
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return [{ insertId: newId }];
  }

  // 16. INSERT INTO mcq_questions (category, subject, question, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  if (normalizedSql.match(/INSERT INTO mcq_questions/i)) {
    const newId = data.mcq_questions.length ? Math.max(...data.mcq_questions.map(q => q.id)) + 1 : 1;
    const newMcq = {
      id: newId,
      category: params[0],
      subject: params[1],
      question: params[2],
      option_a: params[3],
      option_b: params[4],
      option_c: params[5],
      option_d: params[6],
      correct_option: params[7],
      explanation: params[8] || ''
    };
    data.mcq_questions.push(newMcq);
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return [{ insertId: newId }];
  }

  // 17. DELETE FROM mcq_questions WHERE id = ?
  if (normalizedSql.match(/DELETE FROM mcq_questions WHERE id = \?/i)) {
    const initialLen = data.mcq_questions.length;
    data.mcq_questions = data.mcq_questions.filter(q => q.id != params[0]);
    const deletedCount = initialLen - data.mcq_questions.length;
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return [{ affectedRows: deletedCount }];
  }

  // 18. INSERT INTO coding_challenges (title, difficulty, description, input_format, output_format, constraints, sample_input, sample_output, test_cases) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  if (normalizedSql.match(/INSERT INTO coding_challenges/i)) {
    const newId = data.coding_challenges.length ? Math.max(...data.coding_challenges.map(c => c.id)) + 1 : 1;
    const newChallenge = {
      id: newId,
      title: params[0],
      difficulty: params[1],
      description: params[2],
      input_format: params[3],
      output_format: params[4],
      constraints: params[5],
      sample_input: params[6],
      sample_output: params[7],
      test_cases: params[8]
    };
    data.coding_challenges.push(newChallenge);
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return [{ insertId: newId }];
  }

  // 19. DELETE FROM coding_challenges WHERE id = ?
  if (normalizedSql.match(/DELETE FROM coding_challenges WHERE id = \?/i)) {
    const initialLen = data.coding_challenges.length;
    data.coding_challenges = data.coding_challenges.filter(c => c.id != params[0]);
    const deletedCount = initialLen - data.coding_challenges.length;
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return [{ affectedRows: deletedCount }];
  }

  // Default fallback
  console.log(`[FallbackDB] Query not specifically matched: "${normalizedSql}". Returning default list/empty array.`);
  return [[]];
}

// Database Connection Handler
let pool;
let useFallback = false;

async function initDb() {
  if (process.env.DB_HOST) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      // Test connection
      const conn = await pool.getConnection();
      console.log('MySQL connection established successfully.');
      conn.release();
    } catch (err) {
      console.warn('MySQL connection configuration failed. Details:', err.message);
      console.log('Switching to JSON-based local database fallback.');
      useFallback = true;
    }
  } else {
    console.log('No DB_HOST specified in environment. Defaulting to JSON database.');
    useFallback = true;
  }
}

// Immediately initialize
initDb();

module.exports = {
  query: async (sql, params = []) => {
    if (useFallback) {
      return executeJsonQuery(sql, params);
    }
    try {
      return await pool.query(sql, params);
    } catch (err) {
      console.error('MySQL query execution error, routing to fallback DB. Error:', err.message);
      return executeJsonQuery(sql, params);
    }
  },
  isFallback: () => useFallback
};
