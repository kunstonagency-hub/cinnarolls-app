// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminPanel() {
  const [empleados, setEmpleados] = useState([]);
  const [horariosSemanaActual, setHorariosSemanaActual] = useState([]);
  const [horariosSemanaAnterior, setHorariosSemanaAnterior] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');

  // Bloques de turnos estandarizados
  const BLOQUES_TURNOS = ['LIBRE', '8- 5', '12:30- 9', '9:30 - 6:30'];

  // Fechas en formato YYYY-MM-DD
  const [semanaActual, setSemanaActual] = useState('2026-09-21'); // Lunes de esta semana
  const [semanaAnterior, setSemanaAnterior] = useState('2026-09-14'); // Lunes anterior

  // Turnos asignados para el formulario
  const [lunes, setLunes] = useState('8- 5');
  const [martes, setMartes] = useState('8- 5');
  const [miercoles, setMiercoles] = useState('8- 5');
  const [jueves, setJueves] = useState('8- 5');
  const [viernes, setViernes] = useState('8- 5');
  const [sabado, setSabado] = useState('LIBRE');
  const [domingo, setDomingo] = useState('LIBRE');

  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [semanaActual]);

  async function cargarDatos() {
    const { data: empData } = await supabase.from('empleados').select('*');
    
    // Obtener horarios de la semana seleccionada
    const { data: horActual } = await supabase
      .from('horarios')
      .select('*')
      .eq('fecha_inicio', semanaActual);

    // Obtener horarios de la semana anterior para el historial / algoritmo inteligente
    const { data: horAnt } = await supabase
      .from('horarios')
      .select('*')
      .eq('fecha_inicio', semanaAnterior);

    setEmpleados(empData || []);
    setHorariosSemanaActual(horActual || []);
    setHorariosSemanaAnterior(horAnt || []);
  }

  function seleccionarEmpleado(id) {
    setEmpleadoSeleccionado(id);
    const h = horariosSemanaActual.find((item) => item.empleado_id === id);
    if (h) {
      setLunes(h.lunes || 'LIBRE');
      setMartes(h.martes || 'LIBRE');
      setMiercoles(h.miercoles || 'LIBRE');
      setJueves(h.jueves || 'LIBRE');
      setViernes(h.viernes || 'LIBRE');
      setSabado(h.sabado || 'LIBRE');
      setDomingo(h.domingo || 'LIBRE');
    }
  }

  // ALGORITMO INTELIGENTE: Rota los turnos para asegurar equidad
  function sugerirHorarioInteligente() {
    if (!empleadoSeleccionado) {
      alert('Selecciona un empleado para calcular su sugerencia inteligente.');
      return;
    }

    // Buscar qué hizo el empleado la semana pasada
    const historialAnterior = horariosSemanaAnterior.find(
      (item) => item.empleado_id === empleadoSeleccionado
    );

    if (!historialAnterior) {
      // Si no hay historial previo, asignamos un patrón balanceado por defecto
      setLunes('8- 5');
      setMartes('8- 5');
      setMiercoles('12:30- 9');
      setJueves('12:30- 9');
      setViernes('12:30- 9');
      setSabado('LIBRE');
      setDomingo('LIBRE');
      setMensaje('✨ Sugerencia creada basada en patrón estándar (sin historial previo).');
      return;
    }

    // Función de rotación equitativa
    const rotarTurno = (turnoAnt) => {
      if (turnoAnt === '12:30- 9') return '8- 5';      // De Cierre rota a Apertura
      if (turnoAnt === '8- 5') return '9:30 - 6:30';  // De Apertura rota a Intermedio
      if (turnoAnt === '9:30 - 6:30') return '12:30- 9'; // De Intermedio rota a Cierre
      return 'LIBRE';
    };

    // Rotamos también los días libres (desplazamiento para no repetir siempre el mismo descanso)
    setLunes(rotarTurno(historialAnterior.martes));
    setMartes(rotarTurno(historialAnterior.miercoles));
    setMiercoles(rotarTurno(historialAnterior.jueves));
    setJueves(rotarTurno(historialAnterior.viernes));
    setViernes(rotarTurno(historialAnterior.sabado));
    setSabado(historialAnterior.lunes === 'LIBRE' ? '8- 5' : 'LIBRE');
    setDomingo(historialAnterior.domingo === 'LIBRE' ? '12:30- 9' : 'LIBRE');

    setMensaje('✨ ¡Horario sugerido inteligente generado! Revisa los bloques y guarda los cambios.');
  }

  async function guardarHorario(e) {
    e.preventDefault();
    if (!empleadoSeleccionado) {
      alert('Por favor selecciona un empleado');
      return;
    }

    const { error } = await supabase
      .from('horarios')
      .upsert(
        {
          empleado_id: empleadoSeleccionado,
          fecha_inicio: semanaActual,
          lunes,
          martes,
          miercoles,
          jueves,
          viernes,
          sabado,
          domingo,
        },
        { onConflict: 'empleado_id, fecha_inicio' }
      );

    if (error) {
      setMensaje('Error al guardar: ' + error.message);
    } else {
      setMensaje('¡Horario guardado con éxito!');
      cargarDatos();
      setTimeout(() => setMensaje(''), 3000);
    }
  }

  return (
    <div className="admin-panel-box">
      <h3>Panel de Administración - Gestión Inteligente</h3>
      <p>Gestión automatizada por bloques con historial y sugerencia de rotación equitativa.</p>

      {/* Selector de Semana e Historial */}
      <div className="selector-semana-box">
        <div>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem', marginRight: '10px' }}>
            Semana Operativa:
          </label>
          <select
            value={semanaActual}
            onChange={(e) => {
              setSemanaActual(e.target.value);
              // Asignar semana previa relativa
              const fecha = new Date(e.target.value);
              fecha.setDate(fecha.getDate() - 7);
              setSemanaAnterior(fecha.toISOString().split('T')[0]);
            }}
            className="select-admin"
            style={{ width: 'auto' }}
          >
            <option value="2026-09-21">Semana Actual (21 Sep - 27 Sep 2026)</option>
            <option value="2026-09-28">Próxima Semana (28 Sep - 04 Oct 2026)</option>
            <option value="2026-09-14">Historial: (14 Sep - 20 Sep 2026)</option>
            <option value="2026-08-31">Historial: (31 Ago - 06 Sep 2026)</option>
          </select>
        </div>

        <button type="button" onClick={sugerirHorarioInteligente} className="btn-inteligente">
          ✨ Sugerir Horario Inteligente
        </button>
      </div>

      {mensaje && <div className="alert-exito">{mensaje}</div>}

      <form onSubmit={guardarHorario} className="form-admin">
        <div className="form-group">
          <label>Seleccionar Empleado a Planificar:</label>
          <select
            value={empleadoSeleccionado}
            onChange={(e) => seleccionarEmpleado(e.target.value)}
            required
            className="select-admin"
          >
            <option value="">-- Selecciona un trabajador --</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} ({emp.rol})
              </option>
            ))}
          </select>
        </div>

        {empleadoSeleccionado && (
          <div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '10px 0' }}>
              Selecciona los bloques de tiempo predefinidos para cada día:
            </p>
            
            <div className="grid-turnos-form">
              {[
                { dia: 'Lunes', state: lunes, setter: setLunes },
                { dia: 'Martes', state: martes, setter: setMartes },
                { dia: 'Miércoles', state: miercoles, setter: setMiercoles },
                { dia: 'Jueves', state: jueves, setter: setJueves },
                { dia: 'Viernes', state: viernes, setter: setViernes },
                { dia: 'Sábado', state: sabado, setter: setSabado },
                { dia: 'Domingo', state: domingo, setter: setDomingo },
              ].map((item) => (
                <div key={item.dia} className="form-group">
                  <label>{item.dia}:</label>
                  <select
                    value={item.state}
                    onChange={(e) => item.setter(e.target.value)}
                    className="select-turno"
                  >
                    {BLOQUES_TURNOS.map((bloque) => (
                      <option key={bloque} value={bloque}>
                        {bloque}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn-primario" style={{ marginTop: '20px' }}>
          Guardar Horario de la Semana
        </button>
      </form>
    </div>
  );
}