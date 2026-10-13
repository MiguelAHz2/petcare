/* Datos de demostración (relativos a la fecha actual, deterministas) */
(function (PC) {
  'use strict';
  const { dt } = PC;
  const D = PC.data;
  const L = PC.logic;

  PC.SCHEMA = 3;

  const week = cfg => {
    const o = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    Object.keys(cfg).forEach(k => { o[k] = cfg[k]; });
    return o;
  };
  const S = (a, b) => ['s1', 's2', 's3', 's4', 's5'].slice(a - 1, b);

  // Plantillas clínicas por servicio / categoría
  const TPL = {
    'consulta-general': [
      { dx: 'Control clínico sin hallazgos relevantes', proc: ['Examen físico completo', 'Auscultación cardiopulmonar'], meds: [], rec: 'Mantener dieta balanceada y ejercicio diario. Nuevo control en 6 meses.' },
      { dx: 'Otitis externa leve', proc: ['Examen físico completo', 'Examen otoscópico'], meds: [{ name: 'Gotas óticas (gentamicina + betametasona)', dose: '4 gotas por oído', freq: 'Cada 12 h por 7 días' }], rec: 'Evitar humedad en los oídos y realizar limpieza semanal.' },
      { dx: 'Dermatitis alérgica estacional', proc: ['Examen físico completo', 'Aplicación de medicamento'], meds: [{ name: 'Antihistamínico oral', dose: '1 tableta', freq: 'Cada 24 h por 10 días' }, { name: 'Shampoo de avena coloidal', dose: 'Baño terapéutico', freq: 'Cada 15 días' }], rec: 'Evitar alérgenos conocidos y mantener el pelaje limpio y seco.' },
      { dx: 'Gastroenteritis leve', proc: ['Examen físico completo', 'Aplicación de medicamento'], meds: [{ name: 'Probiótico oral', dose: '1 sobre', freq: 'Cada 24 h por 5 días' }], rec: 'Dieta blanda por 48 horas e hidratación fraccionada. Consultar si persiste.' },
    ],
    'chequeo-integral': [
      { dx: 'Paciente clínicamente sano; parámetros hematológicos en rango', proc: ['Examen físico completo', 'Toma de muestra', 'Desparasitación'], meds: [{ name: 'Antiparasitario oral', dose: 'Según peso', freq: 'Dosis única' }], rec: 'Repetir hemograma en 12 meses y mantener el esquema de vacunación al día.' },
      { dx: 'Sobrepeso leve (condición corporal 6/9)', proc: ['Examen físico completo', 'Toma de muestra', 'Control de peso'], meds: [], rec: 'Ajustar ración un 10 % y aumentar paseos. Control de peso en 30 días.' },
    ],
    'plan-salud-anual': [
      { dx: 'Control preventivo del plan anual', proc: ['Examen físico completo', 'Desparasitación'], meds: [{ name: 'Antiparasitario oral', dose: 'Según peso', freq: 'Dosis única' }], rec: 'Continuar con el plan de visitas trimestrales.' },
    ],
    'vac-canina': [
      { dx: 'Apto para inmunización; sin signos de enfermedad', proc: ['Examen previo a vacunación', 'Aplicación de vacuna', 'Actualización de carné'], meds: [{ name: 'Vacuna múltiple DHPPi + L', dose: '1 ml', freq: 'Subcutánea, dosis única' }], rec: 'Evitar baños por 48 horas y observar la zona de aplicación. Refuerzo en 12 meses.', next: 365 },
    ],
    'vac-felina': [
      { dx: 'Apta para inmunización; sin signos de enfermedad', proc: ['Examen previo a vacunación', 'Aplicación de vacuna', 'Actualización de carné'], meds: [{ name: 'Vacuna triple felina', dose: '1 ml', freq: 'Subcutánea, dosis única' }], rec: 'Mantener en reposo 24 horas. Refuerzo en 12 meses.', next: 365 },
    ],
    'vac-rabia': [
      { dx: 'Apto para vacunación antirrábica', proc: ['Examen previo a vacunación', 'Aplicación de vacuna', 'Actualización de carné'], meds: [{ name: 'Vacuna antirrábica', dose: '1 ml', freq: 'Subcutánea, dosis anual' }], rec: 'Conservar el certificado. Refuerzo anual.', next: 365 },
    ],
    'plan-cachorro': [
      { dx: 'Visita del esquema inicial de cachorro', proc: ['Examen previo a vacunación', 'Aplicación de vacuna', 'Desparasitación'], meds: [{ name: 'Vacuna del esquema inicial', dose: '1 ml', freq: 'Subcutánea' }], rec: 'Próxima visita en 21 días. Evitar el contacto con otros animales no vacunados.', next: 21 },
    ],
    'cat:estetica': [
      { dx: 'Piel y pelaje en buen estado, sin parásitos externos', proc: ['Baño', 'Cepillado', 'Limpieza de oídos'], meds: [], rec: 'Cepillado diario. Repetir el servicio cada 4 a 6 semanas.' },
      { dx: 'Pelaje con nudos leves; piel sin lesiones', proc: ['Baño', 'Corte de pelo', 'Corte de uñas'], meds: [], rec: 'Cepillado 3 veces por semana para evitar nudos.' },
    ],
    'cat:relajacion': [
      { dx: 'Tensión muscular leve en tren posterior; respuesta positiva al masaje', proc: ['Masaje relajante', 'Estiramientos suaves'], meds: [], rec: 'Paseos cortos y superficies antideslizantes en casa.' },
      { dx: 'Ansiedad situacional leve, buena tolerancia a la aromaterapia', proc: ['Aromaterapia', 'Masaje relajante'], meds: [], rec: 'Mantener rutina estable y zona de descanso tranquila.' },
    ],
    'cat:entrenamiento': [
      { dx: 'Buena respuesta al refuerzo positivo; atención sostenida 8 minutos', proc: ['Evaluación de conducta', 'Sesión de obediencia', 'Refuerzo positivo'], meds: [], rec: 'Practicar sentarse y quieto 3 veces al día durante 5 minutos.' },
    ],
    'cat:funerario': [
      { dx: 'Acompañamiento a la familia', proc: ['Acompañamiento a la familia', 'Preparación respetuosa', 'Entrega de recuerdo'], meds: [], rec: 'Se entregó material de apoyo para el duelo.' },
    ],
  };

  PC.buildSeed = function () {
    const today = dt.today();
    const day = n => dt.add(today, n);
    const rnd = PC.rng(3001301);
    const pick = a => a[Math.floor(rnd() * a.length)];

    // ——— Propietarios
    const owners = [
      { id: 'o1', name: 'Laura Martínez', email: 'laura@demo.co', phone: '+57 310 456 7890', address: 'Carrera 11 # 93-45, Apto 502', zoneId: 'chico' },
      { id: 'o2', name: 'Carlos Rojas', email: 'carlos@demo.co', phone: '+57 315 220 1188', address: 'Calle 147 # 19-30, Casa 12', zoneId: 'cedritos' },
      { id: 'o3', name: 'Andrea Gómez', email: 'andrea@demo.co', phone: '+57 320 774 6021', address: 'Carrera 78K # 38-20 Sur', zoneId: 'kennedy' },
      { id: 'o4', name: 'Julián Pardo', email: 'julian@demo.co', phone: '+57 300 918 4477', address: 'Calle 138 # 92-15, Torre 3', zoneId: 'suba' },
      { id: 'o5', name: 'Valentina Cruz', email: 'valentina@demo.co', phone: '+57 311 603 9925', address: 'Carrera 17 # 45-50', zoneId: 'teusaquillo' },
      { id: 'o6', name: 'Sebastián Mora', email: 'sebastian@demo.co', phone: '+57 318 552 3304', address: 'Calle 22 # 99-41', zoneId: 'fontibon' },
      { id: 'o7', name: 'Mariana Díaz', email: 'mariana@demo.co', phone: '+57 322 187 6650', address: 'Carrera 7 # 119-14', zoneId: 'usaquen' },
      { id: 'o8', name: 'Felipe Ortiz', email: 'felipe@demo.co', phone: '+57 304 331 0872', address: 'Calle 13 # 39-70', zoneId: 'puente_aranda' },
    ].map(o => ({ ...o, password: 'demo1234', notify: { email: true, whatsapp: true, push: false }, createdAt: dt.at(day(-120), 600), seed: true }));

    // ——— Profesionales
    const vets = [
      { id: 'v1', name: 'Dra. Camila Restrepo', email: 'camila@petcare.co', license: 'MV-10234', specialty: 'Medicina general y felina', skills: ['salud', 'vacunacion'],
        zones: ['usaquen', 'cedritos', 'chico', 'suba', 'chapinero'], phone: '+57 301 220 4411', color: '#D4B06A', rating: 4.9, reviews: 212, since: 2021,
        bio: 'Médica veterinaria con enfoque en medicina felina y preventiva. Atención tranquila, sin estrés.',
        availability: week({ 0: S(1, 2), 1: S(1, 5), 2: S(1, 5), 3: S(1, 5), 4: S(1, 5), 5: S(1, 5), 6: S(1, 3) }) },
      { id: 'v2', name: 'Dr. Andrés Villamil', email: 'andres@petcare.co', license: 'MV-08871', specialty: 'Medicina interna y vacunación', skills: ['salud', 'vacunacion', 'funerario'],
        zones: ['chapinero', 'teusaquillo', 'candelaria', 'san_cristobal', 'puente_aranda', 'fontibon'], phone: '+57 312 884 7720', color: '#7DB7F5', rating: 4.8, reviews: 187, since: 2020,
        bio: 'Especialista en medicina interna, pacientes geriátricos y acompañamiento al final de la vida.',
        availability: week({ 0: S(2, 3), 1: S(1, 5), 2: S(1, 5), 3: S(1, 5), 4: S(1, 5), 5: S(1, 5), 6: S(1, 2) }) },
      { id: 'v3', name: 'Sofía Herrera', email: 'sofia@petcare.co', license: 'GRM-5521', specialty: 'Estética y bienestar', skills: ['estetica', 'relajacion'],
        zones: ['fontibon', 'engativa', 'kennedy', 'bosa', 'puente_aranda', 'teusaquillo'], phone: '+57 316 402 9981', color: '#6FD3A8', rating: 4.7, reviews: 143, since: 2022,
        bio: 'Peluquera canina y felina certificada, con formación en manejo de mascotas sensibles.',
        availability: week({ 1: S(1, 4), 2: S(1, 4), 3: S(1, 4), 4: S(1, 4), 5: S(1, 4), 6: S(1, 4) }) },
      { id: 'v4', name: 'Dr. Mateo Contreras', email: 'mateo@petcare.co', license: 'MV-12290', specialty: 'Etología y entrenamiento', skills: ['entrenamiento', 'relajacion'],
        zones: ['suba', 'engativa', 'usaquen', 'cedritos', 'chico', 'teusaquillo'], phone: '+57 314 667 1203', color: '#B49CF5', rating: 4.9, reviews: 96, since: 2022,
        bio: 'Etólogo clínico. Modificación de conducta y obediencia con refuerzo positivo.',
        availability: week({ 2: S(2, 5), 3: S(2, 5), 4: S(2, 5), 5: S(2, 5), 6: S(1, 4) }) },
      { id: 'v5', name: 'Dr. Daniel Ospina', email: 'daniel@petcare.co', license: 'MV-09904', specialty: 'Salud y cuidados paliativos', skills: ['salud', 'vacunacion', 'funerario'],
        zones: ['kennedy', 'bosa', 'fontibon', 'puente_aranda', 'san_cristobal'], phone: '+57 317 905 4426', color: '#F29AAE', rating: 4.6, reviews: 64, since: 2023,
        bio: 'Veterinario con formación en cuidados paliativos y bienestar en la etapa senior.',
        availability: week({ 1: S(1, 4), 2: S(1, 4), 3: S(1, 4), 4: S(1, 4), 5: S(1, 4) }), status: 'descanso' },
    ].map(v => ({ status: 'activo', ...v, password: 'demo1234', seed: true }));

    // ——— Mascotas
    const vac = (species, d1, d2) => (species === 'Canino'
      ? [{ name: 'Múltiple (DHPPi + L)', date: day(-d1), next: day(365 - d1) }, { name: 'Antirrábica', date: day(-d2), next: day(365 - d2) }]
      : [{ name: 'Triple felina', date: day(-d1), next: day(365 - d1) }, { name: 'Antirrábica', date: day(-d2), next: day(365 - d2) }]);
    const dogE = ['🐶', '🐕', '🐩', '🦮'], catE = ['🐱', '🐈', '🐈‍⬛'];
    const P = (id, ownerId, name, species, breed, ageMonths, weight, sex, history, care, careNotes, v1, v2, emoji) => ({
      id, ownerId, name, species, breed, ageMonths, weight, sex, history: history || '', care: care || [], careNotes: careNotes || '',
      vaccines: vac(species, v1, v2), emoji: emoji || (species === 'Canino' ? pick(dogE) : pick(catE)), createdAt: dt.at(day(-100), 600), seed: true,
    });
    const pets = [
      P('p1', 'o1', 'Max', 'Canino', 'Golden Retriever', 60, 31.5, 'Macho',
        'Dermatitis atópica controlada desde 2023. Displasia de cadera grado I en control anual. Sin cirugías previas.',
        ['Alergia alimentaria', 'Piel sensible'], 'Evitar alimentos con pollo. No hacer ejercicio intenso en horas de calor.', 150, 150, '🐕'),
      P('p2', 'o1', 'Luna', 'Felino', 'Siamés', 36, 4.2, 'Hembra',
        'Esterilizada en 2024. Gingivitis leve en seguimiento. Sin enfermedades crónicas.',
        ['Ansiedad / miedo'], 'Se esconde con visitas. Preferir entrada tranquila, sin ruidos y con la puerta del cuarto cerrada.', 335, 200, '🐈'),
      P('p3', 'o1', 'Toby', 'Canino', 'Beagle', 8, 11.0, 'Macho',
        'Esquema de vacunación en curso. Desparasitado hace 3 semanas.',
        ['Cachorro en entrenamiento'].filter(() => false), 'Muy activo; masticar objetos. Mantener premios a la mano.', 70, 70, '🐶'),
      P('p4', 'o2', 'Rocky', 'Canino', 'Bulldog Francés', 48, 12.8, 'Macho',
        'Síndrome braquicefálico leve. Sobrepeso en control.',
        ['Dieta especial', 'Movilidad reducida'].slice(0, 1), 'Evitar ejercicio con calor. Respiración ruidosa normal en reposo.', 120, 120),
      P('p5', 'o3', 'Mía', 'Felino', 'Persa', 84, 4.8, 'Hembra',
        'Enfermedad renal crónica estadio 2. Control de creatinina semestral.',
        ['Medicación crónica', 'Dieta especial'], 'Dieta renal exclusiva. Hidratación abundante.', 300, 300),
      P('p6', 'o3', 'Simón', 'Canino', 'Schnauzer', 108, 8.1, 'Macho',
        'Hipotiroidismo en tratamiento. Artrosis leve en cadera.',
        ['Medicación crónica', 'Movilidad reducida'], 'Levotiroxina cada mañana. Evitar escaleras.', 200, 200),
      P('p7', 'o4', 'Canela', 'Canino', 'Labrador Retriever', 24, 26.0, 'Hembra',
        'Sin antecedentes relevantes. Esterilizada.', [], 'Muy sociable; tirón en el paseo.', 90, 90),
      P('p8', 'o4', 'Nube', 'Felino', 'Maine Coon', 60, 6.5, 'Hembra',
        'Cardiomiopatía hipertrófica en vigilancia (ecocardiograma anual).',
        ['Medicación crónica'], 'Evitar estrés y manipulación brusca.', 250, 250),
      P('p9', 'o5', 'Pepa', 'Canino', 'Poodle', 132, 6.2, 'Hembra',
        'Perra senior. Enfermedad dental avanzada, soplo cardíaco grado II.',
        ['Movilidad reducida', 'Alergia a medicamentos'], 'Alergia a penicilinas. Superficies antideslizantes.', 180, 180),
      P('p10', 'o5', 'Tomás', 'Canino', 'Criollo / Mestizo', 72, 18.4, 'Macho',
        'Rescatado a los 2 años. Sin antecedentes patológicos.', ['Agresividad con extraños'], 'Reactivo con desconocidos al inicio. Dejar que se acerque él.', 130, 130),
      P('p11', 'o6', 'Zeus', 'Canino', 'Pastor Alemán', 96, 36.0, 'Macho',
        'Displasia de codo derecha, manejo con condroprotectores.',
        ['Medicación crónica', 'Requiere bozal'].slice(0, 1), 'Condroprotector diario. Evitar saltos.', 110, 110),
      P('p12', 'o7', 'Frida', 'Felino', 'Criollo / Mestizo', 24, 3.9, 'Hembra',
        'Adoptada a los 4 meses. Esterilizada.', [], 'Juguetona y sociable.', 60, 60),
      P('p13', 'o7', 'Bruno', 'Canino', 'Border Collie', 36, 19.0, 'Macho',
        'Sin antecedentes relevantes.', ['Ansiedad / miedo'], 'Ansiedad por separación. Evitar ruidos fuertes.', 140, 140),
      P('p14', 'o8', 'Ringo', 'Canino', 'Cocker Spaniel', 72, 13.0, 'Macho',
        'Otitis recurrente. Dermatitis en pliegues.', ['Piel sensible'], 'Revisar y limpiar oídos con frecuencia.', 100, 100),
    ];

    const appointments = [];
    const treatments = [];
    let nA = 100, nT = 100, nCreated = 0;

    function addTreatment(a, tplIdx) {
      const pet = pets.find(p => p.id === a.petId);
      const svc = L.service(a.serviceId);
      const list = TPL[a.serviceId] || TPL['cat:' + svc.cat] || TPL['cat:estetica'];
      const t = list[tplIdx != null ? tplIdx % list.length : Math.floor(rnd() * list.length)];
      const slot = L.slot(a.slotId);
      const dog = pet.species === 'Canino';
      treatments.push({
        id: 't' + (++nT), apptId: a.id, petId: a.petId, ownerId: a.ownerId, vetId: a.vetId, date: a.date,
        serviceId: a.serviceId, categoryId: svc.cat,
        diagnosis: t.dx, procedures: t.proc.slice(), medications: t.meds.map(m => ({ ...m })), recommendations: t.rec,
        vitals: {
          weight: +(pet.weight + (rnd() - 0.5) * 0.8).toFixed(1),
          temp: +(38.4 + (rnd() - 0.5) * 0.7).toFixed(1),
          hr: Math.round(dog ? 90 + rnd() * 30 : 150 + rnd() * 30),
          condition: rnd() < 0.5 ? 'Excelente' : 'Bueno',
        },
        nextVisit: t.next ? dt.add(a.date, t.next) : null,
        createdAt: dt.at(a.date, slot.start + 25 + svc.duration), seed: true,
      });
    }

    function addAppt(off, slotId, vetId, petId, svcId, status, x = {}) {
      const pet = pets.find(p => p.id === petId);
      const owner = owners.find(o => o.id === pet.ownerId);
      const svc = L.service(svcId);
      const slot = L.slot(slotId);
      const date = day(off);
      const created = off <= 0 ? dt.at(day(off - 2), 9 * 60 + (nA % 50)) : dt.at(day(-1), 14 * 60 + (++nCreated) * 3);
      const hist = [{ status: 'pendiente', at: created }];
      if (vetId) hist.push({ status: 'confirmada', at: new Date(new Date(created).getTime() + 90e3).toISOString() });
      const at = m => dt.at(date, m);
      if (['en_camino', 'iniciada', 'finalizada'].includes(status)) hist.push({ status: 'en_camino', at: at(slot.start + 5) });
      if (['iniciada', 'finalizada'].includes(status)) hist.push({ status: 'iniciada', at: at(slot.start + 25) });
      if (status === 'finalizada') hist.push({ status: 'finalizada', at: at(slot.start + 25 + svc.duration) });
      if (status === 'cancelada') hist.push({ status: 'cancelada', at: at(slot.start - 120) });
      const zoneId = x.zoneId || owner.zoneId;
      const a = {
        id: 'c' + (++nA), ownerId: owner.id, petId, serviceId: svcId, categoryId: svc.cat, vetId: vetId || null,
        date, slotId, address: owner.address, zoneId, geo: L.geoFor(zoneId, owner.address),
        status, notes: x.notes || '', price: svc.price, createdAt: created, history: hist, seed: true,
      };
      if (status === 'en_camino') { a.etaAt = Date.now() + (x.eta || 14) * 60000; a.etaMin = x.eta || 14; }
      if (status === 'finalizada') a.rating = x.rating !== undefined ? x.rating : (rnd() < 0.72 ? 5 : rnd() < 0.7 ? 4 : 3);
      appointments.push(a);
      if (status === 'finalizada' && !x.noTreatment) addTreatment(a, x.tpl);
      return a;
    }

    // ——— Hoy (agenda viva)
    addAppt(0, 's1', 'v1', 'p10', 'consulta-general', 'finalizada', { tpl: 0, rating: 5 });
    addAppt(0, 's1', 'v1', 'p12', 'vac-felina', 'finalizada', { rating: 5 });
    addAppt(0, 's2', 'v1', 'p1', 'chequeo-integral', 'en_camino', { eta: 14, notes: 'Portería: avisar a nombre de Laura Martínez.' });
    addAppt(0, 's2', 'v1', 'p8', 'vac-felina', 'confirmada');
    addAppt(0, 's3', 'v1', 'p4', 'consulta-general', 'confirmada', { notes: 'Respira con dificultad cuando hace calor.' });
    addAppt(0, 's1', 'v2', 'p9', 'vac-rabia', 'finalizada', { rating: 5 });
    addAppt(0, 's2', 'v2', 'p14', 'consulta-general', 'iniciada', { notes: 'Molestia en el oído izquierdo hace 3 días.' });
    addAppt(0, 's4', 'v2', 'p6', 'chequeo-integral', 'confirmada');
    addAppt(0, 's2', 'v3', 'p5', 'peluqueria-completa', 'finalizada', { rating: 5 });
    addAppt(0, 's3', 'v3', 'p11', 'bano-cepillado', 'confirmada');
    addAppt(0, 's4', 'v3', 'p13', 'spa-relax', 'confirmada');
    addAppt(0, 's3', 'v4', 'p7', 'obediencia-basica', 'confirmada');

    // ——— Mañana: ruta completa de la Dra. Camila (para optimizar)
    addAppt(1, 's1', 'v1', 'p13', 'consulta-general', 'confirmada');
    addAppt(1, 's1', 'v1', 'p10', 'consulta-general', 'confirmada');
    addAppt(1, 's2', 'v1', 'p4', 'vac-canina', 'confirmada');
    addAppt(1, 's2', 'v1', 'p9', 'consulta-general', 'confirmada');
    addAppt(1, 's3', 'v1', 'p8', 'consulta-general', 'confirmada');
    addAppt(1, 's3', 'v1', 'p7', 'vac-canina', 'confirmada');
    addAppt(1, 's2', 'v2', 'p11', 'vac-rabia', 'confirmada');
    addAppt(1, 's5', 'v2', 'p5', 'chequeo-integral', 'confirmada');
    addAppt(1, 's1', 'v3', 'p6', 'spa-dental', 'confirmada');
    addAppt(1, 's1', 'v3', 'p5', 'bano-cepillado', 'confirmada');
    addAppt(1, 's4', 'v3', 'p14', 'bano-cepillado', 'confirmada');
    addAppt(1, 's5', null, 'p6', 'vac-rabia', 'pendiente', { notes: 'Solicitud recibida por línea telefónica.' });

    // ——— Próximos días
    addAppt(2, 's2', 'v2', 'p2', 'vac-felina', 'confirmada', { notes: 'Luna se esconde: abrir la puerta con calma.' });
    addAppt(2, 's3', 'v1', 'p12', 'consulta-general', 'confirmada');
    addAppt(2, 's4', 'v1', 'p4', 'vac-rabia', 'confirmada');
    addAppt(2, 's1', 'v3', 'p5', 'spa-dental', 'confirmada');
    addAppt(2, 's3', 'v3', 'p11', 'peluqueria-completa', 'confirmada');
    addAppt(2, 's3', 'v4', 'p13', 'obediencia-basica', 'confirmada');
    addAppt(2, 's4', null, 'p9', 'spa-relax', 'pendiente');
    addAppt(3, 's4', 'v4', 'p3', 'obediencia-basica', 'confirmada');
    addAppt(3, 's2', 'v1', 'p10', 'vac-canina', 'confirmada');
    addAppt(3, 's2', 'v4', 'p9', 'masaje-terapeutico', 'confirmada');
    addAppt(3, 's2', null, 'p4', 'modificacion-conducta', 'pendiente');
    addAppt(4, 's3', 'v2', 'p8', 'chequeo-integral', 'confirmada');
    addAppt(4, 's2', 'v3', 'p7', 'bano-cepillado', 'confirmada');
    addAppt(4, 's5', 'v1', 'p14', 'consulta-general', 'confirmada');
    addAppt(6, 's4', 'v3', 'p2', 'bano-cepillado', 'confirmada');
    addAppt(6, 's2', 'v2', 'p11', 'chequeo-integral', 'confirmada');

    // ——— Historial de Laura (propietaria demo)
    addAppt(-12, 's2', 'v1', 'p1', 'consulta-general', 'finalizada', { tpl: 2, rating: 5 });
    addAppt(-21, 's2', 'v1', 'p3', 'vac-canina', 'finalizada', { rating: 5 });
    addAppt(-30, 's1', 'v2', 'p2', 'vac-felina', 'finalizada', { rating: 5 });
    addAppt(-45, 's3', 'v3', 'p1', 'peluqueria-completa', 'finalizada', { tpl: 1, rating: 4 });
    addAppt(-60, 's2', 'v2', 'p3', 'vac-canina', 'finalizada', { rating: 5 });
    addAppt(-90, 's3', 'v1', 'p2', 'consulta-general', 'finalizada', { tpl: 1, rating: 5 });

    // ——— Historial generado (últimos 30 días) para analítica
    const genServices = D.SERVICES.filter(s => s.cat !== 'funerario');
    for (let d = 1; d <= 60; d++) {
      const date = day(-d);
      const dow = dt.dow(date);
      // Tendencia de crecimiento: los días recientes tienen más actividad que los antiguos
      const boost = 1.2 - d * 0.0068;
      vets.forEach(v => {
        const lam = 0.82 * boost * (0.55 + rnd() * 0.9) * (v.status === 'activo' ? 1 : 0.7);
        let n = Math.floor(lam) + (rnd() < lam - Math.floor(lam) ? 1 : 0);
        if (dow === 0 && rnd() < 0.55) n = 0;
        const used = [];
        for (let k = 0; k < n; k++) {
          const cats = v.skills.filter(c => c !== 'funerario');
          const cat = pick(cats);
          const svc = pick(genServices.filter(s => s.cat === cat));
          const pet = pick(pets.filter(p => svc.species.includes(p.species)));
          let slotId = pick(['s1', 's2', 's3', 's4', 's5']);
          if (used.includes(slotId)) slotId = pick(['s1', 's2', 's3', 's4', 's5']);
          used.push(slotId);
          addAppt(-d, slotId, v.id, pet.id, svc.id, rnd() < 0.06 ? 'cancelada' : 'finalizada');
        }
      });
    }

    const nowIso = new Date().toISOString();
    const notifications = [
      { id: 'n1', to: { role: 'owner', id: 'o1' }, text: 'La Dra. Camila salió hacia tu domicilio para el chequeo de Max.', icon: 'navigation', at: nowIso, read: false },
      { id: 'n2', to: { role: 'owner', id: 'o1' }, text: 'Refuerzo de la triple felina de Luna próximo: ya tienes cita en 2 días.', icon: 'syringe', at: dt.at(day(-1), 1010), read: false },
      { id: 'n3', to: { role: 'vet', id: 'v1' }, text: 'Ruta de mañana lista: 6 visitas asignadas. Revísala en la agenda.', icon: 'route', at: dt.at(day(-1), 1100), read: false },
      { id: 'n4', to: { role: 'admin', id: 'a1' }, text: '3 solicitudes están pendientes por asignar profesional.', icon: 'alert', at: nowIso, read: false },
    ];

    return {
      version: PC.SCHEMA,
      seededOn: today,
      session: { authed: true, role: 'owner', ownerId: 'o1', vetId: 'v1', adminId: 'a1' },
      settings: { autoAssign: true },
      admins: [{ id: 'a1', name: 'Natalia Quintero', email: 'admin@petcare.co', password: 'demo1234', title: 'Gerente de operaciones' }],
      owners, vets, pets, appointments, treatments, notifications,
    };
  };
})(window.PC);
