# Friend Connect Platform 🚀
### Random Friend Voice Calling, Geo-Location Events & Ticketing, Celebrity Calling, Organization Portal, Helpdesk & Super Admin

A modern, high-concurrency multi-platform ecosystem with real-time WebRTC audio calling, geo-spatial discovery, and role-based workflows.

---

## 📁 Repository Architecture

```text
Friend App/
├── backend/                  # Node.js + TypeScript + Express + Socket.io + WebRTC Signaling
│   ├── src/
│   │   ├── types/            # Domain models (Users, Calls, Events, Tickets, Support)
│   │   ├── db/               # In-memory store (seeds demo users, orgs, celebs, events)
│   │   ├── services/         # Matchmaker, WebRTC signaling, Events/Geo, Celebs, Support, Admin
│   │   ├── routes/           # REST API endpoints (/api/auth, /api/events, /api/celebrities, etc.)
│   │   ├── test/             # Automated test suite (19 integration tests)
│   │   └── server.ts         # Server bootstrap, Socket.io real-time engine
│   └── package.json
│
├── web/                      # React 18 + Vite + Tailwind CSS Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Global navigation, demo role switcher, VIP pass toggle
│   │   │   ├── RandomCallView.tsx    # 1-on-1 WebRTC audio call UI with skip/mute/wave
│   │   │   ├── EventsView.tsx        # Geo-aware event discovery & QR ticket booking
│   │   │   ├── CelebrityView.tsx     # Celebrity media feed & premium call routing
│   │   │   ├── SupportView.tsx       # Helpdesk live chat & in-app audio call
│   │   │   ├── OrganizationView.tsx  # Event creation & Gate QR scanner check-in
│   │   │   └── AdminView.tsx         # Super Admin governance, user banning, stats
│   │   └── App.tsx
│   └── package.json
│
├── mobile-android/           # Native Android (Kotlin + Jetpack Compose)
│   └── app/src/main/
│       ├── AndroidManifest.xml       # Audio, Telecom & Foreground service permissions
│       └── java/.../nativeapp/       # MatchmakingManager & Jetpack Compose UI
│
├── mobile-ios/               # Native iOS (Swift + SwiftUI + CallKit)
│   └── FriendApp/
│       ├── Info.plist                # VoIP Background modes & Mic/Camera permissions
│       ├── CallKitManager.swift      # Native Apple CallKit lockscreen call integration
│       └── ContentView.swift         # SwiftUI multi-tab application
│
├── docker-compose.yml        # PostgreSQL (PostGIS) + Redis 7 services
└── README.md
```

---

## ⚡ Quick Start

### 1. Run the Backend & Signaling Engine
```bash
cd backend
npm install
npm run dev
```
The server will start at `http://localhost:4000`.

To run the automated integration test suite:
```bash
npm run test:integration
```
*(Runs 19 end-to-end tests covering Auth, Matchmaking, Geo-Events, Ticketing, Celeb Gating, Support & Admin).*

### 2. Run the Web Application
```bash
cd web
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌟 Key Functional Features

1. **Random Friend Voice Call**:
   - One-click matchmaking algorithm pairs online users into a private WebRTC audio channel.
   - Privacy preserved: No phone numbers or real-names shared during random calls.
   - "Next Friend" (Skip) button seamlessly rotates to the next available user.
2. **Geo-Location Events & Ticketing**:
   - Filter events by GPS coordinates and radius (e.g., 10km, 25km, 50km).
   - Instant ticket purchasing with unique dynamic QR code token (`TKT-XXXXXXXX`).
   - Organization event gate check-in tool to validate and admit attendees.
3. **Celebrities & Premium Calling**:
   - Verified celebrity profiles with photo/video feeds.
   - Per-minute rate cards (Audio / Video).
   - Premium pass access control: Non-premium users are prompted to upgrade before initiating calls.
4. **Unified Customer Support**:
   - Instant live messaging ticket desk.
   - Direct In-app Voice Call to support agents.
5. **Super Admin Control Center**:
   - Live metrics (active voice calls, matchmaking queue, ticket revenue).
   - User moderation (Ban/Unban, Grant VIP, Verify KYC badge).
