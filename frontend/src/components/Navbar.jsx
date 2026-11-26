import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const isAdminLoggedIn = Boolean(localStorage.getItem('cinebook_admin_token'));

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/movies?search=${encodeURIComponent(query)}` : '/movies');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo">
          <span className="brand-icon">CB</span>
          <span className="brand-text">
            Cine<span>Book</span>
          </span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/movies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Movies
          </NavLink>
          <NavLink to="/showtimes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Theatres &amp; Shows
          </NavLink>
          <NavLink to="/my-bookings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            My Bookings
          </NavLink>
          <NavLink
            to={isAdminLoggedIn ? '/admin/dashboard' : '/admin/login'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {isAdminLoggedIn ? 'Admin Dashboard' : 'Admin Login'}
          </NavLink>
        </nav>

        <form className="nav-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search movies"
          />
          <button type="submit">Search</button>
        </form>
      </div>
    </header>
  );
}
