# Sanjay SJ — Portfolio

## Run in 3 steps (no API keys, no setup)

```
Step 1 — Install Node.js from https://nodejs.org

Step 2 — Open this folder in terminal and run:
         npm install

Step 3 — Start the server:
         npm start
```

Open http://localhost:3000 — your portfolio is live.

---

## Folder structure

```
sanjay-portfolio/
├── server.js          ← The backend (run this)
├── package.json       ← Dependencies list
├── contacts.json      ← Auto-created when someone sends a message
└── public/            ← ALL your frontend files go here
    ├── index.html
    ├── style.css
    ├── script.js      ← (the updated one from this package)
    ├── Sanjay_SJ_Resume.pdf    ← Drop your resume PDF here
    └── images/
        └── photo.jpg           ← Drop your photo here
```

---

## Reading your messages

When someone submits the contact form, the message is saved to `contacts.json`.

**Two ways to read messages:**

1. Open the file directly: `contacts.json` (plain text, easy to read)

2. Open in browser: http://localhost:3000/api/messages
   (shows a nice table of all messages while server is running)

---

## Adding your photo

In `public/index.html`, find this comment:
```
<!-- ↓ REPLACE THIS WITH YOUR PHOTO ↓ -->
```

Replace the entire `<div class="photo-frame">...</div>` block with:
```html
<img src="images/photo.jpg" class="about-img" alt="Sanjay SJ">
```

Then drop your `photo.jpg` into `public/images/`.

---

## Deploying online (free)

**Railway.app** — easiest option:
1. Upload this folder to GitHub (don't include contacts.json)
2. Go to railway.app → New Project → Deploy from GitHub
3. Done — you get a live URL

**Important:** On Railway, messages are lost when server restarts.
To keep them permanently, use Railway's free PostgreSQL or just
note down each message when it arrives.
