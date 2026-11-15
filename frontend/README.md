# MultiPost — Premium Multi-Platform Publishing Dashboard

> *"One message. Five platforms. Zero repetitive work."*

MultiPost is a modern, high-performance SaaS frontend dashboard engineered for the **Automated Multi-Platform Posting System**. It enables content creators, developer advocates, and marketing teams to compose and broadcast announcements simultaneously across five major social and developer platforms:

- 🦋 **Bluesky** (AT Protocol / XRPC)
- 🐘 **Mastodon** (Fediverse REST API)
- 👩‍💻 **Dev.to** (Forem Articles API)
- ✈️ **Telegram** (Bot API HTML formatting)
- 🎮 **Discord** (Embed Webhooks)

---

## ⚡ Key Highlights & Architecture

- **Real-Time Backend Telemetry**: Dynamically interrogates `GET /health` to display live server status, protocol readiness, and active platform integrations without hardcoding or mock states.
- **Client & Server Validation Mirroring**: Instant character countdown (`max 200 chars`) and regex-based RFC 1123 URL validation, matching the backend Pydantic contract before network dispatch.
- **Per-Platform Fault Isolation**: Individual platform failures are caught, classified, and isolated so successful publications are never hidden.
- **Smart Accessibility Badging**: Respects public access verification (`true` = Publicly accessible, `false` = Gated/Private, `null` = Unknown/Not available; `null` is never conflated with `false`).
- **One-Click Post Inspection**: Direct external links to published URLs in new browser tabs.
- **Local Browser History**: Session and historical dispatch records saved in `localStorage` with deep inspect modals, filter tabs, and cache controls.
- **Zero Exposed Secrets**: Authentication tokens, bot secrets, and webhook URLs reside exclusively in backend environment variables.
- **Dark Mode SaaS Aesthetic**: Styled with custom charcoal/navy tokens (`#0B0F19`, `#111827`, `#162032`), subtle borders, glowing accents, Inter typography, and responsive layouts.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite |
| **Styling** | Tailwind CSS v3.4 + Vanilla CSS Design Tokens |
| **Icons** | Lucide React + Custom SVG Brand Badges |
| **Networking** | Standard Web Fetch API with AbortController timeouts |
| **State Management** | React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) |
| **Storage** | Browser `localStorage` (max 50 persistent dispatch records) |

---

## 📁 Project Structure

```
frontend/
├── .env                  # Active Vite environment variables
├── .env.example          # Template environment file
├── index.html            # HTML entry point with dark mode & SEO meta
├── package.json          # Dependencies and npm scripts
├── postcss.config.js     # PostCSS configuration for Tailwind
├── tailwind.config.js    # Custom brand colors and design tokens
├── vite.config.js        # Vite config running on port 5174
├── dist/                 # Production optimized build output
└── src/
    ├── main.jsx          # React DOM root mounting
    ├── App.jsx           # App shell, tab router & health polling
    ├── index.css         # Inter font, Tailwind directives, custom scrollbars
    ├── components/
    │   ├── Header.jsx          # Live connection badge, current date, status
    │   ├── Sidebar.jsx         # Navigation drawer, brand logo & quick status
    │   ├── PlatformCard.jsx    # Individual platform configuration card
    │   ├── PlatformIcon.jsx    # Vector brand icons for 5 platforms
    │   ├── PlatformResult.jsx  # Rich per-platform result card with URL link
    │   ├── PostComposer.jsx    # Textarea, char counter, URL pill, submit button
    │   └── ResultsSummary.jsx  # Summary banner, dynamic stat cards, result grid
    ├── pages/
    │   ├── Dashboard.jsx       # Overview, platform pipelines & quick composer
    │   ├── Compose.jsx         # Dedicated compose workspace with guidelines
    │   ├── History.jsx         # Local browser history with inspect modal
    │   ├── Integrations.jsx    # Detailed platform specs & protocols
    │   └── Settings.jsx        # API Base URL override, diagnostics & cache purge
    ├── services/
    │   └── api.js              # Fetch client for GET /health and POST /posting
    └── utils/
        ├── platforms.js        # Platform metadata, protocols & visual badges
        ├── storage.js          # LocalStorage CRUD utilities with error guards
        └── urlValidator.js     # RFC-compliant URL extraction and validation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.10+ with active virtual environment for backend
- **Backend Running**: The FastAPI server running on `http://localhost:4000`

---

### 2. Backend Startup (Port 4000)
From the repository root:
```bash
# Activate your Python virtual environment
source .venv/bin/activate

# Start the FastAPI server with reload enabled
uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
```
Verify backend health in another terminal:
```bash
curl http://localhost:4000/health
# {"status":"ok","platforms_configured":{"bluesky":true,"mastodon":true,"devto":true,"telegram":true,"discord":true},"version":"1.0.0"}
```

---

### 3. Frontend Installation & Startup (Port 5174)
From the `frontend` directory:
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The application will be accessible at:
👉 **`http://localhost:5174`**

*(Note: Port 5174 is configured in `vite.config.js` to ensure no conflict with background processes.)*

---

### 4. Production Build
To create an optimized production bundle:
```bash
npm run build
```
To preview the production bundle locally:
```bash
npm run preview
```

---

## ⚙️ Environment Configuration

The frontend requires only the backend API base URL:

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:4000
```

> **Security Note:** Platform API keys, access tokens, and webhook secrets must **never** be placed in frontend environment files. They are managed solely in the root `.env` file for the FastAPI backend.

---

## 📡 API Contract

### 1. Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "platforms_configured": {
    "bluesky": true,
    "mastodon": true,
    "devto": true,
    "telegram": true,
    "discord": true
  },
  "version": "1.0.0"
}
```

### 2. Post Dispatch
- **Endpoint**: `POST /posting`
- **Request Body**:
```json
{
  "message": "Excited to launch our platform update! Learn more at https://example.com"
}
```
- **Constraints**:
  - Message length $\le 200$ characters.
  - Exactly one valid `http://` or `https://` URL required.
- **Response**:
```json
{
  "success": true,
  "summary": {
    "total": 5,
    "successful": 5,
    "failed": 0
  },
  "results": [
    {
      "platform": "bluesky",
      "status": "success",
      "posted_url": "https://bsky.app/profile/user.bsky.social/post/...",
      "public_access": true,
      "date": "2026-11-15",
      "time": "10:14:00",
      "error": null
    }
  ]
}
```

---

## 🛡️ Error Handling Matrix

| Error Scenario | Frontend Behavior |
|---|---|
| **Backend Offline** | Header changes to amber `Offline` badge; composer displays alert banner; Retry button allows manual reconnect. |
| **Missing / Multiple URLs** | Submit button disabled; URL badge dynamically turns red/amber with descriptive message. |
| **Exceeding 200 Chars** | Textarea border glows rose; character counter highlights in bold red; submit blocked. |
| **HTTP 422 Unprocessable** | Displays bulleted list of backend Pydantic validation errors above submit button. |
| **Partial Platform Failure** | Summary displays count (e.g. `4 out of 5 platforms`); failed platforms show exact error string while successful platforms display verified URLs. |
