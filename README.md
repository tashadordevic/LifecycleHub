# LifecycleHub

**Local-first CRM for solopreneurs and freelancers.**  

Your data stays on your machine. No cloud. No subscriptions. No vendor lock-in. Free forever.

![LifecycleHub Dashboard](lifecyclehub%20dashboard%20screenshot.png)
---

## Why LifecycleHub?

Most CRMs are built for enterprise teams with big budgets and bigger privacy concerns. LifecycleHub is built for the person working alone — the freelancer, the consultant, the one-person business.

- **Local-first** — Your data lives in a SQLite database on your computer. Nobody else can access it.
- **Open-source** — MIT licensed. No black boxes.
- **Free forever** — No subscriptions, no tiers, no hidden costs.
- **Linux native** — Built as a desktop app for Linux using Electron.

---

## Features

- **Dashboard** — Overview of your customer lifecycle, health distribution, and pipeline at a glance
- **Customer Management** — Add, edit, and track contacts with lifecycle stages and health scores
- **Lifecycle Stages** — Customizable stages (Onboarding, Adoption, Retention, Expansion, Risk)
- **Health Scoring** — Visual health indicators to identify at-risk customers
- **Signals & Activity** — Log customer interactions and track recent activity
- **Reports** — Summary views of your pipeline by stage, segment, and health
- **Integrations** — API connection support for CRM, Analytics, Support, and Messaging tools
- **Local SQLite storage** — All data stored locally via better-sqlite3, no cloud required

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Radix UI, Recharts
- **Desktop:** Electron 28
- **Storage:** SQLite via better-sqlite3 (local, no cloud)
- **Auth:** JWT (local only)
- **Build:** electron-builder → .deb package for Linux

---

## Installation

### Option 1: Download the .deb package (recommended)

Download the latest `.deb` release from the [Releases](https://github.com/tashadordevic/LifecycleHub/releases) page.

```bash
sudo dpkg -i lifecyclehub_1.0.0_amd64.deb
```

Then launch LifecycleHub from your application menu.

### Option 2: Run from source

**Requirements:** Node.js 18+, Yarn 1.22+

```bash
git clone https://github.com/tashadordevic/LifecycleHub.git
cd LifecycleHub/frontend
yarn install
./node_modules/.bin/electron-rebuild -f -w better-sqlite3
yarn electron-dev
```

---

## Building the .deb yourself

```bash
cd frontend
yarn install
./node_modules/.bin/electron-rebuild -f -w better-sqlite3
yarn build-electron
```

The `.deb` file will be in `frontend/dist-electron/`.

---

## Roadmap

- [ ] CSV import/export for contacts
- [ ] Real API integrations (HubSpot, Intercom, Zendesk, etc.)
- [ ] Notes and task management per customer
- [ ] Email logging via IMAP
- [ ] Dark/light theme toggle
- [ ] AppImage build for broader Linux support

---

## Support the project

LifecycleHub is free and open-source. If it saves you money on CRM subscriptions, consider buying me a coffee.

[![Ko-fi](https://img.shields.io/badge/Support%20on-Ko--fi-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/natashad)

---

## License

MIT © 2025 Natasha Dordevic
