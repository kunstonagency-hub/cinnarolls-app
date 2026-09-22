// src/components/Produccion.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Produccion() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerProduccion();
  }, []);

  async function obtenerProduccion() {
    const { data, error } = await supabase
      .from('produccion')
      .select('*');

    if (error) {
      console.error('Error al cargar producción:', error);
    } else {
      setTareas(data);
    }
    setCargando(false);
  }

  if (cargando) return <p>Cargando asignación de producción...</p>;

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Asignación de Producción Diaria</h3>
      <div className="grid-produccion">
        {tareas.map((item) => (
          <div className="card-produccion" key={item.id}>
            <div className="card-header">
              <h4>{item.area}</h4>
              {item.nota && <span className="badge-nota">{item.nota}</span>}
            </div>
            <div className="card-body">
              <p><strong>Productos / Tareas:</strong></p>
              <p className="texto-items">{item.items}</p>
              <div className="encargados-box">
                <span>Encargados:</span>
                <strong>{item.encargados}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}