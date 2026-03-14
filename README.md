Live demo🌍:https://my-project-vzmd.vercel.app
# Investment Tracker 💰

A full-stack web application to manage and track personal investments.  
This application allows users to add, view, update, and delete investment records using a simple web interface.

---

## 🚀 Features

- Add new investments
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
