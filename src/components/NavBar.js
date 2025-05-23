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
        <FontAwesomeIcon icon={faHome} />
      </Link>
      <Link to="/add" className={location.pathname === "/add" ? "active" : ""}>
        <FontAwesomeIcon icon={faPlus} />
      </Link>
      <Link
        to="/profile"
        className={location.pathname === "/profile" ? "active" : ""}
      >
        <FontAwesomeIcon icon={faUser} />
      </Link>
    </nav>
  );
};

export default NavBar;
