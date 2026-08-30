# Nagar Seva — Civic Complaint Portal (MERN Stack)

A complete hackathon-ready prototype rebuilt on the MERN stack, per the course
tech list: **MongoDB, Express, React, Node.js**, with **Tailwind CSS** for
styling. No Python/Flask anywhere in this version.

---

## 1. Final tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) + React Router + Tailwind CSS + Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcrypt password hashing |
| File uploads | Multer (complaint photos + proof-of-fix photos) |
| Location | Browser Geolocation API (`navigator.geolocation`) — no paid map API required |

## 2. Architecture

```
Browser (React SPA)
   │  axios (JSON + multipart/form-data)
   ▼
Express REST API  ──►  MongoDB (Mongoose models)
   │
   └── /uploads (static folder) — serves complaint & proof photos
```

- The **citizen** never logs in — they file and track complaints anonymously via a Complaint ID.
- **Staff** (department or admin) log in with JWT-based auth; the token is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every dashboard request.
- Every complaint is **auto-routed** to a department the moment it's created, based on its category — no manual assignment step.

## 3. Folder structure

```
nagar-seva-mern/
├── server/                      # Express + MongoDB backend
│   ├── config/db.js               # Mongoose connection
│   ├── models/                     # Department, User, Complaint schemas
│   ├── controllers/                 # Route logic
│   ├── middleware/                   # JWT auth, Multer upload
│   ├── routes/                        # Express routers
│   ├── utils/generateComplaintId.js    # CMP-YYYYMMDD-0001 ID generator
│   ├── uploads/                          # Uploaded photos land here
│   ├── seed.js                            # Creates departments + demo logins
│   ├── server.js                           # App entry point
│   ├── package.json
│   └── .env.example
└── client/                      # React (Vite) frontend
    ├── src/
    │   ├── components/            # Navbar, StatusBadge, Timeline, CategoryCard, StatCard, ResolveModal
    │   ├── pages/                  # Home, Track, Login, DepartmentDashboard
    │   ├── services/api.js          # Axios instance + all API calls
    │   ├── App.jsx, main.jsx, index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

## 4. Database models

**Department** — `{ name }`

**User** (staff/admin login) — `{ username, password (hashed), role: 'department'|'admin', department: ObjectId|null }`

**Complaint**
```js
{
  complaintId,        // "CMP-20260829-0001"
  citizenName, phone,
  category,            // Water Supply | Electricity | Roads | Sanitation | Street Lights | Other
  department,           // ObjectId ref Department (auto-assigned)
  description,
  photoUrl,               // citizen's photo
  location: { lat, lng, address },
  status,                  // Pending | In Progress | Resolved
  resolutionPhotoUrl,       // proof-of-fix photo (required to resolve)
  resolvedBy, resolvedAt,
  createdAt, updatedAt       // automatic timestamps
}
```

## 5. Complete user flow

```
Citizen (no login)
  → Opens site → selects "Roads" → describes pothole
  → Uploads photo → shares location (or types address)
  → Submits → gets Complaint ID (e.g. CMP-20260829-0001)
  → Complaint auto-assigned to "Roads & Infrastructure Department"

Staff (roads_dept / dept123)
  → Logs in → sees the complaint in their dashboard (Pending)
  → Changes status to "In Progress"
  → Later, selects "Resolved" → a modal requires a proof-of-fix photo
  → Uploads photo → complaint marked Resolved, photo stored for audit

Citizen
  → Goes to /track → enters Complaint ID
  → Sees the 4-step timeline (Filed → Assigned → In Progress → Resolved)
  → Sees the proof-of-fix photo
```

Admin (`admin` / `admin123`) sees this same dashboard but across **every**
department at once, with a "by department" breakdown chart.

---

## 6. Setup instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally, **or** a free MongoDB Atlas cluster

### 6.1 Install MongoDB (pick one)

**Option A — Local MongoDB**
```bash
# macOS (Homebrew)
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community

# Ubuntu/Debian — follow: https://www.mongodb.com/docs/manual/administration/install-on-linux/

# Windows — download the installer from mongodb.com/try/download/community
```
Once installed, MongoDB runs at `mongodb://127.0.0.1:27017` by default — nothing else to configure.

**Option B — MongoDB Atlas (free, no local install)**
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a free (M0) cluster
3. Under **Database Access**, create a user with a password
4. Under **Network Access**, allow your current IP (or `0.0.0.0/0` for a hackathon demo)
5. Click **Connect → Drivers**, copy the connection string (looks like `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/`)

### 6.2 Backend setup

```bash
cd server
npm install
cp .env.example .env
```
Open `.env` and set `MONGO_URI` (local or Atlas string from above) and a `JWT_SECRET` (any long random string).

