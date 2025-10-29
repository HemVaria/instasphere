# 📸 Instasphere
### *Your Visual Universe, Connected*
[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://instasphere-final.vercel.app)
[![YouTube](https://img.shields.io/badge/YouTube-Watch%20Demo-red?style=for-the-badge&logo=youtube)](https://youtu.be/Md2WGlUOvKs)


[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

**Capture. Share. Connect.**  
Instasphere is a sleek, image-first social network where moments come alive — post photos, short videos, follow friends, and explore trending content in real time.

**→ [🚀 Live Demo](https://instasphere-final.vercel.app)**  
[📹 Watch Video](https://youtu.be/Md2WGlUOvKs)
**→ [🐛 Report Bug](https://github.com/HemVaria/instasphere/issues)**  
**→ [✨ Request Feature](https://github.com/HemVaria/instasphere/issues)**  

---

## 📖 Table of Contents
- [🎯 What is Instasphere?](#-what-is-instasphere)
- [✨ Features](#-features)
- [🎥 Demo](#-demo)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚡ Quick Start](#-quick-start)
- [📱 Screenshots](#-screenshots)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [👨‍💻 Author](#-author)
- [📄 License](#-license)

---

## 🎯 What is Instasphere?

You're scrolling through life — a sunset, a coffee, a laugh with friends — and you want to **share it instantly**, beautifully, with the world.

**Enter Instasphere** — a modern, responsive photo-sharing app that feels like Instagram, built for speed, style, and real connection.

No clutter. Just your story, amplified.

### Perfect For:
- 📸 Daily photo dumps
- 🎞️ Short video reels
- 🔥 Trending hashtag challenges
- 👥 Building a creative community
- 🌍 Exploring global visual stories

---

## ✨ Features

### 📤 Fast Media Uploads  
Drag, drop, or pick — images and short videos upload in **under 2 seconds** with progress tracking.

### ❤️ Like & Comment  
React with a heart, leave a comment — all updates sync **in real time**.

### 👤 Profile Pages  
Customizable profiles with bio, follower count, and grid/post list views.

### ➡️ Follow & Feed  
Follow your favorite creators — get a personalized, chronological feed of their latest posts.

### 🔍 Search & Discover  
Search users, hashtags, or explore trending content in the **Explore tab**.

### 💬 Real-Time Interactions  
New likes, comments, and follows appear **instantly** via WebSockets.

### 📱 Fully Responsive  
Looks stunning on mobile, tablet, and desktop — optimized touch gestures included.

### 🎥 Optional Reels  
Short video playback with mute/unmute, auto-loop, and full-screen mode.

---

## 🎥 Demo

### 🌐 Live on Vercel
[https://instasphere-final.vercel.app](https://instasphere-final.vercel.app)

> Try it: Sign up with email or Google, upload a photo, follow someone, and watch the magic.

---

## 🛠️ Tech Stack

**Frontend:** Next.js 14 (App Router), React, TypeScript  
**Styling:** Tailwind CSS  
**State Management:** React Context + Custom Hooks  
**Backend:** Next.js API Routes (Serverless)  
**Database:** PostgreSQL + Prisma ORM  
**Authentication:** NextAuth.js (Email + Google OAuth)  
**Image Storage:** Cloudinary (CDN + Transformations)  
**Realtime:** Pusher or Server-Sent Events (SSE)  
**Deployment:** Vercel (Auto CI/CD)  
**Testing:** Jest + React Testing Library  
**Linting/Formatting:** ESLint + Prettier  

**Built with:**  
![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=next.js)  
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)  
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)  
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)  
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)  
![NextAuth](https://img.shields.io/badge/NextAuth-000?style=for-the-badge&logo=nextdotjs)  
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary)  
![Vercel](https://img.shields.io/badge/Vercel-000?style=for-the-badge&logo=vercel)

---

## ⚡ Quick Start

### 🧩 Clone & Install
```bash
git clone https://github.com/HemVaria/instasphere.git
cd instasphere
npm install
```

### ⚙️ Environment Setup
```bash
cp .env.example .env.local
```
Then fill in:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/instasphere"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Pusher (for real-time)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
```

### 🏃 Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📱 Screenshots
*(Add these later by uploading to `/public/screenshots` and linking below)*

![Feed](/screenshots/feed.png)
![Upload](/screenshots/upload.png)
![Profile](/screenshots/profile.png)
![Explore](/screenshots/explore.png)

---

## 🗺️ Roadmap

### ✅ Current (v1.0)
- User auth (Email + Google)
- Post creation (image + caption)
- Like & comment system
- Follow/unfollow
- Personalized feed
- Profile pages
- Search (users & hashtags)
- Responsive UI

### 🚀 Coming Soon (v2.0)
- Short video uploads (Reels)
- Stories (24-hour posts)
- Direct messaging
- Notifications center
- Dark mode toggle
- Hashtag trends page
- Post editing & deletion
- Bookmark saves

### 🔮 Future Vision
- AI caption suggestions
- Advanced image filters
- Live streaming
- Monetization for creators
- Mobile apps (React Native)

---

## 🤝 Contributing

We ❤️ open source!

**Found a bug?** → [Open an issue](https://github.com/HemVaria/instasphere/issues)  
**Have an idea?** → [Request a feature](https://github.com/HemVaria/instasphere/issues)  
**Want to code?** → Fork the repo and make a pull request!

### Steps:
1. Fork the repo
2. Create branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add image compression"`
4. Push & open PR

---

## 👨‍💻 Author

**Hem Varia**  
🚀 Full-Stack Developer | UI/UX Enthusiast | Open Source Lover  

[🌐 Portfolio](#) • [🐙 GitHub](https://github.com/HemVaria) • [💼 LinkedIn](#) • [📸 Instagram](#)

---

## 📄 License

Distributed under the **MIT License**.  
See [`LICENSE`](LICENSE) for more information.

---

**Instasphere** — *Where every pixel tells a story.*  
Made with ☕, 🌙, and a passion for beautiful code.
