/* Catálogo maestro: categorías, servicios y planes, franjas, zonas, razas, estados */
(function (PC) {
  'use strict';

  const CATEGORIES = [
    { id: 'salud', name: 'Salud', icon: 'heart-pulse', tone: 'emerald', tagline: 'Consultas, chequeos y planes preventivos en tu sala.' },
    { id: 'vacunacion', name: 'Vacunación', icon: 'syringe', tone: 'sky', tagline: 'Esquemas completos con carné digital actualizado.' },
    { id: 'estetica', name: 'Estética', icon: 'scissors', tone: 'rose', tagline: 'Baño, corte e higiene con productos hipoalergénicos.' },
    { id: 'relajacion', name: 'Relajación', icon: 'sparkles', tone: 'violet', tagline: 'Masajes y spa para mascotas ansiosas o senior.' },
    { id: 'entrenamiento', name: 'Entrenamiento', icon: 'award', tone: 'amber', tagline: 'Obediencia y conducta con refuerzo positivo.' },
    { id: 'funerario', name: 'Servicios funerarios', icon: 'feather', tone: 'slate', tagline: 'Despedida digna, respetuosa y acompañada.' },
  ];

  const COND = {
    cancel: 'Cancelación sin costo hasta 4 horas antes de la visita.',
    zona: 'Cobertura urbana de Bogotá; municipios cercanos con recargo.',
    adulto: 'Debe haber un adulto responsable en el domicilio.',
    lab: 'Exámenes de laboratorio y medicamentos se cotizan aparte.',
  };

  const SERVICES = [
    // —— Salud
    { id: 'consulta-general', cat: 'salud', kind: 'servicio', name: 'Consulta veterinaria a domicilio', price: 95000, duration: 45, species: ['Canino', 'Felino'], popular: true,
      summary: 'Valoración clínica completa con plan de manejo en la comodidad del hogar.',
      includes: ['Examen físico completo', 'Revisión del historial clínico', 'Plan de manejo y receta digital', 'Seguimiento por mensajería 72 h'],
      conditions: [COND.cancel, COND.lab, COND.zona] },
    { id: 'chequeo-integral', cat: 'salud', kind: 'servicio', name: 'Chequeo integral preventivo', price: 165000, duration: 75, species: ['Canino', 'Felino'],
      summary: 'Revisión preventiva con toma de muestra y certificado de salud digital.',
      includes: ['Examen físico y odontológico', 'Hemograma básico', 'Desparasitación según peso', 'Certificado de salud digital'],
      conditions: ['Ayuno de 8 horas recomendado para la toma de muestra.', COND.cancel, COND.zona] },
    { id: 'plan-salud-anual', cat: 'salud', kind: 'plan', name: 'Plan Salud Anual', price: 490000, duration: 60, species: ['Canino', 'Felino'], popular: true,
      summary: 'Cuatro visitas al año, desparasitaciones y 10 % de descuento en otros servicios.',
      includes: ['4 consultas domiciliarias al año', '2 desparasitaciones', '10 % en vacunación y estética', 'Prioridad de agendamiento'],
      conditions: ['Vigencia de 12 meses desde la primera visita.', 'Aplica a una sola mascota.', 'No reembolsable; transferible una vez.'] },

    // —— Vacunación
    { id: 'vac-canina', cat: 'vacunacion', kind: 'servicio', name: 'Vacunación canina múltiple', price: 85000, duration: 30, species: ['Canino'], popular: true,
      summary: 'Protección contra parvovirus, moquillo, hepatitis, parainfluenza y leptospira.',
      includes: ['Examen previo a la vacunación', 'Vacuna múltiple (DHPPi + L)', 'Carné digital actualizado', 'Recordatorio automático de refuerzo'],
      conditions: ['La mascota debe estar sana y desparasitada.', COND.cancel, COND.adulto] },
    { id: 'vac-felina', cat: 'vacunacion', kind: 'servicio', name: 'Vacunación felina triple', price: 92000, duration: 30, species: ['Felino'],
      summary: 'Rinotraqueítis, calicivirus y panleucopenia aplicadas en casa, sin estrés de traslado.',
      includes: ['Examen previo a la vacunación', 'Vacuna triple felina', 'Carné digital actualizado', 'Recordatorio automático de refuerzo'],
      conditions: ['Gatos mayores de 8 semanas.', COND.cancel, COND.adulto] },
    { id: 'vac-rabia', cat: 'vacunacion', kind: 'servicio', name: 'Vacuna antirrábica', price: 45000, duration: 20, species: ['Canino', 'Felino'],
      summary: 'Dosis anual con certificado oficial para viajes y trámites.',
      includes: ['Dosis antirrábica', 'Certificado de vacunación', 'Registro en carné digital'],
      conditions: ['Mascotas mayores de 3 meses.', COND.cancel] },
    { id: 'plan-cachorro', cat: 'vacunacion', kind: 'plan', name: 'Plan Esquema Cachorro', price: 260000, duration: 40, species: ['Canino', 'Felino'],
      summary: 'Tres visitas coordinadas para completar vacunas, desparasitación y control de crecimiento.',
      includes: ['3 visitas cada 21 días', 'Vacunas del esquema inicial', '2 desparasitaciones', 'Consulta de crecimiento y nutrición'],
      conditions: ['Para cachorros desde las 6 semanas.', 'Las visitas se agendan juntas al contratar el plan.', COND.cancel] },

    // —— Estética
    { id: 'bano-cepillado', cat: 'estetica', kind: 'servicio', name: 'Baño y cepillado', price: 75000, duration: 60, species: ['Canino', 'Felino'],
      summary: 'Baño con shampoo hipoalergénico, secado y cepillado profundo.',
      includes: ['Baño con shampoo hipoalergénico', 'Secado profesional', 'Cepillado y desenredado', 'Limpieza de oídos'],
      conditions: ['Requiere punto de agua y toma eléctrica.', COND.cancel] },
    { id: 'peluqueria-completa', cat: 'estetica', kind: 'servicio', name: 'Peluquería completa', price: 120000, duration: 90, species: ['Canino', 'Felino'], popular: true,
      summary: 'Corte según raza, baño, uñas y finalización con perfume suave.',
      includes: ['Baño y secado', 'Corte según raza o preferencia', 'Corte de uñas y limado', 'Limpieza de oídos y perfume'],
      conditions: ['Requiere punto de agua y toma eléctrica.', 'Mascotas con nudos severos pueden tener recargo.', COND.cancel] },
    { id: 'spa-dental', cat: 'estetica', kind: 'servicio', name: 'Higiene dental y spa', price: 98000, duration: 45, species: ['Canino', 'Felino'],
      summary: 'Limpieza dental manual, aliento fresco y cuidado de encías.',
      includes: ['Limpieza dental manual', 'Revisión de encías y sarro', 'Gel de clorhexidina', 'Guía de higiene en casa'],
      conditions: ['No sustituye una profilaxis bajo anestesia.', COND.cancel] },

    // —— Relajación
    { id: 'masaje-terapeutico', cat: 'relajacion', kind: 'servicio', name: 'Masaje terapéutico', price: 80000, duration: 45, species: ['Canino', 'Felino'],
      summary: 'Alivia tensión muscular y mejora la movilidad, ideal para perros activos o senior.',
      includes: ['Masaje de relajación y movilidad', 'Estiramientos suaves', 'Valoración de puntos de dolor'],
      conditions: ['Se recomienda ayuno ligero de 1 hora.', COND.cancel] },
    { id: 'spa-relax', cat: 'relajacion', kind: 'servicio', name: 'Spa relax con aromaterapia', price: 115000, duration: 60, species: ['Canino', 'Felino'],
      summary: 'Ambiente calmante con feromonas, masaje y aromaterapia segura.',
      includes: ['Difusor de feromonas', 'Masaje relajante', 'Aromaterapia segura para mascotas', 'Hidratación de almohadillas'],
      conditions: [COND.cancel, COND.adulto] },
    { id: 'plan-calma', cat: 'relajacion', kind: 'plan', name: 'Plan Calma (ansiedad / senior)', price: 340000, duration: 50, species: ['Canino', 'Felino'],
      summary: 'Cuatro sesiones de relajación con seguimiento del comportamiento.',
      includes: ['4 sesiones de 50 minutos', 'Plan de enriquecimiento ambiental', 'Informe de evolución'],
      conditions: ['Vigencia de 90 días.', 'Sesiones separadas por al menos 7 días.', COND.cancel] },

    // —— Entrenamiento
    { id: 'obediencia-basica', cat: 'entrenamiento', kind: 'servicio', name: 'Obediencia básica (sesión)', price: 90000, duration: 60, species: ['Canino'],
      summary: 'Sentarse, quieto, ven y paseo sin tirón con refuerzo positivo.',
      includes: ['Evaluación inicial de conducta', 'Práctica guiada con tu perro', 'Tareas para casa', 'Material de apoyo en video'],
      conditions: ['Se recomienda el mismo adulto en todas las sesiones.', COND.cancel] },
    { id: 'paquete-obediencia', cat: 'entrenamiento', kind: 'plan', name: 'Paquete 8 sesiones de obediencia', price: 640000, duration: 60, species: ['Canino'], popular: true,
      summary: 'Programa completo con seguimiento semanal y certificado de finalización.',
      includes: ['8 sesiones de 60 minutos', 'Plan personalizado', 'Soporte por mensajería', 'Certificado de finalización'],
      conditions: ['Vigencia de 90 días.', 'Reprogramación gratuita con 12 h de aviso.', COND.cancel] },
    { id: 'modificacion-conducta', cat: 'entrenamiento', kind: 'servicio', name: 'Modificación de conducta', price: 110000, duration: 60, species: ['Canino', 'Felino'],
      summary: 'Abordaje de ansiedad por separación, reactividad y problemas de socialización.',
      includes: ['Análisis del comportamiento', 'Plan de intervención', 'Guía de manejo del entorno'],
      conditions: ['Puede requerir valoración veterinaria previa.', COND.cancel] },

    // —— Servicios funerarios
    { id: 'despedida-acompanada', cat: 'funerario', kind: 'servicio', name: 'Acompañamiento y despedida en casa', price: 350000, duration: 90, species: ['Canino', 'Felino'],
      summary: 'Ceremonia íntima en casa con acompañamiento profesional y huella conmemorativa.',
      includes: ['Acompañamiento profesional', 'Huella en arcilla', 'Mechón de recuerdo', 'Traslado respetuoso'],
      conditions: ['Disponible 7 días a la semana.', 'Se puede coordinar con urgencia según disponibilidad.'] },
    { id: 'cremacion-individual', cat: 'funerario', kind: 'servicio', name: 'Cremación individual con recogida', price: 520000, duration: 120, species: ['Canino', 'Felino'],
      summary: 'Recogida en casa, cremación individual y entrega de cenizas en urna.',
      includes: ['Recogida a domicilio', 'Cremación individual certificada', 'Urna y certificado', 'Entrega en 3 a 5 días hábiles'],
      conditions: ['Recargo según peso superior a 30 kg.', 'Incluye certificado de cremación.'] },
    { id: 'cremacion-colectiva', cat: 'funerario', kind: 'servicio', name: 'Cremación colectiva', price: 280000, duration: 60, species: ['Canino', 'Felino'],
      summary: 'Recogida a domicilio y cremación colectiva con certificado.',
      includes: ['Recogida a domicilio', 'Cremación colectiva certificada', 'Certificado digital'],
      conditions: ['No incluye entrega de cenizas.', 'Disponible 7 días a la semana.'] },
  ];

  // Franjas horarias de llegada (minutos desde 00:00)
  const SLOTS = [
    { id: 's1', label: '08:00 – 10:00', start: 480, end: 600 },
    { id: 's2', label: '10:00 – 12:00', start: 600, end: 720 },
    { id: 's3', label: '12:00 – 14:00', start: 720, end: 840 },
    { id: 's4', label: '14:00 – 16:00', start: 840, end: 960 },
    { id: 's5', label: '16:00 – 18:00', start: 960, end: 1080 },
  ];

  // Zonas de cobertura (coordenadas del mapa logístico 0–100)
  const ZONES = [
    { id: 'usaquen', name: 'Usaquén', x: 66, y: 10 },
    { id: 'suba', name: 'Suba', x: 38, y: 14 },
    { id: 'cedritos', name: 'Cedritos', x: 62, y: 20 },
    { id: 'chico', name: 'Chicó', x: 60, y: 30 },
    { id: 'chapinero', name: 'Chapinero', x: 62, y: 40 },
    { id: 'engativa', name: 'Engativá', x: 30, y: 42 },
    { id: 'teusaquillo', name: 'Teusaquillo', x: 50, y: 48 },
    { id: 'fontibon', name: 'Fontibón', x: 20, y: 58 },
    { id: 'candelaria', name: 'La Candelaria', x: 66, y: 56 },
    { id: 'puente_aranda', name: 'Puente Aranda', x: 44, y: 64 },
    { id: 'kennedy', name: 'Kennedy', x: 26, y: 72 },
    { id: 'san_cristobal', name: 'San Cristóbal', x: 74, y: 68 },
    { id: 'bosa', name: 'Bosa', x: 14, y: 86 },
  ];

  const BASE = { id: 'base', name: 'Sede PetCare', x: 55, y: 56 };

  const BREEDS = {
    Canino: ['Golden Retriever', 'Labrador Retriever', 'Beagle', 'Bulldog Francés', 'Schnauzer', 'Pastor Alemán', 'Poodle', 'Border Collie',
      'Cocker Spaniel', 'Chihuahua', 'Shih Tzu', 'Husky Siberiano', 'Criollo / Mestizo'],
    Felino: ['Criollo / Mestizo', 'Siamés', 'Persa', 'Maine Coon', 'Angora', 'Bengalí', 'Ragdoll', 'Británico de pelo corto'],
  };

  const CARE_TAGS = [
    'Alergia a medicamentos', 'Alergia alimentaria', 'Ansiedad / miedo', 'Agresividad con extraños', 'Movilidad reducida',
    'Dieta especial', 'Medicación crónica', 'Requiere bozal', 'Piel sensible',
  ];

  const PROCEDURES = {
    salud: ['Examen físico completo', 'Auscultación cardiopulmonar', 'Examen otoscópico', 'Toma de muestra', 'Curación de herida', 'Desparasitación', 'Aplicación de medicamento', 'Control de peso'],
    vacunacion: ['Examen previo a vacunación', 'Aplicación de vacuna', 'Desparasitación', 'Actualización de carné'],
    estetica: ['Baño', 'Corte de pelo', 'Corte de uñas', 'Limpieza de oídos', 'Limpieza dental', 'Cepillado'],
    relajacion: ['Masaje relajante', 'Aromaterapia', 'Estiramientos suaves', 'Hidratación de almohadillas'],
    entrenamiento: ['Evaluación de conducta', 'Sesión de obediencia', 'Refuerzo positivo', 'Socialización guiada'],
    funerario: ['Acompañamiento a la familia', 'Recogida', 'Preparación respetuosa', 'Entrega de recuerdo'],
  };

  const STATUS = {
    pendiente: { label: 'Por asignar', tone: 'amber', icon: 'clock', step: 0 },
    confirmada: { label: 'Confirmada', tone: 'sky', icon: 'calendar-check', step: 1 },
    en_camino: { label: 'En camino', tone: 'violet', icon: 'navigation', step: 2 },
    iniciada: { label: 'En atención', tone: 'emerald', icon: 'stethoscope', step: 3 },
    finalizada: { label: 'Finalizada', tone: 'gold', icon: 'check-circle', step: 4 },
    cancelada: { label: 'Cancelada', tone: 'rose', icon: 'x', step: -1 },
  };

  const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const WEEKDAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  PC.data = { CATEGORIES, SERVICES, SLOTS, ZONES, BASE, BREEDS, CARE_TAGS, PROCEDURES, STATUS, WEEKDAYS, WEEKDAYS_LONG };
})(window.PC);
