// src/components/Evidencias.jsx
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import logoMarcaAgua from '../assets/logo.svg';

export default function Evidencias({ usuario }) {
  const [listaEvidencias, setListaEvidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null); // Estado para visor en grande
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [area, setArea] = useState('Salados');
  const [comentario, setComentario] = useState('');
  const [nombreEmpleado, setNombreEmpleado] = useState('');

  const AREAS_COCINA = [
    'Salados',
    'Dulces',
    'Bebidas y Barra',
    'Toppings',
    'Caja y Mostrador',
    'Trampa de Grasa / Fregadero',
  ];

  useEffect(() => {
    cargarEvidencias();
    if (usuario?.email) {
      const nombre = usuario.email.split('@')[0].toUpperCase();
      setNombreEmpleado(nombre);
    } else {
      setNombreEmpleado('EMPLEADO DE TURNO');
    }

    return () => detenerCamara();
  }, [usuario]);

  async function cargarEvidencias() {
    const { data, error } = await supabase
      .from('evidencias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar evidencias:', error);
    } else {
      setListaEvidencias(data || []);
    }
    setCargando(false);
  }

  async function iniciarCamara() {
    setFotoCapturada(null);
    setCamaraActiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      try {
        const streamAlt = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = streamAlt;
        }
      } catch (e) {
        alert('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
        setCamaraActiva(false);
      }
    }
  }

  function detenerCamara() {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCamaraActiva(false);
  }

  function tomarFotografia() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const logo = new Image();
    logo.src = logoMarcaAgua;
    logo.onload = () => {
      const bannerHeight = canvas.height * 0.09;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

      const fechaHoraActual = new Date().toLocaleString('es-VE', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      const fontSize = Math.max(16, canvas.height * 0.028);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(
        `📅 CAPTURA EN VIVO: ${fechaHoraActual}`,
        canvas.width * 0.03,
        canvas.height - bannerHeight / 2 + fontSize / 3
      );

      const logoWidth = canvas.width * 0.13;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      const margin = canvas.width * 0.03;

      const x = canvas.width - logoWidth - margin;
      const y = margin;

      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.drawImage(logo, x, y, logoWidth, logoHeight);
      ctx.restore();

      canvas.toBlob((blob) => {
        setFotoCapturada(blob);
        detenerCamara();
      }, 'image/jpeg', 0.9);
    };
  }

  async function subirEvidencia(e) {
    e.preventDefault();
    if (!fotoCapturada) {
      alert('Debes tomar una foto utilizando la cámara antes de guardar.');
      return;
    }

    setSubiendo(true);

    try {
      const extension = 'jpg';
      const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(2)}.${extension}`;
      const rutaArchivo = `cierre/${nombreArchivo}`;

      const { error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(rutaArchivo, fotoCapturada);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('evidencias')
        .getPublicUrl(rutaArchivo);

      const { error: dbError } = await supabase.from('evidencias').insert([
        {
          empleado_nombre: nombreEmpleado,
          area,
          foto_url: urlData.publicUrl,
          comentario,
        },
      ]);

      if (dbError) throw dbError;

      setComentario('');
      setFotoCapturada(null);
      alert('¡Evidencia en vivo guardada y estampada con éxito!');
      cargarEvidencias();
    } catch (error) {
      alert('Error al guardar evidencia: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Registro e Inspección Fotográfica de Cierre</h3>
      <p>
        El sistema requiere la captura directa en vivo desde la cámara para validar el estado de la estación.
      </p>

      <div className="card-form-evidencia">
        <h4>📸 Captura de Cierre en Vivo (Sin Galería)</h4>
        
        <div className="grid-form-evidencia">
          <div className="form-group">
            <label>Área o Estación:</label>
            <select value={area} onChange={(e) => setArea(e.target.value)} className="select-admin">
              {AREAS_COCINA.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Trabajador Responsable:</label>
            <input
              type="text"
              value={nombreEmpleado}
              onChange={(e) => setNombreEmpleado(e.target.value)}
              required
              className="input-alerta"
            />
          </div>
        </div>

        <div style={{ margin: '15px 0', textAlign: 'center' }}>
          {!camaraActiva && !fotoCapturada && (
            <button type="button" onClick={iniciarCamara} className="btn-inteligente" style={{ width: '100%', padding: '14px' }}>
              📷 Activar Cámara en Vivo
            </button>
          )}

          {camaraActiva && (
            <div style={{ position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={tomarFotografia}
                className="btn-primario"
                style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', fontSize: '1rem' }}
              >
                📸 Tomar Fotografía Ahora
              </button>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {fotoCapturada && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Fotografía tomada y estampada con éxito</p>
              <button type="button" onClick={iniciarCamara} className="btn-logout" style={{ marginTop: '5px' }}>
                🔄 Repetir Foto
              </button>
            </div>
          )}
        </div>

        <form onSubmit={subirEvidencia}>
          <div className="form-group">
            <label>Comentario / Observaciones (Opcional):</label>
            <input
              type="text"
              placeholder="Ej: Fregadero desinfectado, piso coleado y cajas ordenadas"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="input-alerta"
            />
          </div>

          <button type="submit" className="btn-primario" disabled={subiendo || !fotoCapturada}>
            {subiendo ? 'Guardando evidencia...' : '📤 Guardar Evidencia de Cierre'}
          </button>
        </form>
      </div>

      <h4 style={{ marginTop: '30px', marginBottom: '15px' }}>
        Galería de Inspecciones Auditadas
      </h4>

      {cargando ? (
        <p>Cargando reporte de fotos...</p>
      ) : listaEvidencias.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No hay fotografías registradas aún hoy.</p>
      ) : (
        <div className="grid-galeria-evidencias">
          {listaEvidencias.map((item) => (
            <div key={item.id} className="card-foto-evidencia">
              <div className="foto-box" style={{ position: 'relative' }}>
                <img 
                  src={item.foto_url} 
                  alt={`Evidencia ${item.area}`} 
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}
                  onClick={() => setFotoAmpliada(item.foto_url)}
                  title="Haz clic para ver la foto en grande"
                />
                <span className="badge-area-foto">{item.area}</span>
              </div>
              <div className="info-foto">
                <p className="autor-foto">
                  👤 <strong>{item.empleado_nombre}</strong>
                </p>
                {item.comentario && <p className="comentario-foto">"{item.comentario}"</p>}
                <span className="fecha-foto">
                  📅 {new Date(item.created_at).toLocaleString('es-VE')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA AMPLIAR FOTO EN GRANDE */}
      {fotoAmpliada && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setFotoAmpliada(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={fotoAmpliada} 
              alt="Evidencia en grande" 
              style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} 
            />
            <button 
              onClick={() => setFotoAmpliada(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: '#e11d48',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}