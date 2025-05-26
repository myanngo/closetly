import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faPlus, faUser } from "@fortawesome/free-solid-svg-icons";

const NavBar = () => {
  const location = useLocation();
  return (
    <nav className="bottom-nav">
      <Link to="/" className={location.pathname === "/" ? "active" : ""}>
        <div className="nav-icon-label">
          <FontAwesomeIcon icon={faHome} />
          <span className="nav-label">Home</span>
        </div>
      </Link>
      <Link to="/add" className={location.pathname === "/add" ? "active" : ""}>
        <div className="nav-icon-label">
          <FontAwesomeIcon icon={faPlus} />
          <span className="nav-label">Add</span>
        </div>
      </Link>
      <Link
        to="/profile"
        className={location.pathname === "/profile" ? "active" : ""}
      >
        <div className="nav-icon-label">
          <FontAwesomeIcon icon={faUser} />
          <span className="nav-label">Profile</span>
        </div>
      </Link>
    </nav>
  );
};

export default NavBar;
