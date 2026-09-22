// src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Horario from './components/Horario';
import Produccion from './components/Produccion';
import Alertas from './components/Alertas';
import Evidencias from './components/Evidencias'; // Módulo fotográfico
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  const [vistaActiva, setVistaActiva] = useState('horarios');
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUsuario(session?.user ?? null);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUsuario(null);
    setVistaActiva('horarios');
  }

  return (
    <div>
      <Navbar />

      <div className="container">
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2>Gestión Operativa Buenaventura</h2>
          {usuario ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                Conectado: <strong>{usuario.email}</strong>
              </span>
              <button onClick={cerrarSesion} className="btn-logout">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button onClick={() => setVistaActiva('login')} className="btn-primario">
              Iniciar Sesión
            </button>
          )}
        </div>

        {/* Pestañas de Navegación */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            className="btn-primario"
            style={{ opacity: vistaActiva === 'horarios' ? 1 : 0.6 }}
            onClick={() => setVistaActiva('horarios')}
          >
            Horario Semanal
          </button>

          <button
            className="btn-primario"
            style={{ opacity: vistaActiva === 'produccion' ? 1 : 0.6 }}
            onClick={() => setVistaActiva('produccion')}
          >
            División de Producción
          </button>

          <button
            className="btn-primario"
            style={{ opacity: vistaActiva === 'alertas' ? 1 : 0.6 }}
            onClick={() => setVistaActiva('alertas')}
          >
            Alertas y Tareas
          </button>

          <button
            className="btn-primario"
            style={{ opacity: vistaActiva === 'evidencias' ? 1 : 0.6 }}
            onClick={() => setVistaActiva('evidencias')}
          >
            📷 Fotos de Cierre
          </button>

          {usuario && (
            <button
              className="btn-primario"
              style={{
                backgroundColor: '#1f2937',
                opacity: vistaActiva === 'admin' ? 1 : 0.7,
              }}
              onClick={() => setVistaActiva('admin')}
            >
              ⚙️ Panel Admin
            </button>
          )}
        </div>

        {/* Vistas */}
        {vistaActiva === 'horarios' && <Horario />}
        {vistaActiva === 'produccion' && <Produccion />}
        {vistaActiva === 'alertas' && <Alertas />}
        {vistaActiva === 'evidencias' && <Evidencias usuario={usuario} />}
        {vistaActiva === 'login' && <Login onLoginExitoso={() => setVistaActiva('evidencias')} />}
        {vistaActiva === 'admin' && usuario && <AdminPanel />}
      </div>
    </div>
  );
}

export default App;