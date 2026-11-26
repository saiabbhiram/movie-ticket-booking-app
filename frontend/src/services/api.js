import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token for Admin requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cinebook_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Movies
export const fetchMovies = (params = {}) => api.get('/movies', { params });
export const fetchMovieById = (id) => api.get(`/movies/${id}`);
export const createMovie = (data) => api.post('/movies', data);
export const updateMovie = (id, data) => api.put(`/movies/${id}`, data);
export const deleteMovie = (id) => api.delete(`/movies/${id}`);

// Theatres
export const fetchTheatres = (params = {}) => api.get('/theatres', { params });
export const fetchTheatreById = (id) => api.get(`/theatres/${id}`);
export const createTheatre = (data) => api.post('/theatres', data);

// Shows & Seats
export const fetchShows = () => api.get('/shows');
export const searchShows = (params = {}) => api.get('/shows/search', { params });
export const fetchShowById = (id) => api.get(`/shows/${id}`);
export const fetchShowSeats = (showId) => api.get(`/shows/${showId}/seats`);
export const createShow = (data) => api.post('/shows', data);

// Bookings
export const createBooking = (data) => api.post('/bookings', data);
export const fetchBookingByReference = (reference) => api.get(`/bookings/${encodeURIComponent(reference)}`);
export const fetchBookingsByEmail = (email) => api.get('/bookings', { params: { email } });
export const cancelBooking = (reference) => api.put(`/bookings/${encodeURIComponent(reference)}/cancel`);

// Admin
export const adminLogin = (credentials) => api.post('/admin/login', credentials);
export const fetchAdminDashboard = () => api.get('/admin/dashboard');
export const fetchAdminBookings = () => api.get('/admin/bookings');

export default api;
