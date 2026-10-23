# Technical Decisions (DECISIONS.md)

This document explains the simple technical choices and architecture decisions made while building the Smart User Activity Tracker system.

---

## 1. Tech Stack Choices

- **Backend: Node.js + Express**
  - Lightweight, easy to set up, and handles JSON APIs quickly.
- **Database: MongoDB (Mongoose)**
  - Documents have flexible structures. Since each activity can have different metadata (`meta`), MongoDB stores it naturally.
- **Frontend: React + Vite**
  - Fast development, instant reload, and simple component-based structure.
- **Authentication: JWT (JSON Web Tokens)**
  - Stateless authentication. The token stores the user ID, so the server does not need session storage.

---

## 2. Custom Rate Limiting (No External Libraries)

- **The Rule:** Maximum 5 actions per 10 seconds per user.
- **Decision:** As required by the guidelines, no third-party rate-limiting packages (like `express-rate-limit`) were used.
- **How it works:**
  - Before saving an action, we count how many actions this user created in the last 10 seconds:
    ```javascript
    const windowStart = new Date(Date.now() - 10000);
    const count = await ActivityLog.countDocuments({
      userId,
      createdAt: { $gte: windowStart }
    });
    ```
  - If `count >= 5`, the server immediately returns HTTP 429 (Rate limit exceeded).
  - On the frontend, action buttons are disabled with a 10-second countdown timer.

---

## 3. Replay Protection Logic

- **The Rules:**
  1. Reject duplicate action if sent twice within 3 seconds by the same user.
  2. Reject action if the client's time is more than 30 seconds away from the server time.
- **Decision:**
  - **Clock Skew Check:** We compare `Math.abs(serverTime - clientTime)`. If the difference is greater than 30 seconds, it is rejected with HTTP 400. This prevents attackers from reusing old recorded requests.
  - **Duplicate Check:** We check MongoDB for the same user and same action in the last 3 seconds. If found, it is rejected with HTTP 409. This prevents double-clicks or automated spamming.

---

## 4. Analytics & Stats (No Analytics Libraries)

- **The Requirement:** Total actions, most common action, most active user, and actions per minute for the last 10 minutes.
- **Decision:**
  - We used native MongoDB aggregation pipelines (`$group`, `$sort`, `$limit`, `$dateTrunc`).
  - Independent database queries are executed in parallel using `Promise.all()` to keep response times fast.
  - **Zero-filling:** For the 10-minute chart, if some minutes have 0 actions, MongoDB does not return them. We fill in missing minutes in JavaScript with `count: 0` so the bar chart always shows a continuous 10-minute timeline.

---

## 5. Suspicious Activity Detection

- **The Rules:**
  1. Sent more than 20 actions in 1 minute.
  2. Used more than 2 distinct IP addresses in 5 minutes.
- **Decision:**
  - Grouped by `userId` and filtered with count thresholds using MongoDB aggregation `$match` and `$addToSet`.
  - IP simulation is supported so reviewers can test multi-IP detection easily from the frontend simulator without needing a proxy.

---

## 6. Frontend Design Decisions

- **Simple & Clean UI:**
  - Used clean solid colors (`#2563eb` blue, `#16a34a` green, `#dc2626` red) instead of heavy gradients or complex frameworks.
  - Built to be straightforward, readable, and easy to grade.
- **Auto-Refresh:**
  - The Analytics page automatically polls every 5 seconds with a toggle to pause/resume.
- **Direct Feedback:**
  - The simulator has a live feed showing HTTP status, latency in milliseconds, and clock drift.
