// index.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const db = new sqlite3.Database(':memory:'); // In-memory database
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined. Please set it in your .env file.');
  process.exit(1); // Stop server if JWT_SECRET is not set
}

// Allow requests from localhost and *.render.com
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      /^https?:\/\/.+\.onrender\.com(:\d{1,5})?$/, 
      /http:\/\/localhost(:\d{1,5})?$/
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin matches any of the allowed patterns
    const isAllowed = allowedOrigins.some((regex) => regex.test(origin));

    if (isAllowed) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Block other origins
    }
  },
  credentials: true, // Allow credentials (e.g., cookies, headers) to be included
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend/dist directory
const staticPath = path.resolve(__dirname, '../frontend/dist');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// Initialize the SQLite database and create tables
db.serialize(() => {
  // Create aa_customer table
  db.run(`CREATE TABLE aa_customer (
    customer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_FirstName VARCHAR(50),
    customer_Surname VARCHAR(50),
    customer_email TEXT UNIQUE,
    customer_password TEXT
  )`);

  // Create aa_trainer table
  db.run(`CREATE TABLE aa_trainer (
    trainer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    trainer_FirstName VARCHAR(50),
    trainer_Surname VARCHAR(50),
    trainer_email TEXT UNIQUE,
    trainer_password TEXT
  )`);

  // Create rooms table
  db.run(`CREATE TABLE rooms (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name VARCHAR(50) UNIQUE
  )`);

  // Create reservations table
  db.run(`CREATE TABLE reservations (
    reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    checkin_date DATE,
    checkout_date DATE,
    number_of_nights INTEGER,
    learner_prefix VARCHAR(10),
    learner_first_name VARCHAR(50),
    learner_surname VARCHAR(50),
    room_id INTEGER,
    trainer_id INTEGER,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (trainer_id) REFERENCES aa_trainer(trainer_ID)
  )`);

  // Create TableReservations table
  db.run(`CREATE TABLE TableReservations (
    reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    numberOfGuests INTEGER NOT NULL,
    contactDetails TEXT NOT NULL
  )`);

  // Create SpaBookings table
  db.run(`CREATE TABLE SpaBookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    treatmentType VARCHAR(50) NOT NULL,
    contactDetails TEXT NOT NULL
  )`);

  // Pre-populate the aa_trainer table with sample data
  const trainers = [
    {
      firstName: 'Cameron',
      surname: 'Guthrie',
      email: 'cameron.guthrie@qa.com',
      password: '!Password1', // Plain text password (will be hashed)
    },
    {
      firstName: 'Namir',
      surname: 'Sabbagh',
      email: 'namir.sabbagh@qa.com',
      password: '!Password1',
    },
    {
      firstName: 'QA',
      surname: 'Trainer',
      email: 'qa.trainer@qa.com',
      password: '!Password1',
    },
  ];

  const insertTrainer = db.prepare(
    'INSERT INTO aa_trainer (trainer_FirstName, trainer_Surname, trainer_email, trainer_password) VALUES (?, ?, ?, ?)'
  );

  trainers.forEach((trainer) => {
    const hash = bcrypt.hashSync(trainer.password, 10);
    insertTrainer.run(
      trainer.firstName,
      trainer.surname,
      trainer.email,
      hash
    );
  });

  insertTrainer.finalize();

  // Pre-populate rooms table
  const rooms = [
    'Azure', 'Artemis', 'Bronte', 'Calypso', 'Chanda', 'Danu', 'Dione', 'Diti',
    'Enyo', 'Eos', 'Era', 'Ersa', 'Gaia', 'Hestia', 'Iris', 'Kallone', 'Kamira',
    'Karen', 'Leto', 'Limos', 'Metis', 'Nike', 'Nemesis', 'Pallas', 'Phoebe',
    'Rhea', 'Rhodos', 'Selene', 'Thalia', 'Utras',
  ];

  const insertRoom = db.prepare('INSERT INTO rooms (room_name) VALUES (?)');

  rooms.forEach((room) => {
    insertRoom.run(room);
  });

  insertRoom.finalize();
});

// Authentication middleware for trainers
const authenticateTrainer = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user.trainer_ID) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    req.trainer_ID = user.trainer_ID;
    next();
  });
};

// Customer Login Route
app.post('/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM aa_customer WHERE customer_email = ?',
    [email],
    (err, customer) => {
      if (
        err ||
        !customer ||
        !bcrypt.compareSync(password, customer.customer_password)
      ) {
        console.error('Login failed:', err || 'Invalid credentials');
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { customer_ID: customer.customer_ID, email: customer.customer_email },
        JWT_SECRET
      );
      console.log('Login successful, token generated:', token);
      res.json({ token });
    }
  );
});

// Trainer Login Route
app.post('/trainer-login', (req, res) => {
  console.log('Trainer login request received:', req.body);
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM aa_trainer WHERE trainer_email = ?',
    [email],
    (err, trainer) => {
      if (
        err ||
        !trainer ||
        !bcrypt.compareSync(password, trainer.trainer_password)
      ) {
        console.error('Trainer login failed:', err || 'Invalid credentials');
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { trainer_ID: trainer.trainer_ID, email: trainer.trainer_email },
        JWT_SECRET
      );
      console.log('Trainer login successful, token generated:', token);
      res.json({ token });
    }
  );
});

