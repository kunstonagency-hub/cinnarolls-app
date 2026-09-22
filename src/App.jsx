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
    <div style={{ width: '100%', minHeight: '100vh', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <Navbar />

      {/* Contenedor principal adaptable: ancho máximo mayor para PC, flexible en móviles */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', boxSizing: 'border-box' }}>
        
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>Gestión Operativa Buenaventura</h2>
          {usuario ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                Conectado: <strong>{usuario.email}</strong>
              </span>
              <button onClick={cerrarSesion} className="btn-logout" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button onClick={() => setVistaActiva('login')} className="btn-primario" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              Iniciar Sesión
            </button>
          )}
        </div>

        {/* Pestañas de Navegación - Cuadrícula Adaptativa (Se expande en PC, 2 columnas en móvil) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '10px', 
          marginBottom: '25px', 
          boxSizing: 'border-box' 
        }}>
          <button
            className="btn-primario"
            style={{ 
              opacity: vistaActiva === 'horarios' ? 1 : 0.6,
              padding: '12px 10px',
              fontSize: '0.95rem',
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => setVistaActiva('horarios')}
          >
            📅 Horario Semanal
          </button>

          <button
            className="btn-primario"
            style={{ 
              opacity: vistaActiva === 'produccion' ? 1 : 0.6,
              padding: '12px 10px',
              fontSize: '0.95rem',
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => setVistaActiva('produccion')}
          >
            📦 División de Producción
          </button>

          <button
            className="btn-primario"
            style={{ 
              opacity: vistaActiva === 'alertas' ? 1 : 0.6,
              padding: '12px 10px',
              fontSize: '0.95rem',
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => setVistaActiva('alertas')}
          >
            ⚠️ Alertas y Tareas
          </button>

          <button
            className="btn-primario"
            style={{ 
              opacity: vistaActiva === 'evidencias' ? 1 : 0.6,
              padding: '12px 10px',
              fontSize: '0.95rem',
              textAlign: 'center',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
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
                padding: '12px 10px',
                fontSize: '0.95rem',
                textAlign: 'center',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => setVistaActiva('admin')}
            >
              ⚙️ Panel Admin
            </button>
          )}
        </div>

        {/* Contenedor de las vistas activas */}
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          {vistaActiva === 'horarios' && <Horario />}
          {vistaActiva === 'produccion' && <Produccion />}
          {vistaActiva === 'alertas' && <Alertas />}
          {vistaActiva === 'evidencias' && <Evidencias usuario={usuario} />}
          {vistaActiva === 'login' && <Login onLoginExitoso={() => setVistaActiva('evidencias')} />}
          {vistaActiva === 'admin' && usuario && <AdminPanel />}
        </div>
      </div>
    </div>
  );
}

export default App;