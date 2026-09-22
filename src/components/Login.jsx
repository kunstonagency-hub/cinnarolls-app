// src/components/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLoginExitoso }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setCargando(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } else {
      onLoginExitoso(data.user);
    }
    setCargando(false);
  }

  return (
    <div className="card-login-container">
      <div className="card-login">
        <h3>Iniciar Sesión - Cinnarolls</h3>
        <p>Ingresa tus datos para acceder al sistema de gestión.</p>

        {errorMsg && <div className="alert-error">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Correo Electrónico:</label>
            <input
              type="email"
              placeholder="ejemplo@cinnarolls.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primario btn-block" disabled={cargando}>
            {cargando ? 'Iniciando sesión...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}