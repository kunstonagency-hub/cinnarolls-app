// src/components/Horario.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Horario() {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerHorarios();
  }, []);

  async function obtenerHorarios() {
    // Le pedimos a Supabase el horario cruzarlo con la tabla empleados
    const { data, error } = await supabase
      .from('horarios')
      .select('*, empleados(*)');

    if (error) {
      console.error('Error al cargar horarios:', error);
    } else {
      setHorarios(data);
    }
    setCargando(false);
  }

  if (cargando) return <p>Cargando horario...</p>;

  const dias = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];

  // Extrae el nombre desde los datos cruzados de la tabla empleados
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
    <div className="horario-container">
      <h3>Horario Semanal - Buenaventura</h3>

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
    </div>
  );
}