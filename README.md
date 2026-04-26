# Perkline - Davis Perks Redefined

Perkline is a production-grade web application designed for students and residents of Davis, CA to discover, track, and claim local deals in real-time. 

## 🚀 Vision
To create a seamless, high-performance bridge between local Davis businesses and the community, rewards those who support local through a gamified savings experience.

## ✨ Key Features
- **Real-Time Discovery**: Instant access to live deals from local favorites like Woodstock's, Burgers & Brew, and Sophia's.
- **Dynamic Map View**: Interactive Leaflet-powered map to find deals nearest to you.
- **Identity & Personalization**: Full authentication via Google (Firebase), allowing users to track their personal lifetime savings.
- **Merchant Verification**: Real-time verification links to official merchant sources for every perk.
- **Premium Tier (Plus)**: Exclusive infrastructure for premium members to access priority rewards.

## 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Modern v4 layout architecture)
- **Animation**: Framer Motion (motion/react) for fluid UI transitions
- **Backend / Database**: Firebase (Firestore & Auth)
- **Maps**: React-Leaflet / OpenStreetMap
- **Icons**: Lucide React

## 📦 Project Structure
```text
/src
  /components  - Reusable UI atoms and layouts
  /hooks       - Custom business logic (Auth, Location, Deal Refresh)
  /lib         - Firebase configuration and initialized services
  /pages       - Top-level route views (Deals, Map, Plus, Profile)
  /data        - Mock data and type definitions
```

## 🛠 Setup & Installation

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment**
   - Create a `.env` file based on `.env.example`
   - Add your Firebase configuration keys.
4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📝 GitHub Workspace Requirements (Advanced Students)
- [x] README Documentation
- [x] Clean, modular code structure
- [x] Repository setup (commits history in sync)
- [x] Live demo integration
- [x] Public Accessibility

---
*Built with ❤️ in Davis, CA.*
