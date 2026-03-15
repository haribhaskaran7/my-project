Demo video:🎥 Project Demo Video
Watch the working demo of the FinCal Financial Calculator here:

https://youtu.be/r9LNzLDbBJM?si=nodtXjeq3H8gaLcg

# InvestQuest 💰

A modern, full-stack investment calculator and tracker with multi-user support, dark theme, and real-time calculations.

---

## 🚀 Features

- **Investment Analyser**: Calculate returns for various assets (stocks, mutual funds, FD, etc.)
- **SIP Growth Calculator**: Plan systematic investment plans
- **Goal Planner**: Set financial goals and see required investments
- **Inflation Impact**: See how inflation affects your savings
- **Risk Profile Assessment**: Evaluate your risk tolerance
- **Compound Interest Calculator**: With EMI calculations
- **Multi-User Accounts**: Save multiple user profiles with persistent data
- **Dark Theme**: Modern UI with animated particle background
- **Responsive Design**: Works on desktop and mobile

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite, Recharts for visualizations
- **Backend**: Node.js + Express
- **Styling**: Custom CSS with dark theme
- **Storage**: localStorage for user data persistence

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Clone the Repository
```bash
git clone https://github.com/haribhaskaran7/my-project.git
cd my-project
```

### Backend Setup
```bash
cd backend
npm install
npm start
```
Backend will run on `http://localhost:5000`

### Frontend Setup
```bash
cd my-app
npm install
npm run dev
```
Frontend will run on `http://localhost:5184` (or similar port)

---

## 🎯 Usage

1. Open the frontend URL in your browser
2. Sign up with an email and password
3. Use the calculators to analyze investments
4. Your data is saved locally and persists across sessions
5. Switch between multiple accounts if needed

**Important**: Always use the same frontend URL to maintain data persistence. Bookmark the URL after first run.

---

## 🔧 API Endpoints

- `GET /` - Health check
- `POST /calculate` - Calculate future value (amount, rate, years)

---

## 📱 Screenshots

*(Add screenshots here)*

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

---

## 📄 License

MIT License

---

## 👨‍💻 Author

Haribhaskaran
- View all investments
- Update investment details
- Delete investments
- Responsive frontend interface
- REST API backend
- MongoDB database storage

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

---

## 📁 Project Structure

```
investment/
│
├── backend/
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── my-app/
│   ├── node_modules/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/haribhaskaran7/my-project.git
cd my-project
```

### 2️⃣ Install backend dependencies

```bash
cd backend
npm install
```

### 3️⃣ Install frontend dependencies

```bash
cd ../my-app
npm install
```

---

## ▶️ Running the Application

### Start Backend Server

```bash
cd backend
npm start
```

Backend will run on:

```
http://localhost:5000
```

---

### Start Frontend

```bash
cd my-app
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|------|------|------|
| GET | /investments | Get all investments |
| POST | /investments | Add new investment |
| PUT | /investments/:id | Update investment |
| DELETE | /investments/:id | Delete investment |

---

## 📷 Screenshots

You can add screenshots of your application here.

Example:

```
screenshots/
 ├ dashboard.png
 └ add-investment.png
```

---

## 📌 Future Improvements

- User authentication (JWT)
- Investment analytics dashboard
- Graphs and charts for profit tracking
- Cloud deployment
- Mobile responsive design improvements

---

## 👨‍💻 Author

**Hari Bhaskaran**

GitHub:  
https://github.com/haribhaskaran7

---

## 📜 License

This project is open-source and available under the MIT License.
