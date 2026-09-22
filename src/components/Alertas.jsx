// src/components/Alertas.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevaAlerta, setNuevaAlerta] = useState('');

  useEffect(() => {
    obtenerAlertas();
  }, []);

  async function obtenerAlertas() {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar alertas:', error);
    } else {
      setAlertas(data || []);
    }
    setCargando(false);
  }

  // Marcar o desmarcar tarea realizada
  async function cambiarEstado(id, estadoActual) {
    const { error } = await supabase
      .from('alertas')
      .update({ completada: !estadoActual })
      .eq('id', id);

    if (error) {
      console.error('Error al cambiar estado:', error);
    } else {
      obtenerAlertas();
    }
  }

  // Publicar un nuevo aviso o alerta
  async function agregarAlerta(e) {
    e.preventDefault();
    if (!nuevaAlerta.trim()) return;

    const { error } = await supabase.from('alertas').insert([
      {
        titulo: nuevaAlerta,
        descripcion: 'Aviso publicado por el equipo',
        tipo: 'general',
        responsable: 'Equipo Buenaventura',
        completada: false,
      },
    ]);

    if (error) {
      console.error('Error al publicar alerta:', error);
    } else {
      setNuevaAlerta('');
      obtenerAlertas();
    }
  }

  if (cargando) return <p>Cargando alertas y tareas...</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Control de Alertas y Tareas Obligatorias</h3>

      {/* Formulario para publicar avisos rápidos sin usar WhatsApp */}
      <form onSubmit={agregarAlerta} className="form-nueva-alerta">
        <input
          type="text"
          placeholder="Escribe una alerta para la tienda (ej: Falta leche en barra, fuga en fregadero)..."
          value={nuevaAlerta}
          onChange={(e) => setNuevaAlerta(e.target.value)}
          className="input-alerta"
        />
        <button type="submit" className="btn-primario">
          Publicar Alerta
        </button>
      </form>

      {/* Lista de Tarjetas de Alertas */}
      <div className="container-alertas">
        {alertas.map((item) => (
          <div
            key={item.id}
            className={`card-alerta ${item.completada ? 'completada' : ''} ${
              item.tipo === 'obligatoria' ? 'obligatoria' : ''
            }`}
          >
            <div className="alerta-header">
              <div className="alerta-titulo-box">
                {item.tipo === 'obligatoria' && (
                  <span className="badge-obligatorio">OBLIGATORIO</span>
                )}
                <h4>{item.titulo}</h4>
              </div>
              <button
                className={`btn-estado ${item.completada ? 'btn-hecho' : 'btn-pendiente'}`}
                onClick={() => cambiarEstado(item.id, item.completada)}
              >
                {item.completada ? '✓ Realizado' : 'Marcar como Hecho'}
              </button>
            </div>

            {item.descripcion && <p className="alerta-desc">{item.descripcion}</p>}

            <div className="alerta-footer">
              <span>Responsable: <strong>{item.responsable}</strong></span>
              <span>Estado: <strong>{item.completada ? 'Completado' : 'Pendiente'}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}