import { config } from 'dotenv';
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';

config();

// Reuse the transporter setup from before
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Create a worker that listens to the 'email-queue'
const worker = new Worker('email-queue', async (job) => {
  console.log(`Processing job ${job.id}: Sending email to ${job.data.to}`);
  
  // The actual sending logic happens here
  await transporter.sendMail({
    from: '"My App" <no-reply@myapp.com>',
    to: job.data.to,
    subject: job.data.subject,
    text: job.data.body
  });
  
  console.log(`Job ${job.id} completed!`);
}, { connection: { host: '127.0.0.1', port: 6379 } }); // Connect to Redis
