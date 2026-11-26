# CineBook - Movie Ticket Booking System

A full-stack Movie Ticket Booking Web Application built with **React.js (Vite)**, **Node.js**, **Express.js**, and **MySQL**, featuring a modern dark cinema UI (red, black, and white theme), real-time seat selection, transactional double-booking prevention, booking cancellation with seat release, and a JWT-protected Admin Dashboard.

---

## Application Features

- **Home Page**: Featured movies hero banner, Now Showing & Upcoming sections, quick search bar.
- **Movies Page**: Browse all movies from MySQL with search by title and filters by genre, language, and status.
- **Movie Details & Showtimes**: View movie details, filter showtimes by city and date, and choose from Hyderabad theatres (AMB Cinemas, PVR Cinemas, INOX, Asian Cinemas).
- **Interactive Seat Selection**: Visual cinema layout (Green = Available, Blue = Selected, Red = Booked), multi-seat selection, dynamic ticket price calculation.
- **Transactional Booking**: Row-level locking (`SELECT ... FOR UPDATE`) + database unique constraints prevent simultaneous double-booking; generates a unique booking reference (e.g., `CB-XXXXXX`).
- **My Bookings & Cancellation**: Look up bookings by reference number or email address, and cancel bookings before showtime to automatically release seats.
- **Admin Dashboard**: Secure JWT-authenticated admin panel to add/update/delete movies, add theatres, schedule showtimes, view all bookings, and monitor total bookings & revenue.

---

## Technology Stack

- **Frontend**: React.js, Vite, HTML5, CSS3, JavaScript, Axios, React Router DOM
- **Backend**: Node.js, Express.js, MySQL2, dotenv, CORS, bcryptjs, jsonwebtoken
- **Database**: MySQL 8.0 (`movie_booking_db`)
- **DevOps / Cloud**: Docker, Docker Compose, Jenkins CI/CD, AWS EC2, AWS RDS MySQL

---

## Project Folder Structure

```text
movie-ticket-booking-app/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── schema.sql
├── docker-compose.yml
├── Jenkinsfile
├── .env.example
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** v18+ and **npm**
- **MySQL 8.0** (for local non-Docker setup)
- **Docker** and **Docker Compose** (for containerized setup)

---

## Sample Admin Credentials (Local Development)

- **Username**: `admin`
- **Password**: `admin123`

> Change the admin password and `JWT_SECRET` before deploying to production.

---

## Local Setup (Without Docker)

### 1. MySQL Database Setup
```bash
mysql -u root -p < database/schema.sql
```
This creates `movie_booking_db`, all 8 tables (`movies`, `theatres`, `screens`, `shows`, `seats`, `bookings`, `booking_seats`, `admin`), and inserts 12 sample Indian movies, 4 Hyderabad theatres, 5 screens (50 seats each), and sample showtimes.

### 2. Backend Configuration
```bash
cd backend
cp ../.env.example .env
# Edit .env with your local MySQL username/password and DB_HOST=localhost
npm install
npm test
npm run dev
```
The backend API runs at `http://localhost:5000`.

### 3. Frontend Configuration
```bash
cd frontend
npm install
npm run dev
```
The frontend runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:5000`.

---

## Docker & Docker Compose Setup

Run the entire stack (MySQL + Backend + Frontend Nginx) with one command:

```bash
cp .env.example .env
docker compose up -d --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api/health`
- **MySQL**: `localhost:3306` (persisted via Docker volume `cinebook_mysql_data`)

To stop services:
```bash
docker compose down
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `DB_HOST` | MySQL host (`localhost`, `mysql`, or AWS RDS endpoint) | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `cinebook_user` |
| `DB_PASSWORD` | MySQL password | `cinebook_pass123` |
| `DB_NAME` | Database name | `movie_booking_db` |
| `DB_SSL` | Set `true` for AWS RDS SSL connections | `false` |
| `JWT_SECRET` | Secret key for Admin JWT signing | `cinebook_super_secret...` |
| `VITE_API_URL` | Frontend API base URL | `/api` |

---

## API Documentation

### Health
- `GET /api/health` — Checks API and MySQL connectivity.

### Movies
- `GET /api/movies?search=&genre=&language=&status=` — List/filter movies.
- `GET /api/movies/:id` — Movie details + available theatres & showtimes.
- `POST /api/movies` *(Admin)* — Add a movie.
- `PUT /api/movies/:id` *(Admin)* — Update a movie.
- `DELETE /api/movies/:id` *(Admin)* — Delete a movie.

### Theatres
- `GET /api/theatres?city=` — List theatres and their screens.
- `GET /api/theatres/:id` — Theatre details.
- `POST /api/theatres` *(Admin)* — Add a theatre (auto-provisions Screen 1 with 50 seats).

### Showtimes & Seats
- `GET /api/shows` — List all shows.
- `GET /api/shows/search?movieId=&city=&theatreId=&date=` — Search shows.
- `GET /api/shows/:id` — Show details.
- `GET /api/shows/:id/seats` — Live seat map & availability for a show.
- `POST /api/shows` *(Admin)* — Create a showtime.

### Bookings
- `POST /api/bookings` — Create booking (transactional + row-level lock).
- `GET /api/bookings/:reference` — Get booking by reference (e.g., `CB-DEMO01`).
- `GET /api/bookings?email=user@example.com` — Get bookings by customer email.
- `PUT /api/bookings/:reference/cancel` — Cancel booking before showtime & release seats.

### Admin
- `POST /api/admin/login` — Authenticate admin and receive JWT token.
- `GET /api/admin/dashboard` *(Admin)* — Total movies, theatres, shows, bookings, revenue.
- `GET /api/admin/bookings` *(Admin)* — View all bookings.

---

## AWS Deployment & Jenkins CI/CD Guide

1. **AWS RDS MySQL**:
   - Launch a MySQL 8.0 RDS instance (`movie_booking_db`) and import `database/schema.sql`.
   - Set `DB_HOST=<your-rds-endpoint>`, `DB_SSL=true`, and your RDS credentials in `.env` on EC2.
2. **AWS EC2**:
   - Launch an Amazon Linux / Ubuntu EC2 instance with Docker & Docker Compose installed.
   - Open inbound ports `80`/`3000` (HTTP) and `5000` (API) in the Security Group.
3. **Jenkins CI/CD**:
   - Configure Jenkins credentials: `docker-hub-credentials` (Username/Password) and `ec2-ssh-key` (SSH private key).
   - Update `EC2_HOST` in `Jenkinsfile` and trigger the pipeline to build, test, push Docker images, deploy to EC2, and verify health.
