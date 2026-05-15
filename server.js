/* ══════════════════════════════════════════════════════
   SANJAY SJ — PORTFOLIO BACKEND
   Saves messages + Sends directly to Gmail
══════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = 3000;

/* ─────────────────────────────────────
   SETUP
───────────────────────────────────── */

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

const CONTACTS_FILE = path.join(__dirname, 'contacts.json');

if (!fs.existsSync(CONTACTS_FILE)) {
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
  console.log('📁 contacts.json created');
}


/* ─────────────────────────────────────
   RESEND EMAIL HELPER (works on Render free tier)
   Uses HTTPS API — no SMTP, never blocked
───────────────────────────────────── */

function sendEmailViaResend({ to, replyTo, subject, html }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: [to],
      reply_to: replyTo,
      subject,
      html,
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Resend request timeout'));
    });

    req.write(body);
    req.end();
  });
}

/* ─────────────────────────────────────
   SIMPLE RATE LIMITER
───────────────────────────────────── */

const ipLog = {};

function rateLimit(req, res, next) {

  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  const TEN_MIN = 10 * 60 * 1000;

  if (!ipLog[ip]) ipLog[ip] = [];

  ipLog[ip] = ipLog[ip].filter(t => now - t < TEN_MIN);

  if (ipLog[ip].length >= 5) {

    return res.status(429).json({
      success: false,
      message: 'Too many submissions. Please wait 10 minutes.'
    });

  }

  ipLog[ip].push(now);

  next();
}

/* ─────────────────────────────────────
   VALIDATION
───────────────────────────────────── */

function validate({ name, email, message }) {

  if (!name || name.trim().length < 2)
    return 'Name must be at least 2 characters.';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return 'Please enter a valid email address.';

  if (!message || message.trim().length < 5)
    return 'Message must be at least 5 characters.';

  if (message.length > 2000)
    return 'Message is too long (max 2000 characters).';

  return null;
}

/* ─────────────────────────────────────
   CONTACT API
───────────────────────────────────── */

app.post('/api/contact', rateLimit, async (req, res) => {

  try {

    const { name, email, message } = req.body;

    const error = validate({ name, email, message });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    // Read existing contacts
    let contacts = [];

    try {
      contacts = JSON.parse(
        fs.readFileSync(CONTACTS_FILE, 'utf8')
      );
    } catch (e) {
      contacts = [];
    }

    // Create contact object
    const newContact = {
      id: contacts.length + 1,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      timestamp: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      }),
      read: false,
    };

    // Save locally
    contacts.push(newContact);

    fs.writeFileSync(
      CONTACTS_FILE,
      JSON.stringify(contacts, null, 2)
    );

    /* ─────────────────────────────────────
       SEND EMAIL
    ───────────────────────────────────── */

    await sendEmailViaResend({
      to: process.env.EMAIL,
      replyTo: email,
      subject: `📩 Portfolio Message from ${name}`,
      html: `
        <div style="font-family:Arial;padding:24px;background:#0d0520;color:#fff;border-radius:12px;max-width:560px;">
          <h2 style="color:#00f5d4;margin-top:0;">📩 New Portfolio Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color:#7b2fff;">${email}</a></p>
          <p><strong>Message:</strong></p>
          <div style="background:#1a0a3a;padding:15px;border-radius:8px;margin-top:8px;line-height:1.7;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top:20px;">
            <a href="mailto:${email}?subject=Re: Your portfolio message" style="background:#7b2fff;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reply Now ↗</a>
          </div>
        </div>
      `,
    });

    console.log(`\n📩 New message from ${name} <${email}>`);

    return res.json({
      success: true,
      message: 'Message received successfully 🚀'
    });

  } catch (e) {

    console.error('❌ FULL ERROR:', e.message);
    console.error('❌ ERROR CODE:', e.code);
    console.error('❌ STACK:', e.stack);

    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });

  }

});

/* ─────────────────────────────────────
   VIEW MESSAGES
───────────────────────────────────── */

app.get('/api/messages', (req, res) => {

  try {

    const contacts = JSON.parse(
      fs.readFileSync(CONTACTS_FILE, 'utf8')
    );

    const rows = contacts.map(c => `
      <tr style="border-bottom:1px solid #1e1e2e;">
        <td style="padding:12px;color:#888;">#${c.id}</td>
        <td style="padding:12px;font-weight:bold;">${c.name}</td>
        <td style="padding:12px;color:#7b2fff;">${c.email}</td>
        <td style="padding:12px;">${c.message}</td>
        <td style="padding:12px;color:#888;">${c.timestamp}</td>
      </tr>
    `).join('');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Portfolio Messages</title>

        <style>
          body{
            background:#0d0520;
            color:#fff;
            font-family:Arial;
            padding:30px;
          }

          table{
            width:100%;
            border-collapse:collapse;
            background:#12082e;
          }

          th{
            background:#7b2fff;
            padding:14px;
            text-align:left;
          }

          td{
            padding:12px;
          }

          tr{
            border-bottom:1px solid #222;
          }
        </style>

      </head>

      <body>

        <h1>📩 Portfolio Messages</h1>

        <p>Total Messages: ${contacts.length}</p>

        <table>

          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

      </body>
      </html>
    `);

  } catch (e) {

    res.status(500).send('Error reading messages');

  }

});

/* ─────────────────────────────────────
   HEALTH CHECK
───────────────────────────────────── */

app.get('/api/health', (req, res) => {

  res.json({
    success: true,
    status: 'Server running 🚀'
  });

});

/* ─────────────────────────────────────
   FRONTEND ROUTE
───────────────────────────────────── */

app.get('*', (req, res) => {

  res.sendFile(
    path.join(__dirname, 'index.html')
  );

});

/* ─────────────────────────────────────
   START SERVER
───────────────────────────────────── */

app.listen(PORT, () => {

  console.log(`
╔══════════════════════════════════════════╗
║   Sanjay SJ — Portfolio Backend         ║
║                                          ║
║   Portfolio → http://localhost:3000     ║
║   Messages  → /api/messages             ║
║                                          ║
║   Resend Email Notifications ✅         ║
╚══════════════════════════════════════════╝
  `);

});
