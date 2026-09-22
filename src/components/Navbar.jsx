// src/components/Navbar.jsx
import React from 'react';
import logo from '../assets/logo.svg';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Cinnarolls Logo" className="navbar-logo" />
        <span>Gestor de Turnos y Producción</span>
      </div>
      <span className="navbar-badge">Sucursal Buenaventura</span>
    </header>
  );
}