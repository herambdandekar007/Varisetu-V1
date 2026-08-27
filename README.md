# VariSetu

VariSetu is a polished React frontend for AI-powered crowd mobility and resource coordination during the Wari pilgrimage. It presents a single product story: predict, prevent, protect.

## Highlights

- Pilgrim dashboard with live status, route guidance, weather, health metrics, alerts and next halt
- AI crowd watch with density map, forecast confidence, zone risk cards and prevention actions
- Smart navigation that compares safer and faster route options
- Resource readiness for water, food, medical support, sanitation and rest shelters
- Emergency command centre with SOS queue, dispatch map and response timeline
- Operational admin console and task-focused volunteer dashboard
- Family tracking and device-local accessibility preferences

## Project Structure

```text
src/
├── components/
│   ├── cards/           # Reusable KPI and resource cards
│   ├── charts/          # Recharts visualizations
│   ├── common/          # Buttons, badges, headers and timelines
│   ├── layout/          # Shared application shell
│   ├── maps/            # React Leaflet map experience
│   ├── navbar/          # Top navigation
│   ├── notifications/   # Notification drawer
│   └── sidebar/         # Desktop and mobile navigation
├── context/             # Cross-screen UI state
├── data/                # Realistic local mock data
├── hooks/               # Reusable React hooks
├── pages/               # Landing and role-specific product screens
├── services/            # API integration boundaries
├── utils/               # Small shared utilities
├── App.jsx
├── index.css
└── main.jsx
```

## Packages

React, Vite, Tailwind CSS, React Router, Framer Motion, React Leaflet, Leaflet, Recharts, Heroicons, React Icons, Axios, React Hot Toast, and Supabase.

## Installation

1. Install Node.js 18 or later.
2. In this project directory, run `npm install`.
3. Copy `.env.example` to `.env` and populate any endpoint credentials when available.
4. Start the app with `npm run dev`.
5. Build for production with `npm run build`.

## API Integration Points

`src/services/api.js` contains Axios service boundaries that can replace mock data progressively:

| Product area | Suggested endpoint |
| --- | --- |
| Crowd prediction | `GET /crowd/forecast`, `GET /crowd/zones` |
| Route navigation | `GET /navigation/routes`, `POST /navigation/recommendations` |
| Resource inventory | `GET /resources`, `GET /resources/alerts`, `PATCH /resources/:id` |
| Emergency response | `GET /emergencies`, `POST /emergencies/sos`, `PATCH /emergencies/:id` |
| Family tracking | `POST /tracking/groups`, `GET /tracking/groups/:id/locations` |
| Volunteer operations | `GET /volunteers/me/tasks`, `PATCH /volunteers/tasks/:id` |
| Reporting | `GET /analytics/summary`, `GET /reports/sitrep` |