```bash
npm run seed     # creates departments + demo logins (safe to re-run)
npm run dev      # starts the API with auto-reload (or: npm start)
```
**Expected output:**
```
✅ MongoDB connected: 127.0.0.1
🚀 Nagar Seva API running on http://localhost:5000
```

### 6.3 Frontend setup

Open a **second terminal**:
```bash
cd client
npm install
npm run dev
```
**Expected output:**
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies `/api` and `/uploads` to the backend automatically (see `vite.config.js`) — no CORS setup needed in development.

## 7. Testing the complete demo flow

1. Go to `http://localhost:5173` → fill the form: category **Roads**, description "pothole near bus stop", attach a photo, click **"Use my current location"** (allow the browser permission prompt), enter a phone number → **Submit complaint**.
2. Copy the Complaint ID shown.
3. Go to `http://localhost:5173/login` → sign in as `roads_dept / dept123`.
4. On the dashboard, find the complaint → change status dropdown to **In Progress**.
5. Change the dropdown to **Resolved** → a modal opens asking for a proof photo → attach any image → **Mark Resolved**.
6. Logout → go to `http://localhost:5173/track` → paste the Complaint ID → confirm it shows **Resolved** with the proof photo and full timeline.

## 8. Demo accounts

| Role | Username | Password |
|---|---|---|
| Water Department | `water_dept` | `dept123` |
| Electricity Department | `electricity_dept` | `dept123` |
| Roads & Infrastructure Department | `roads_dept` | `dept123` |
| Sanitation Department | `sanitation_dept` | `dept123` |
| General/Municipal Department | `general_dept` | `dept123` |
| Admin (sees all departments) | `admin` | `admin123` |

These are also shown live on the login page (click **"Show all demo accounts"**). Created by `npm run seed` — **change or remove them before any real deployment.**

## 9. Category → Department routing

| Category | Routed to |
|---|---|
| Water Supply | Water Department |
| Electricity | Electricity Department |
| Roads | Roads & Infrastructure Department |
| Sanitation | Sanitation Department |
| Street Lights | Electricity Department (shared electrical/municipal team) |
| Other | General/Municipal Department |

Change this in `server/controllers/complaintController.js` → `CATEGORY_DEPARTMENT_MAP`.

## 10. Location without a paid API

This build uses only the browser's built-in **Geolocation API**
(`navigator.geolocation.getCurrentPosition`) — free, no key required, works
out of the box on any HTTPS site or `localhost`. Coordinates are stored and
shown to staff as a plain Google Maps link (`google.com/maps?q=lat,lng`),
which also needs no API key. If you later want an embedded map or reverse
geocoding (turning coordinates into a street address automatically), that
would need a mapping API key (e.g. Google Maps, Mapbox, OpenStreetMap/Nominatim) —
entirely optional and not required for this demo to work.

## 11. Notifications

This build uses **in-app status updates only** (no SMS/WhatsApp), as
required — nothing paid or optional-service-dependent is needed for the core
demo. If you want to add WhatsApp/SMS later, the natural place is inside
`resolveComplaint` and `updateStatus` in `complaintController.js`, calling
out to a provider of your choice (e.g. Twilio) — entirely optional.

## 12. Security notes

- Passwords are hashed with bcrypt before being stored — the plaintext password is never saved or returned by the API (see `User.js`'s `toJSON` transform).
- Secrets (`JWT_SECRET`, `MONGO_URI`) live in `.env`, which is **not** committed — only `.env.example` is.
- Add a `.gitignore` with `node_modules/`, `.env`, and `server/uploads/*` (keep `.gitkeep`) before pushing to GitHub.
- Department staff can only see/update complaints assigned to their own department — enforced server-side in every controller, not just hidden in the UI.

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | Make sure MongoDB is running (`mongod` or check Atlas), and `MONGO_URI` in `.env` is correct. |
| `Department "..." not found — did you run "npm run seed"?` | Run `cd server && npm run seed` before filing complaints. |
| Login says "Invalid username or password" | Re-run `npm run seed` — it skips accounts that already exist, so if you changed a password directly in the DB it won't match. Easiest fix: drop the `users` collection and re-seed. |
| Frontend can't reach the API / network errors | Make sure the backend is running on port 5000 **before** starting the frontend, and that you're opening `http://localhost:5173` (not `file://`). |
| Photo upload fails with a 500 error | Check the file is under 8MB and is a jpg/png/webp/gif — other types are rejected by `uploadMiddleware.js`. |
| "Resolving requires a verification photo" error even with a photo attached | This means the request hit `/status` instead of `/resolve` — make sure you're using the current `DepartmentDashboard.jsx`, which routes "Resolved" through the modal automatically. |
| Port 5000 or 5173 already in use | Change `PORT` in `server/.env`, and/or edit the `port` in `client/vite.config.js` (update the proxy target to match if you change the backend port). |
