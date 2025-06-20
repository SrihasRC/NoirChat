# 📅 Full-Stack Chat App – Milestone Checklist

> ⚙️ Tech Stack: Next.js (App Router) + TailwindCSS + Shadcn/UI + TypeScript + Socket.IO + Node.js (Express) + JWT + bcrypt + MongoDB

---

## ✅ Week 1 – Project Setup & Authentication

### 🎯 Goal: Project base ready with working custom JWT + bcrypt auth system.

- [ ] Initialize monorepo project (`chat-app/`)
  - [ ] Create `frontend/` (Next.js + TailwindCSS + Shadcn/UI)
  - [ ] Create `backend/` (Node.js + Express + Prisma)
  - [ ] Set up `docker-compose.yml` to run both together
- [ ] Setup MongoDB Atlas
- [ ] Configure Mongoose + basic `User` model
- [ ] Implement backend auth:
  - [ ] `/signup` route: hash password, store user
  - [ ] `/login` route: verify, return access + refresh JWT
  - [ ] `/refresh` route: rotate token
- [ ] Protect API routes with `verifyToken` middleware
- [ ] Basic frontend login/signup forms (React Hook Form + Zod)
- [ ] Store access token in `localStorage` (or cookie)

---

## ✅ Week 2 – Real-Time Chat (Socket.IO)

### 🎯 Goal: Users can join and chat in real-time.

- [ ] Setup Socket.IO server in backend
- [ ] Setup `socket.io-client` in frontend
- [ ] On connect: log `socket.id`
- [ ] Create a global room or `#general`
- [ ] Implement message send/receive
- [ ] Auto-scroll chat on new message
- [ ] Show message timestamp + sender
- [ ] Display current user messages on right, others on left

---

## ✅ Week 3 – Private DMs, Rooms & Typing Indicators

### 🎯 Goal: Support private conversations and room chat logic.

- [ ] Create backend models: `Room`, `Message`, `Membership`
- [ ] Allow user-to-user private messages (DM room logic)
- [ ] Implement room joining via `socket.join(roomId)`
- [ ] Sidebar showing:
  - [ ] All chat rooms
  - [ ] Recent DMs
- [ ] Show typing indicator (debounced emit)
- [ ] Handle online/offline user indicators

---

## ✅ Week 4 – UI Polish & Media Support

### 🎯 Goal: Beautiful, responsive UI with basic UX features.

- [ ] Integrate `Shadcn/UI` components
- [ ] Add theme switcher (dark/light mode)
- [ ] Add emoji picker to input box
- [ ] Add toast notifications for:
  - [ ] Errors
  - [ ] User joined/left
- [ ] Add file/image upload (Cloudinary / UploadThing)
- [ ] Show image previews in chat
- [ ] Optimize for mobile (responsive layout)

---

## ✅ Week 5 – Social Login (Google)

### 🎯 Goal: Users can log in with Google alongside email/password.

- [ ] Set up Google OAuth app (Console)
- [ ] Add `passport-google-oauth20` to backend
- [ ] Create `/auth/google` and `/auth/google/callback` routes
- [ ] On login:
  - [ ] Create user if not exists
  - [ ] Return JWT token (same flow as local login)
- [ ] Add Google login button on frontend

---

## ✅ Week 6 – Message Encryption + AI Smart Replies

### 🎯 Goal: Secure chats and add AI-assisted suggestions.

- [ ] Use `CryptoJS` to encrypt messages before sending
- [ ] Decrypt messages on frontend
- [ ] Messages in DB are encrypted
- [ ] Add OpenAI API:
  - [ ] Suggest 2–3 smart replies based on context
  - [ ] Optionally summarize chat thread

---

## ✅ Week 7 – Deployment, SEO, and Final Touches

### 🎯 Goal: Make it production-ready and polish final bits.

- [ ] Deploy backend (Render / Railway)
- [ ] Deploy frontend (Vercel)
- [ ] Connect domains / env vars properly
- [ ] Add favicon, meta tags, title, and SEO basics
- [ ] Create `README.md` with:
  - [ ] Project description
  - [ ] Features list
  - [ ] Tech stack
  - [ ] Demo GIFs
  - [ ] Live URL
- [ ] Add `/progress.md` to journal learnings

---

## 🔚 Bonus / Stretch Goals

- [ ] Add group chat creation
- [ ] Add PWA support for mobile
- [ ] Add command palette (`Cmd + K`) for navigating/chat commands
- [ ] Add voice/video calling via WebRTC
- [ ] Add message reactions (like Discord/Slack)

---

## 🏁 Final Deliverables

- ✅ Live Demo
- ✅ Clean, documented GitHub repo
- ✅ Linked in Portfolio
- ✅ (Optional) Blog post explaining what you built

---

> Build slow. Build strong. Build proudly. 🚀
