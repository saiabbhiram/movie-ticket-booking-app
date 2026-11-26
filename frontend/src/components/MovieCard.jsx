import { Link } from 'react-router-dom';
import fallbackPoster from '../assets/poster-fallback.svg';

export default function MovieCard({ movie }) {
  const isNowShowing = movie.status === 'Now Showing';

  return (
    <article className="movie-card">
      <Link to={`/movies/${movie.id}`} className="movie-poster-wrap">
        <img
          src={movie.poster_url || fallbackPoster}
          alt={movie.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackPoster;
          }}
        />
        <span className={`movie-status-badge ${isNowShowing ? 'badge-now' : 'badge-upcoming'}`}>
          {movie.status}
        </span>
        {Number(movie.rating) > 0 && (
          <span className="movie-rating-badge">★ {Number(movie.rating).toFixed(1)}</span>
        )}
      </Link>

      <div className="movie-card-body">
        <Link to={`/movies/${movie.id}`} className="movie-card-title">
          {movie.title}
        </Link>
        <p className="movie-meta">
          {movie.genre} &bull; {movie.language}
        </p>
        <p className="movie-meta">{movie.duration} mins</p>

        <div className="movie-card-actions">
          <Link to={`/movies/${movie.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
            {isNowShowing ? 'Book Tickets' : 'View Details'}
          </Link>
        </div>
      </div>
    </article>
  );
}
