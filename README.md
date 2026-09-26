# 🏛️ Nagar Seva — Civic Grievance & Municipal Resolution Portal

[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-blue?style=for-the-badge&logo=render)](https://nagar-seva-1-l8h5.onrender.com)
[![MERN Stack](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-47A248?style=for-the-badge&logo=mongodb)](https://github.com/adarshsingh022006-tech/Nagar-Seva)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Nagar Seva** is a full-stack civic grievance redressal and municipal transparency portal built with the **MERN stack (MongoDB, Express.js, React 18, Node.js)** and styled with **Tailwind CSS**. 

It connects citizens directly with municipal departments through transparent tracking, photographic proof of work, SLA compliance timers, multilingual accessibility, and community upvoting — without requiring paid proprietary APIs.

---

## 🌟 Live Deployment

- **Production URL**: [https://nagar-seva-1-l8h5.onrender.com](https://nagar-seva-1-l8h5.onrender.com)
- **Repository**: [https://github.com/adarshsingh022006-tech/Nagar-Seva](https://github.com/adarshsingh022006-tech/Nagar-Seva)

---

## 🚀 Key Features & Technical Details

All features in Nagar Seva are implemented using open web standards, robust backend logic, and lightweight client-side utilities without exaggerated claims or costly third-party AI APIs.

### 1. 🗺️ OpenStreetMap & Interactive Pinpoint Geo-Picker
- **Technology**: Leaflet & `react-leaflet` on OpenStreetMap tiles.
- **How it works**: Citizens can either use browser GPS geolocation (`navigator.geolocation`) or drag-and-drop a pinpoint marker on an interactive map. 
- **Zero Cost**: Completely free and open-source, eliminating reliance on paid proprietary Google Maps APIs while providing exact latitude/longitude coordinates to field workers.

### 2. 📢 Nagar Feed & Community +1 Upvoting
- **Technology**: React SPA + MongoDB Atomic Counter (`$inc`).
- **How it works**: A public, transparent community feed displaying active grievances in the locality. Citizens can browse issues and click **"+1 I'm affected too"** rather than creating redundant tickets.
- **Impact**: Automatically prioritizes high-impact community issues for municipal officers based on upvote count.

### 3. 🔄 Before vs. After Proof-of-Fix Image Slider
- **Technology**: Custom interactive split-screen slider component.
- **How it works**: When marking a complaint as "Resolved", municipal staff are strictly required to upload a photographic proof-of-work. Citizens can drag the interactive slider to compare the original problem image directly with the resolved state.

### 4. ⏱️ Dynamic SLA Countdown Timers & Escalation
- **Technology**: Real-time client & server timestamp math.
- **How it works**: Every complaint receives an SLA deadline calculated from its category urgency (e.g., Emergency: 6 hrs, High: 24 hrs, Normal: 48 hrs). A live color-coded countdown badge (Green → Amber < 4h → Red Overdue) alerts both citizens and department officers to impending SLA breaches.

### 5. 🎙️ Voice Dictation & Audio Notes
- **Technology**: Native Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) and HTML5 `MediaRecorder`.
- **How it works**: Citizens who prefer speaking over typing can dictate descriptions directly in Hindi or English, or record an attached voice note to explain complex civic issues.

### 6. 🌐 7 Indian Regional Languages
- **Technology**: Zero-dependency frontend internationalization dictionary.
- **Languages Supported**: English, Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), and Gujarati (ગુજરાતી).
- **How it works**: Seamless 1-click language switcher in the navigation bar dynamically translates all UI labels, form fields, and status badges.

### 7. 🔍 Geospatial Duplicate Detection
- **Technology**: Euclidean distance coordinate filtering ($\Delta \le 300\text{m}$) + text address matching.
- **How it works**: Checks incoming complaints against existing active issues within a 300-meter radius to alert citizens of existing tickets before submission, reducing municipal ticket clutter.

### 8. 🧠 Smart Keyword & Context Category Suggester
- **Technology**: Rule-based keyword context matcher (`client/src/utils/aiCategoryHelper.js`).
- **How it works**: Analyzes complaint descriptions as the user types using a curated dictionary of multilingual civic terms (e.g., *kachra*, *pani*, *pothole*, *gaddha*, *bijli ka tar*, *spark*) to suggest the correct category and urgency level instantly with zero server latency.

### 9. ⭐ Citizen Ratings & 1-Click Re-Open Workflow
- **Technology**: Multi-state MongoDB grievance lifecycle.
- **How it works**: Once resolved, citizens can submit a 1-to-5 star satisfaction rating. If the issue was not properly fixed on the ground, the citizen can click **"Re-open Complaint"** with remarks, reverting the status to "In Progress" and flagging it on the department dashboard.

### 10. 🏆 Civic Karma Leaderboard
- **Technology**: Client-side gamification and engagement tracking.
- **How it works**: Awards Civic Karma points for valid reports, verified fixes, and upvotes to encourage proactive citizen participation in urban governance.

### 11. 🚨 Public Municipal Broadcast Alerts
- **Technology**: REST API + Dynamic Alert Banner (`/api/announcements`).
- **How it works**: Enables municipal administrators to broadcast critical public advisories (scheduled power cuts, water maintenance, monsoon alerts, road closures) across the top of the portal.

### 12. 📱 Phone-Based Grievance Lookup
- **Technology**: Indexed MongoDB phone number search query.
- **How it works**: Citizens can view and track all complaints filed from their phone number in one unified modal without requiring traditional password logins.

---

## 🏗️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   Client (React 18)                    │
│   Vite • Tailwind CSS • React Leaflet • Axios • Lucide │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST API (JSON & Multipart)
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Server (Node.js & Express)            │
│   JWT Auth • Multer Storage • SLA Engine • Routing     │
└──────────────────────────┬─────────────────────────────┘
                           │ Mongoose ODM
                           ▼
┌────────────────────────────────────────────────────────┐
│                  Database (MongoDB Atlas)              │
│   Complaints • Departments • Users • Announcements     │
└────────────────────────────────────────────────────────┘
```

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, React Router DOM, React-Leaflet, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB & Mongoose ODM |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| **File Storage** | Multer middleware (Static local `/uploads` or Cloud storage) |
| **Mapping** | OpenStreetMap & Leaflet (`react-leaflet`) |
| **Voice Processing** | Browser Web Speech API & HTML5 Audio MediaRecorder |

---

## 📁 Repository Structure

```
nagar-seva-mern/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── components/              # UI components (Map, FeedCard, Slider, Modals, Navbar)
│   │   ├── pages/                   # Home, NagarFeed, Track, Login, DepartmentDashboard
│   │   ├── services/api.js          # Axios API client
│   │   ├── utils/                   # Category helper, translations, SLA calculators
│   │   ├── App.jsx, main.jsx        # Routing and entry points
│   │   └── index.css                # Tailwind CSS imports
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/                          # Express Backend
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/                 # Route logic (complaints, auth, announcements)
│   ├── middleware/                  # JWT auth & Multer file upload
│   ├── models/                      # Complaint, Department, User, Announcement schemas
│   ├── routes/                      # API route definitions
│   ├── utils/generateComplaintId.js # CMP-YYYYMMDD-XXXX ID generator
│   ├── uploads/                     # Uploaded citizen and proof photos
│   ├── seed.js                      # Database seeder with demo accounts
│   ├── server.js                    # Express server entry point
│   └── package.json
├── package.json                     # Monorepo build and deployment scripts
└── README.md
```

---

## 🛠️ Local Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB server or free MongoDB Atlas URI

### 1. Clone the Repository
```bash
git clone https://github.com/adarshsingh022006-tech/Nagar-Seva.git
cd Nagar-Seva
```

### 2. Backend Configuration
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/nagar_seva
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

Seed initial departments and staff credentials:
```bash
npm run seed
```

Start the backend development server:
```bash
npm run dev
# Server running on http://localhost:5000
```

### 3. Frontend Configuration
Open a new terminal window:
```bash
cd client
npm install
npm run dev
# Frontend running on http://localhost:5173
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Demo Credentials

The following demo accounts are seeded automatically for testing:

| Department / Role | Username | Password | Access Scope |
|---|---|---|---|
| **Roads & Infrastructure** | `roads_dept` | `dept123` | Road repairs, potholes, footpath issues |
| **Water Supply** | `water_dept` | `dept123` | Water leaks, pipeline bursts, contamination |
| **Electricity** | `electricity_dept` | `dept123` | Power outages, street lights, sparks, transformers |
| **Sanitation & Waste** | `sanitation_dept` | `dept123` | Garbage piles, open drains, dead animals |
| **General Municipal** | `general_dept` | `dept123` | General civic inquiries and other complaints |
| **Municipal Administrator** | `admin` | `admin123` | All-department overview, analytics & alerts |

---

## 📡 REST API Endpoints

### Complaints
- `POST /api/complaints` — Submit a new grievance (supports multipart image & audio)
- `GET /api/complaints` — Fetch complaints (supports filtering by department, status, proximity)
- `GET /api/complaints/:id` — Get single complaint details by ID (e.g. `CMP-20260923-0001`)
- `POST /api/complaints/:id/upvote` — Add a +1 community upvote
- `PUT /api/complaints/:id/status` — Update status (Pending → In Progress)
- `PUT /api/complaints/:id/resolve` — Mark resolved (requires proof photo)
- `POST /api/complaints/:id/rate` — Submit citizen satisfaction rating (1-5 stars)
- `POST /api/complaints/:id/reopen` — Citizen re-opens an unresolved complaint
- `GET /api/complaints/phone/:phone` — Retrieve all complaints filed by a phone number

### Announcements & Auth
- `GET /api/announcements` — Fetch active public municipal advisories
- `POST /api/announcements` — Create announcement (Admin only)
- `POST /api/auth/login` — Department / Admin staff login (returns JWT)
- `GET /api/auth/me` — Fetch current logged-in user profile

---

## 🔒 Security & Best Practices

- **Password Hashing**: Stored using `bcryptjs` with salt rounds. Plaintext passwords are never stored or returned by the API.
- **JWT Authorization**: Role-based access control protecting staff and admin dashboard endpoints.
- **Department Data Isolation**: Department officers can only view and update complaints assigned to their jurisdiction.
- **Input Validation & Sanitization**: Strict file-type filtering for uploaded images (`jpg`, `jpeg`, `png`, `webp`) capped at 8MB.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
