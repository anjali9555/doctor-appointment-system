# 🏥 Doctor Appointment System - Admin Panel

A comprehensive, full-stack admin dashboard built for managing doctors, users, appointments, and system operations efficiently. Designed as part of the MERN stack Doctor Appointment platform.

## 🚀 Features

- **Doctor Management:** Add new doctors, view detailed profiles, update information, toggle availability status, and remove doctors.
- **Appointment Tracking:** Monitor all scheduled appointments and view detailed appointment information.
- **User Management:** View registered user lists and detailed user activity.
- **Secure Authentication:** Role-based secure login and session handling.
- **Responsive Dashboard:** Clean layout with interactive sidebar navigation and dynamic data presentation.

## 🛠️ Tech Stack

- **Frontend:** React.js (Vite), Redux Toolkit (State Management), React Router
- **Styling:** CSS / Modern UI components
- **API Communication:** Axios for RESTful API integration
- **Backend Connectivity:** Connects with Node.js, Express.js, and MongoDB backend

## 📁 Project Structure

```text
admin-panel/
├── public/              # Static assets & icons
├── src/
│   ├── Api/             # Axios API configuration
│   ├── assets/          # Images and icons
│   ├── components/      # Reusable UI components & Layouts
│   ├── pages/           # Module pages (Doctors, Users, Appointments, Login)
│   ├── redux/           # Redux Slices and Async Thunk Actions
│   ├── App.jsx          # Main root component
│   └── main.jsx         # Application entry point
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration