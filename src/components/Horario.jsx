// src/components/Horario.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Horario() {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para controlar la semana seleccionada (por defecto la semana actual del 21 Sep)
  const [semanaSeleccionada, setSemanaSeleccionada] = useState('2026-09-21');

  useEffect(() => {
    obtenerHorarios();
  }, [semanaSeleccionada]);

  async function obtenerHorarios() {
    setCargando(true);
    // Consultamos los horarios filtrando exclusivamente por la fecha de inicio de la semana seleccionada
    const { data, error } = await supabase
      .from('horarios')
      .select('*, empleados(*)')
      .eq('fecha_inicio', semanaSeleccionada);

    if (error) {
      console.error('Error al cargar horarios:', error);
    } else {
      setHorarios(data || []);
    }
    setCargando(false);
  }

  const dias = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];

  const obtenerNombreEmpleado = (item) => {
    if (item.empleados) {
      return (
        item.empleados.nombre ||
        item.empleados.nombre_completo ||
        item.empleados.Empleado ||
        'Empleado'
      );
    }
    return item.empleado_id || 'Empleado';
  };

  const obtenerTurnoDia = (item, diaKey) => {
    return (
      item[diaKey] ||
      item[diaKey.charAt(0).toUpperCase() + diaKey.slice(1)] ||
      item[diaKey.toUpperCase()] ||
      ''
    );
  };

  return (
    <div className="horario-container" style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      
      {/* Cabecera y Selector de Semanas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>Horario Semanal - Buenaventura</h3>

        <div>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem', marginRight: '8px', color: '#374151' }}>
            Seleccionar Semana:
          </label>
          <select
            value={semanaSeleccionada}
            onChange={(e) => setSemanaSeleccionada(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', background: '#fff' }}
          >
            <option value="2026-09-21">Semana Actual (21 Sep - 27 Sep 2026)</option>
            <option value="2026-09-28">Próxima Semana (28 Sep - 04 Oct 2026)</option>
            <option value="2026-09-14">Historial: (14 Sep - 20 Sep 2026)</option>
            <option value="2026-09-07">Historial: (07 Sep - 13 Sep 2026)</option>
            <option value="2026-08-31">Historial: (31 Ago - 06 Sep 2026)</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '30px' }}>Cargando horario...</p>
      ) : horarios.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: '30px' }}>No hay registros de horarios para esta semana.</p>
      ) : (
        <>
          {/* VISTA 1: TABLA TRADICIONAL (Para PC) */}
          <div className="tabla-desktop">
            <table className="tabla-horarios">
              <thead>
                <tr>
                  <th>Empleado</th>
                  {dias.map((d) => (
                    <th key={d.key}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios.map((item) => (
                  <tr key={item.id}>
                    <td className="nombre-empleado">
                      {obtenerNombreEmpleado(item)}
                    </td>
                    {dias.map((d) => {
                      const valor = obtenerTurnoDia(item, d.key);
                      const esLibre = valor?.toString().toUpperCase() === 'LIBRE';
                      return (
                        <td key={d.key}>
                          <span className={esLibre ? 'badge-libre' : 'badge-turno'}>
                            {valor}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VISTA 2: TARJETAS MÓVILES (Para Teléfonos) */}
          <div className="cards-horario-mobile">
            {horarios.map((item) => (
              <div key={item.id} className="card-empleado-horario">
                <div className="card-empleado-header">
                  <div className="avatar-icon">👤</div>
                  <h4>{obtenerNombreEmpleado(item)}</h4>
                </div>
                <div className="grid-dias-mobile">
                  {dias.map((d) => {
                    const valor = obtenerTurnoDia(item, d.key);
                    const esLibre = valor?.toString().toUpperCase() === 'LIBRE';
                    return (
                      <div
                        key={d.key}
                        className={`item-dia-mobile ${esLibre ? 'libre' : ''}`}
                      >
                        <span className="nombre-dia">{d.label}</span>
                        <span className={esLibre ? 'badge-libre' : 'badge-turno'}>
                          {valor}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}