// src/components/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminPanel() {
  const [empleados, setEmpleados] = useState([]);
  const [horariosSemanaActual, setHorariosSemanaActual] = useState([]);
  const [horariosSemanaAnterior, setHorariosSemanaAnterior] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');

  // Lista dinámica de semanas obtenidas desde Supabase
  const [semanasDisponibles, setSemanasDisponibles] = useState([]);
  const [semanaActual, setSemanaActual] = useState('');
  const [semanaAnterior, setSemanaAnterior] = useState('');

  // Bloques de turnos dinámicos desde la base de datos
  const [bloquesTurnos, setBloquesTurnos] = useState(['LIBRE', '8- 5', '12:30- 9', '9:30 - 6:30']);
  const [nuevoBloqueTexto, setNuevoBloqueTexto] = useState('');

  // Turnos asignados para el formulario
  const [lunes, setLunes] = useState('LIBRE');
  const [martes, setMartes] = useState('LIBRE');
  const [miercoles, setMiercoles] = useState('LIBRE');
  const [jueves, setJueves] = useState('LIBRE');
  const [viernes, setViernes] = useState('LIBRE');
  const [sabado, setSabado] = useState('LIBRE');
  const [domingo, setDomingo] = useState('LIBRE');

  const [mensaje, setMensaje] = useState('');

  // Estados para la gestión de Alertas / Tareas
  const [alertas, setAlertas] = useState([]);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevoResponsable, setNuevoResponsable] = useState('');
  const [esObligatorio, setEsObligatorio] = useState(false);
  const [cargandoAlerta, setCargandoAlerta] = useState(false);

  useEffect(() => {
    cargarEmpleadosYSemanas();
    cargarAlertasAdmin();
    cargarBloquesTurnos();
  }, []);

  // Cargar lista de empleados y las semanas registradas en la base de datos
  async function cargarEmpleadosYSemanas() {
    const { data: empData } = await supabase.from('empleados').select('*');
    setEmpleados(empData || []);

    // Obtener todas las fechas de inicio únicas de la tabla horarios
    const { data: horData } = await supabase
      .from('horarios')
      .select('fecha_inicio')
      .order('fecha_inicio', { ascending: false });

    if (horData && horData.length > 0) {
      // Filtrar fechas únicas
      const semanasUnicas = [...new Set(horData.map(item => item.fecha_inicio))];
      setSemanasUnicasFormateadas(semanasUnicas);
    } else {
      // Si por alguna razón está vacío, inicializamos con una fecha por defecto
      const hoyDefault = '2026-09-21';
      setSemanasDisponibles([hoyDefault]);
      setSemanaActual(hoyDefault);
      setSemanaAnterior('2026-09-14');
    }
  }

  function setSemanasUnicasFormateadas(semanasUnicas) {
    setSemanasDisponibles(semanasUnicas);
    // Seleccionar por defecto la más reciente (la primera de la lista ordenada descendente)
    const masReciente = semanasUnicas[0];
    setSemanaActual(masReciente);

    // Calcular su respectiva semana anterior (-7 días)
    const fechaAnt = new Date(masReciente);
    fechaAnt.setDate(fechaAnt.getDate() - 7);
    setSemanaAnterior(fechaAnt.toISOString().split('T')[0]);
  }

  // Cada vez que cambia la semana actual, cargamos los horarios de esa semana y la anterior
  useEffect(() => {
    if (semanaActual) {
      cargarHorariosPorSemana(semanaActual, semanaAnterior);
    }
  }, [semanaActual]);

  async function cargarHorariosPorSemana(act, ant) {
    const { data: horActual } = await supabase
      .from('horarios')
      .select('*')
      .eq('fecha_inicio', act);

    const { data: horAnt } = await supabase
      .from('horarios')
      .select('*')
      .eq('fecha_inicio', ant);

    setHorariosSemanaActual(horActual || []);
    setHorariosSemanaAnterior(horAnt || []);
  }

  // EFECTO REACTIVO: Actualiza los campos del formulario al cambiar de empleado o semana
  useEffect(() => {
    if (empleadoSeleccionado) {
      const h = horariosSemanaActual.find((item) => item.empleado_id === empleadoSeleccionado);
      if (h) {
        setLunes(h.lunes || 'LIBRE');
        setMartes(h.martes || 'LIBRE');
        setMiercoles(h.miercoles || 'LIBRE');
        setJueves(h.jueves || 'LIBRE');
        setViernes(h.viernes || 'LIBRE');
        setSabado(h.sabado || 'LIBRE');
        setDomingo(h.domingo || 'LIBRE');
      } else {
        setLunes('LIBRE');
        setMartes('LIBRE');
        setMiercoles('LIBRE');
        setJueves('LIBRE');
        setViernes('LIBRE');
        setSabado('LIBRE');
        setDomingo('LIBRE');
      }
    }
  }, [horariosSemanaActual, empleadoSeleccionado]);

  // FUNCIÓN CLAVE: Crear automáticamente la siguiente semana sumando 7 días
  async function generarSiguienteSemanaAuto() {
    if (semanasDisponibles.length === 0) return;

    // Tomamos la fecha más reciente actual
    const ultimaFechaStr = semanasDisponibles[0]; // Como están descendentes, la [0] es la mayor
    const ultimaFecha = new Date(ultimaFechaStr + 'T00:00:00');
    ultimaFecha.setDate(ultimaFecha.getDate() + 7);
    const nuevaFechaStr = ultimaFecha.toISOString().split('T')[0];

    if (semanasDisponibles.includes(nuevaFechaStr)) {
      alert('La siguiente semana ya se encuentra registrada en el sistema.');
      setSemanaActual(nuevaFechaStr);
      return;
    }

    if (!window.confirm(`¿Deseas generar automáticamente la nueva semana que inicia el ${nuevaFechaStr}?`)) {
      return;
    }

    // Creamos registros por defecto ("LIBRE" o copiando la última semana) para todos los empleados
    const nuevosRegistros = empleados.map(emp => ({
      empleado_id: emp.id,
      fecha_inicio: nuevaFechaStr,
      lunes: 'LIBRE',
      martes: 'LIBRE',
      miercoles: 'LIBRE',
      jueves: 'LIBRE',
      viernes: 'LIBRE',
      sabado: 'LIBRE',
      domingo: 'LIBRE'
    }));

    const { error } = await supabase.from('horarios').upsert(nuevosRegistros, { onConflict: 'empleado_id, fecha_inicio' });

    if (error) {
      alert('Error al generar la nueva semana: ' + error.message);
    } else {
      setMensaje(`✨ ¡Semana del ${nuevaFechaStr} creada con éxito!`);
      await cargarEmpleadosYSemanas();
      setSemanaActual(nuevaFechaStr);
      setTimeout(() => setMensaje(''), 4000);
    }
  }

  async function cargarAlertasAdmin() {
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAlertas(data);
    }
  }

  async function cargarBloquesTurnos() {
    const { data, error } = await supabase.from('bloques_turnos').select('*');
    if (!error && data && data.length > 0) {
      setBloquesTurnos(data.map(b => b.nombre));
    }
  }

  async function crearBloqueTurno(e) {
    e.preventDefault();
    if (!nuevoBloqueTexto.trim()) return;

    const nombreBloque = nuevoBloqueTexto.trim().toUpperCase();
    if (bloquesTurnos.includes(nombreBloque)) {
      alert('Este bloque ya existe.');
      return;
    }

    const { error } = await supabase.from('bloques_turnos').insert([{ nombre: nombreBloque }]);
    if (error) {
      alert('Error al crear el bloque: ' + error.message);
    } else {
      setNuevoBloqueTexto('');
      cargarBloquesTurnos();
    }
  }

  async function eliminarBloqueTurno(nombre) {
    if (nombre === 'LIBRE') {
      alert('No se puede eliminar el bloque LIBRE.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de eliminar el bloque "${nombre}"?`)) return;

    const { error } = await supabase.from('bloques_turnos').delete().eq('nombre', nombre);
    if (!error) {
      cargarBloquesTurnos();
    } else {
      alert('Error al eliminar el bloque.');
    }
  }

  function sugerirHorarioInteligente() {
    if (!empleadoSeleccionado) {
      alert('Selecciona un empleado para calcular su sugerencia inteligente.');
      return;
    }

    const historialAnterior = horariosSemanaAnterior.find(
      (item) => item.empleado_id === empleadoSeleccionado
    );

    if (!historialAnterior) {
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

    const rotarTurno = (turnoAnt) => {
      if (turnoAnt === '12:30- 9') return '8- 5';      
      if (turnoAnt === '8- 5') return '9:30 - 6:30';  
      if (turnoAnt === '9:30 - 6:30') return '12:30- 9'; 
      return 'LIBRE';
    };

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
      cargarHorariosPorSemana(semanaActual, semanaAnterior);
      setTimeout(() => setMensaje(''), 3000);
    }
  }

  async function crearAlertaAdmin(e) {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoResponsable.trim()) {
      alert('Por favor completa el título y el responsable.');
      return;
    }

    setCargandoAlerta(true);
    const { error } = await supabase.from('alertas').insert([
      {
        titulo: nuevoTitulo,
        descripcion: nuevaDescripcion,
        responsable: nuevoResponsable,
        obligatorio: esObligatorio,
        estado: 'Pendiente',
        published_by: 'Administrador'
      }
    ]);

    setCargandoAlerta(false);

    if (error) {
      alert('Error al crear la alerta: ' + error.message);
    } else {
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setNuevoResponsable('');
      setEsObligatorio(false);
      cargarAlertasAdmin();
    }
  }

  async function eliminarAlerta(id) {
    if (!window.confirm('¿Estás seguro de eliminar esta alerta/tarea?')) return;

    const { error } = await supabase.from('alertas').delete().eq('id', id);
    if (!error) {
      cargarAlertasAdmin();
    } else {
      alert('No se pudo eliminar la alerta.');
    }
  }

  return (
    <div className="admin-panel-box" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* SECCIÓN 1: GESTIÓN DE BLOQUES DE TURNOS */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h4 style={{ marginTop: 0, color: '#1f2937', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
          🕒 Gestión de Bloques de Turnos
        </h4>
        <p style={{ color: '#4b5563', fontSize: '0.85rem' }}>Crea o elimina los bloques horarios disponibles para la planificación.</p>

        <form onSubmit={crearBloqueTurno} style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Ej: 10- 7 o 1:00 - 9:00"
            value={nuevoBloqueTexto}
            onChange={(e) => setNuevoBloqueTexto(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
          <button type="submit" className="btn-primario" style={{ padding: '10px 20px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>
            ➕ Agregar Bloque
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
          {bloquesTurnos.map((bloque) => (
            <div key={bloque} style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <span>{bloque}</span>
              {bloque !== 'LIBRE' && (
                <button 
                  onClick={() => eliminarBloqueTurno(bloque)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: GESTIÓN DE HORARIOS Y TURNOS CON GENERADOR AUTOMÁTICO */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>Gestión Inteligente de Turnos por Empleado</h3>
        <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>Selecciona una semana o genera automáticamente el siguiente período operativo.</p>

        <div className="selector-semana-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Semana Operativa:
            </label>
            <select
              value={semanaActual}
              onChange={(e) => {
                const seleccionada = e.target.value;
                setSemanaActual(seleccionada);
                const fechaAnt = new Date(seleccionada);
                fechaAnt.setDate(fechaAnt.getDate() - 7);
                setSemanaAnterior(fechaAnt.toISOString().split('T')[0]);
              }}
              className="select-admin"
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            >
              {semanasDisponibles.map((sem) => (
                <option key={sem} value={sem}>
                  Semana del {sem}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={generarSiguienteSemanaAuto} 
              style={{ padding: '8px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🚀 Generar Siguiente Semana (+7 Días)
            </button>

            <button 
              type="button" 
              onClick={sugerirHorarioInteligente} 
              style={{ padding: '8px 14px', background: '#ec4899', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✨ Sugerir Horario Inteligente
            </button>
          </div>
        </div>

        {mensaje && <div className="alert-exito" style={{ marginTop: '15px', padding: '10px', background: '#fdf2f8', color: '#db2777', borderRadius: '6px', fontWeight: 'bold' }}>{mensaje}</div>}

        <form onSubmit={guardarHorario} className="form-admin" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Seleccionar Empleado a Planificar:</label>
            <select
              value={empleadoSeleccionado}
              onChange={(e) => setEmpleadoSeleccionado(e.target.value)}
              required
              className="select-admin"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
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
            <div style={{ marginTop: '15px' }}>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '10px 0' }}>
                Turnos registrados para la semana del <strong>{semanaActual}</strong>:
              </p>
              
              <div className="grid-turnos-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
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
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{item.dia}:</label>
                    <select
                      value={item.state}
                      onChange={(e) => item.setter(e.target.value)}
                      className="select-turno"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    >
                      {bloquesTurnos.map((bloque) => (
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

          <button type="submit" className="btn-primario" style={{ marginTop: '20px', padding: '12px 20px', width: '100%', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>
            Guardar Cambios de la Semana
          </button>
        </form>
      </div>

      {/* SECCIÓN 3: GESTIÓN DE ALERTAS Y TAREAS OBLIGATORIAS */}
      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h4 style={{ marginTop: 0, color: '#1f2937', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' }}>
          🚨 Gestión de Alertas y Tareas Obligatorias
        </h4>

        <form onSubmit={crearAlertaAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Título de la Alerta o Tarea:</label>
            <input 
              type="text" 
              placeholder="Ej: Revisión de freidora, Falta de insumos..."
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Descripción / Instrucciones (Opcional):</label>
            <textarea 
              placeholder="Detalles adicionales para el equipo..."
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', minHeight: '60px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Responsable Asignado:</label>
              <input 
                type="text" 
                placeholder="Ej: Kenneth / Yendimar o Equipo de Cierre"
                value={nuevoResponsable}
                onChange={(e) => setNuevoResponsable(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', color: '#b91c1c' }}>
                <input 
                  type="checkbox" 
                  checked={esObligatorio}
                  onChange={(e) => setEsObligatorio(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Marcar como Obligatorio
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargandoAlerta}
            className="btn-primario"
            style={{ marginTop: '10px', padding: '12px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}
          >
            {cargandoAlerta ? 'Publicando...' : '📢 Publicar Alerta / Tarea Oficial'}
          </button>
        </form>

        <h5 style={{ marginTop: '30px', marginBottom: '15px', color: '#374151' }}>📋 Alertas Activas en el Sistema:</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alertas.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>No hay alertas registradas.</p>
          ) : (
            alertas.map((alerta) => (
              <div key={alerta.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {alerta.obligatorio && <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>OBLIGATORIO</span>}
                    <strong>{alerta.titulo}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '4px' }}>
                    Responsable: <strong>{alerta.responsable}</strong> | Estado: {alerta.estado}
                  </div>
                </div>
                <button 
                  onClick={() => eliminarAlerta(alerta.id)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}