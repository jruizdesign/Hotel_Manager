import express from 'express';
// import { Queue } from 'bullmq';

const app = express();

// Middleware: Enable CORS to allow requests from the React frontend (port 5173)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.json());

// Initialize the queue with the Redis connection settings
// const emailQueue = new Queue('email-queue', { connection: { host: '127.0.0.1', port: 6379 } });

app.post('/register', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // 1. Save user to DB (omitted for brevity)

    // 2. Add email job to queue
    /* await emailQueue.add('welcome-email', {
      to: email,
      subject: 'Welcome to StaySync!',
      body: 'Thanks for joining us. Your account has been created.'
    }); */
    console.log('Registration endpoint hit, email queue is disabled.');

    res.status(200).json({ message: 'User registered, email on the way!' });
  } catch (error) {
    console.error('Error processing registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New endpoint for generic system alerts (Maintenance, etc.)
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    /* await emailQueue.add('system-alert', {
      to,
      subject,
      body
    }); */
    console.log('Send-email endpoint hit, email queue is disabled.');

    res.status(200).json({ message: 'Email queued successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});