// App.jsx
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Outlet,
  Navigate,
} from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Login from './Login';
import logo from './assets/logo.webp';
import logoFooter from './assets/footer-logo.webp';

// Import your page components
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import RestaurantPage from './pages/RestaurantPage';
import HealthFitnessPage from './pages/HealthFitnessPage';
import StudyRoomPage from './pages/StudyRoomPage';
import NotFound from './pages/NotFound';

// Import the Reservation Pages
import TrainerReservationPage from './pages/TrainerReservationPage';
import TableReservationPage from './pages/TableReservationPage';
import SpaReservationPage from './pages/SpaReservationPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTrainer, setIsTrainer] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);

      // Decode the token to check if the user is a trainer
      const decodedToken = jwtDecode(savedToken);
      if (decodedToken.trainer_ID) {
        setIsTrainer(true);
      } else {
        setIsTrainer(false);
      }
    }
  }, []);

  const handleLogin = (userToken) => {
    setToken(userToken);
    localStorage.setItem('token', userToken);
    setIsLoggedIn(true);

    // Decode the token to check if the user is a trainer
    const decodedToken = jwtDecode(userToken);
    if (decodedToken.trainer_ID) {
      setIsTrainer(true);
    } else {
      setIsTrainer(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsTrainer(false);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <Routes>
          {/* Layout Route that includes Navbar and Footer */}
          <Route
            element={<Layout handleLogout={handleLogout} isTrainer={isTrainer} />}
          >
            {/* Common Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomPage />} />
            <Route path="/restaurant" element={<RestaurantPage />} />
            <Route path="/health-fitness" element={<HealthFitnessPage />} />
            <Route path="/study" element={<StudyRoomPage />} />
            <Route path="/about" element={<NotFound />} />

            {/* Reservation Routes */}
            {isTrainer && (
              <Route
                path="/trainer/reservations"
                element={<TrainerReservationPage />}
              />
            )}
            {/* Learners and trainers can access these routes */}
            <Route path="/reserve-table" element={<TableReservationPage />} />
            <Route path="/book-spa" element={<SpaReservationPage />} />

            {/* Redirect non-trainers trying to access trainer routes */}
            {!isTrainer && (
              <Route
                path="/trainer/*"
                element={<Navigate to="/" replace />}
              />
            )}
          </Route>

          {/* Route for 404 page without Navbar and Footer */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

// Layout component to include Navbar and Footer
function Layout({ handleLogout, isTrainer }) {
  return (
    <>
      <Navbar handleLogout={handleLogout} isTrainer={isTrainer} />
      <Outlet />
      <Footer />
    </>
  );
}

// Navbar component with hamburger menu and dropdown
function Navbar({ handleLogout, isTrainer }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <img src={logo} alt="Hotel Logo" className="navbar-logo" />

      {/* Hamburger menu icon */}
      <div
        className={`menu-icon ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      {/* Navbar links */}
      <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        <li>
          <Link to="/" onClick={closeMenus}>Home</Link>
        </li>
        <li>
          <Link to="/rooms" onClick={closeMenus}>Your Room</Link>
        </li>
        <li>
          <Link to="/restaurant" onClick={closeMenus}>Restaurant & Bar</Link>
        </li>
        <li>
          <Link to="/health-fitness" onClick={closeMenus}>Health & Fitness</Link>
        </li>
        <li>
          <Link to="/study" onClick={closeMenus}>Study Room</Link>
        </li>
        <li>
          <Link to="/404" onClick={closeMenus}>About</Link>
        </li>

        {/* Reservations Dropdown */}
        <li
          className="dropdown"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button
            className="dropbtn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            Reservations
          </button>
          <div className={`dropdown-content ${isDropdownOpen ? 'show' : ''}`}>
            {/* Show 'Reserve a Room' only for trainers */}
            {isTrainer && (
              <Link to="/trainer/reservations" onClick={closeMenus}>
                Reserve a Room
              </Link>
            )}
            {/* These links are visible to both learners and trainers */}
            <Link to="/reserve-table" onClick={closeMenus}>
              Reserve a Table
            </Link>
            <Link to="/book-spa" onClick={closeMenus}>
              Book an Appointment at the Spa
            </Link>
          </div>
        </li>

        <li>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

function Footer() {
  return (
    <div className="foot">
      <div className="footer-divider"></div>
      <div className="content content-dark">
        <img src={logoFooter} alt="Hotel Logo" className="footer-logo" />
        <div className="image-flexbox" style={{ padding: '0 10vw' }}>
          <div className="image-item">
            <b>Privacy</b>
          </div>
          <div className="image-item">
            <b>Terms and Conditions</b>
          </div>
        </div>
        <p>
          Our registered office and postal address is International House, 1 St
          Katharine’s Way, London, E1W 1UN
        </p>
        <p>QA is registered in England No. 2413137</p>
      </div>
    </div>
  );
}

export default App;
