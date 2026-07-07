import { useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api';

/**
 * Drop this hook into App.jsx (or a layout wrapper) once.
 * It fires silently on every route change:
 * - Registered users: the backend's protect middleware + trackUser handles it
 * - Anonymous visitors: sends a POST to /api/admin/track
 */
const useTrackVisit = () => {
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (loading) return; // wait for auth to resolve

    // Only track anonymous visitors here — registered user tracking
    // happens automatically server-side via the trackUser middleware
    if (!user) {
      API.post('/admin/track', { page: location.pathname }).catch(() => {});
    }
  }, [location.pathname, user, loading]);
};

export default useTrackVisit;