// Registration Route (unchanged)
app.post('/register', (req, res) => {
  console.log('Register request received:', req.body);
  const { firstName, surname, email, password } = req.body;

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO aa_customer (customer_FirstName, customer_Surname, customer_email, customer_password) VALUES (?, ?, ?, ?)',
    [firstName, surname, email, hash],
    function (err) {
      if (err) {
        console.error('Registration failed:', err);
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ message: 'Email is already registered.' });
        }
        return res.status(500).json({ message: 'Customer registration failed.' });
      }

      const token = jwt.sign(
        { customer_ID: this.lastID, email },
        JWT_SECRET
      );
      console.log('Registration successful, token generated:', token);
      res.status(201).json({ token });
    }
  );
});

// Fetch trainer details
app.get('/api/trainers/:trainer_id', authenticateTrainer, (req, res) => {
  const trainer_id = req.params.trainer_id;

  db.get(
    'SELECT trainer_FirstName, trainer_Surname FROM aa_trainer WHERE trainer_ID = ?',
    [trainer_id],
    (err, trainer) => {
      if (err || !trainer) {
        console.error('Failed to fetch trainer:', err);
        return res.status(500).json({ message: 'Failed to fetch trainer.' });
      }
      res.json(trainer);
    }
  );
});

// Fetch available rooms
app.get('/api/available-rooms', authenticateTrainer, (req, res) => {
  const { checkin_date, checkout_date } = req.query;

  if (!checkin_date || !checkout_date) {
    return res.status(400).json({ message: 'Check-in and checkout dates are required.' });
  }

  const sql = `
    SELECT room_id, room_name FROM rooms
    WHERE room_id NOT IN (
      SELECT room_id FROM reservations
      WHERE checkin_date < ? AND checkout_date > ?
    )
  `;

  db.all(sql, [checkout_date, checkin_date], (err, rows) => {
    if (err) {
      console.error('Failed to fetch available rooms:', err);
      return res.status(500).json({ message: 'Failed to fetch available rooms.' });
    }
    res.json(rows);
  });
});

// Create a new reservation
app.post('/api/reservations', authenticateTrainer, (req, res) => {
  const {
    checkin_date,
    checkout_date,
    learner_prefix,
    learner_first_name,
    learner_surname,
    room_id,
  } = req.body;

  const trainer_id = req.trainer_ID;

  // Calculate number of nights
  const checkinDate = new Date(checkin_date);
  const checkoutDate = new Date(checkout_date);
  const number_of_nights = Math.ceil(
    (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24)
  );

  // Validate required fields
  if (
    !checkin_date ||
    !checkout_date ||
    !learner_prefix ||
    !learner_first_name ||
    !learner_surname ||
    !room_id ||
    !trainer_id
  ) {
    return res.status(400).json({ message: 'Please complete all mandatory fields (*)' });
  }

  // Check for room availability
  const sqlCheck = `
    SELECT COUNT(*) as count FROM reservations
    WHERE room_id = ? AND checkin_date < ? AND checkout_date > ?
  `;

  db.get(sqlCheck, [room_id, checkout_date, checkin_date], (err, row) => {
    if (err) {
      console.error('Error checking room availability:', err);
      return res.status(500).json({ message: 'Error checking room availability.' });
    }

    if (row.count > 0) {
      return res.status(400).json({ message: 'Room is not available for the selected dates.' });
    }

    // Insert reservation
    const sqlInsert = `
      INSERT INTO reservations (
        checkin_date,
        checkout_date,
        number_of_nights,
        learner_prefix,
        learner_first_name,
        learner_surname,
        room_id,
        trainer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sqlInsert,
      [
        checkin_date,
        checkout_date,
        number_of_nights,
        learner_prefix,
        learner_first_name,
        learner_surname,
        room_id,
        trainer_id,
      ],
      function (err) {
        if (err) {
          console.error('Failed to create reservation:', err);
          return res.status(500).json({ message: 'Failed to create reservation.' });
        }
        res.status(201).json({ message: 'Reservation created successfully.' });
      }
    );
  });
});

// API endpoint for reserving a table
app.post('/reserve-table', (req, res) => {
  const { name, date, time, numberOfGuests, contactDetails } = req.body;

  db.run(
    `INSERT INTO TableReservations (name, date, time, numberOfGuests, contactDetails) VALUES (?, ?, ?, ?, ?)`,
    [name, date, time, numberOfGuests, contactDetails],
    function (err) {
      if (err) {
        res.status(400).send('Error saving reservation: ' + err.message);
      } else {
        res.status(201).send('Table reservation successful');
      }
    }
  );
});

// API endpoint for booking the spa
app.post('/book-spa', (req, res) => {
  const { name, date, time, treatmentType, contactDetails } = req.body;

  db.run(
    `INSERT INTO SpaBookings (name, date, time, treatmentType, contactDetails) VALUES (?, ?, ?, ?, ?)`,
    [name, date, time, treatmentType, contactDetails],
    function (err) {
      if (err) {
        res.status(400).send('Error saving booking: ' + err.message);
      } else {
        res.status(201).send('Spa booking successful');
      }
    }
  );
});

// Catch-all route to serve the frontend's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});