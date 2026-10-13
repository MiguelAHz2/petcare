/* Estado global, persistencia (localStorage), sincronización entre pestañas, acciones y router */
(function (PC) {
  'use strict';
  const R = window.React;
  const { dt } = PC;
  const L = PC.logic;
  const D = PC.data;
  const KEY = 'petcare.domicilio.v' + PC.SCHEMA;

  // Las fechas de los datos demo "viajan" con el calendario para que la agenda siempre esté viva
  function rebase(s) {
    const today = dt.today();
    const delta = dt.diff(today, s.seededOn || today);
    if (!delta) return s;
    const sh = d => (d ? dt.add(d, delta) : d);
    const shTs = ts => (ts ? new Date(new Date(ts).getTime() + delta * 864e5).toISOString() : ts);
    return {
      ...s,
      seededOn: today,
      appointments: s.appointments.map(a => {
        if (!a.seed) return a;
        const n = { ...a, date: sh(a.date), createdAt: shTs(a.createdAt), history: a.history.map(h => ({ ...h, at: shTs(h.at) })) };
        if (n.status === 'en_camino' && n.etaMin) n.etaAt = Date.now() + n.etaMin * 60000;
        return n;
      }),
      treatments: s.treatments.map(t => (t.seed ? { ...t, date: sh(t.date), nextVisit: sh(t.nextVisit), createdAt: shTs(t.createdAt) } : t)),
      pets: s.pets.map(p => (p.seed ? { ...p, vaccines: (p.vaccines || []).map(v => ({ ...v, date: sh(v.date), next: sh(v.next) })) } : p)),
      notifications: s.notifications.map(n => (/^n\d$/.test(n.id) ? { ...n, at: shTs(n.at) } : n)),
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.version === PC.SCHEMA && Array.isArray(s.appointments)) return rebase(s);
      }
    } catch (e) { /* almacenamiento no disponible */ }
    return PC.buildSeed();
  }

  let state = load();
  const listeners = new Set();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* cuota o modo privado */ } };
  const emit = () => listeners.forEach(f => f());

  const store = {
    getState: () => state,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    update(fn) { state = fn(state); persist(); emit(); },
    replace(s) { state = s; persist(); emit(); },
  };
  PC.store = store;
  PC.useStore = () => R.useSyncExternalStore(store.subscribe, store.getState);

  // Sincronización en "tiempo real" entre pestañas del mismo navegador
  window.addEventListener('storage', e => {
    if (e.key !== KEY || !e.newValue) return;
    try { state = JSON.parse(e.newValue); emit(); } catch (err) { /* ignora */ }
  });

  // ——— Selectores
  const byId = (arr, id) => arr.find(x => x.id === id);
  PC.q = {
    pet: (s, id) => byId(s.pets, id),
    owner: (s, id) => byId(s.owners, id),
    vet: (s, id) => byId(s.vets, id),
    appt: (s, id) => byId(s.appointments, id),
    currentOwner: s => byId(s.owners, s.session.ownerId) || s.owners[0],
    currentVet: s => byId(s.vets, s.session.vetId) || s.vets[0],
    currentAdmin: s => byId(s.admins, s.session.adminId) || s.admins[0],
    petsOf: (s, ownerId) => s.pets.filter(p => p.ownerId === ownerId && !p.archived),
    apptsOf: (s, ownerId) => s.appointments.filter(a => a.ownerId === ownerId),
    treatmentOfAppt: (s, apptId) => s.treatments.find(t => t.apptId === apptId),
    notificationsFor: (s, role) => {
      const id = role === 'owner' ? s.session.ownerId : role === 'vet' ? s.session.vetId : s.session.adminId;
      return s.notifications.filter(n => n.to.role === role && n.to.id === id).sort((a, b) => b.at.localeCompare(a.at));
    },
  };

  const note = (to, text, icon) => ({ id: PC.uid('n'), to, text, icon: icon || 'bell', at: new Date().toISOString(), read: false });
  const toast = (...a) => PC.toast && PC.toast.push(...a);
  const firstName = n => (n || '').replace(/^(Dr\.|Dra\.)\s*/i, '').split(' ')[0];

  // ——— Acciones
  const act = {};
  PC.act = act;

  act.setRole = role => store.update(s => ({ ...s, session: { ...s.session, role } }));

  act.login = (email, password) => {
    const s = store.getState();
    const e = (email || '').trim().toLowerCase();
    const owner = s.owners.find(o => o.email.toLowerCase() === e);
    const vet = s.vets.find(v => v.email.toLowerCase() === e);
    const admin = s.admins.find(a => a.email.toLowerCase() === e);
    const u = owner || vet || admin;
    if (!u || u.password !== password) return { ok: false, error: 'Correo o contraseña incorrectos.' };
    const role = owner ? 'owner' : vet ? 'vet' : 'admin';
    store.update(st => ({
      ...st,
      session: { ...st.session, authed: true, role, ...(owner ? { ownerId: u.id } : vet ? { vetId: u.id } : { adminId: u.id }) },
    }));
    return { ok: true, role, user: u };
  };

  act.logout = () => store.update(s => ({ ...s, session: { ...s.session, authed: false } }));

  act.register = data => {
    const s = store.getState();
    const email = data.email.trim().toLowerCase();
    if ([...s.owners, ...s.vets, ...s.admins].some(u => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
    }
    const owner = {
      id: PC.uid('o'), name: data.name.trim(), email, password: data.password, phone: data.phone || '', address: data.address || '',
      zoneId: data.zoneId || 'chico', notify: { email: true, whatsapp: true, push: false }, createdAt: new Date().toISOString(),
    };
    store.update(st => ({
      ...st, owners: [...st.owners, owner],
      session: { ...st.session, authed: true, role: 'owner', ownerId: owner.id },
      notifications: [note({ role: 'owner', id: owner.id }, '¡Bienvenido a PetCare Domicilio! Registra a tu primera mascota para empezar.', 'paw'), ...st.notifications],
    }));
    return { ok: true, owner };
  };

  act.updateProfile = (ownerId, patch) =>
    store.update(s => ({ ...s, owners: s.owners.map(o => (o.id === ownerId ? { ...o, ...patch } : o)) }));

  act.addPet = data => {
    const pet = {
      id: PC.uid('p'), ...data, vaccines: data.vaccines || [], createdAt: new Date().toISOString(),
    };
    store.update(s => ({ ...s, pets: [...s.pets, pet] }));
    return pet;
  };
  act.updatePet = (id, patch) => store.update(s => ({ ...s, pets: s.pets.map(p => (p.id === id ? { ...p, ...patch } : p)) }));
  // Archiva la mascota (conserva el historial clínico) y cancela sus citas próximas
  act.removePet = id => store.update(s => {
    const now = new Date().toISOString();
    return {
      ...s,
      pets: s.pets.map(p => (p.id === id ? { ...p, archived: true } : p)),
      appointments: s.appointments.map(a => (a.petId === id && ['pendiente', 'confirmada'].includes(a.status)
        ? { ...a, status: 'cancelada', history: [...a.history, { status: 'cancelada', at: now }] } : a)),
    };
  });

  // Agendamiento (RF-04) con asignación automática (RF-06) si está activada
  act.createAppointment = ({ ownerId, petId, serviceId, date, slotId, address, zoneId, notes }) => {
    const s = store.getState();
    const svc = L.service(serviceId);
    const pet = byId(s.pets, petId);
    const owner = byId(s.owners, ownerId);
    let vet = null;
    if (s.settings.autoAssign) vet = L.bestVet(s, { date, slotId, categoryId: svc.cat, zoneId });
    const now = new Date().toISOString();
    const history = [{ status: 'pendiente', at: now }];
    if (vet) history.push({ status: 'confirmada', at: new Date(Date.now() + 1000).toISOString() });
    const appt = {
      id: PC.uid('c'), ownerId, petId, serviceId, categoryId: svc.cat, vetId: vet ? vet.id : null,
      date, slotId, address, zoneId, geo: L.geoFor(zoneId, address), status: vet ? 'confirmada' : 'pendiente',
      notes: notes || '', price: svc.price, createdAt: now, history,
    };
    const notes_ = [];
    const slot = L.slot(slotId);
    if (vet) {
      notes_.push(note({ role: 'vet', id: vet.id }, `Nueva cita asignada: ${pet.name} · ${svc.name} · ${PC.dt.rel(date)} ${slot.label}.`, 'calendar-plus'));
      notes_.push(note({ role: 'owner', id: ownerId }, `Tu cita para ${pet.name} fue confirmada con ${vet.name}.`, 'calendar-check'));
    } else {
      notes_.push(note({ role: 'admin', id: s.session.adminId }, `Nueva solicitud sin profesional: ${pet.name} · ${svc.name} (${PC.dt.rel(date)}).`, 'alert'));
      notes_.push(note({ role: 'owner', id: ownerId }, `Recibimos tu solicitud para ${pet.name}. Te confirmaremos el profesional en breve.`, 'clock'));
    }
    store.update(st => ({ ...st, appointments: [...st.appointments, appt], notifications: [...notes_, ...st.notifications] }));
    return { appt, vet, owner };
  };

  act.cancelAppointment = id => {
    const s = store.getState();
    const a = byId(s.appointments, id);
    if (!a) return;
    const pet = byId(s.pets, a.petId);
    const extra = [];
    if (a.vetId) extra.push(note({ role: 'vet', id: a.vetId }, `Cita cancelada: ${pet ? pet.name : 'Mascota'} · ${PC.dt.rel(a.date)}.`, 'x'));
    store.update(st => ({
      ...st,
      appointments: st.appointments.map(x => (x.id === id ? { ...x, status: 'cancelada', history: [...x.history, { status: 'cancelada', at: new Date().toISOString() }] } : x)),
      notifications: [...extra, ...st.notifications],
    }));
  };

  act.assignAppointment = (id, vetId) => {
    const s = store.getState();
    const a = byId(s.appointments, id);
    const vet = byId(s.vets, vetId);
    if (!a || !vet) return { ok: false, error: 'No se encontró la cita o el profesional.' };
    const fit = L.vetFit(s, vet, { date: a.date, slotId: a.slotId, categoryId: a.categoryId, ignoreId: a.id });
    if (!fit.ok) return { ok: false, error: `${vet.name}: ${fit.reason.toLowerCase()}.` };
    const pet = byId(s.pets, a.petId);
    const svc = L.service(a.serviceId);
    const now = new Date().toISOString();
    const wasPending = a.status === 'pendiente';
    const extra = [
      note({ role: 'vet', id: vetId }, `Se te asignó: ${pet.name} · ${svc.name} · ${PC.dt.rel(a.date)} ${L.slot(a.slotId).label}.`, 'calendar-plus'),
      note({ role: 'owner', id: a.ownerId }, `${vet.name} atenderá a ${pet.name}.`, 'calendar-check'),
    ];
    store.update(st => ({
      ...st,
      appointments: st.appointments.map(x => (x.id === id ? {
        ...x, vetId, routeOrder: undefined, status: wasPending ? 'confirmada' : x.status,
        history: wasPending ? [...x.history, { status: 'confirmada', at: now }] : x.history,
      } : x)),
      notifications: [...extra, ...st.notifications],
    }));
    return { ok: true, vet, appt: a };
  };

  act.autoAssignPending = () => {
    let n = 0;
    store.getState().appointments.filter(a => a.status === 'pendiente').forEach(a => {
      const s = store.getState();
      const v = L.bestVet(s, { date: a.date, slotId: a.slotId, categoryId: a.categoryId, zoneId: a.zoneId });
      if (v && act.assignAppointment(a.id, v.id).ok) n++;
    });
    return n;
  };

  act.setStatus = (id, next, extra) => {
    const s = store.getState();
    const a = byId(s.appointments, id);
    if (!a) return;
    const pet = byId(s.pets, a.petId);
    const vet = byId(s.vets, a.vetId);
    const patch = { status: next, history: [...a.history, { status: next, at: new Date().toISOString() }] };
    let text = '', icon = 'bell';
    if (next === 'en_camino') {
      const day = L.vetDay(s, a.vetId, a.date);
      const idx = day.findIndex(x => x.id === id);
      const prev = idx > 0 ? day[idx - 1].geo : D.BASE;
      const eta = Math.max(8, L.travelMin(L.km(prev, a.geo)));
      patch.etaAt = Date.now() + eta * 60000;
      patch.etaMin = eta;
      text = `${vet ? vet.name : 'El profesional'} va en camino a atender a ${pet.name}. Llegada estimada: ${eta} min.`;
      icon = 'navigation';
    } else if (next === 'iniciada') {
      text = `La atención de ${pet.name} ha comenzado.`; icon = 'stethoscope';
    } else if (next === 'finalizada') {
      text = `La atención de ${pet.name} finalizó. Ya puedes ver el registro clínico.`; icon = 'check-circle';
    }
    if (extra) Object.assign(patch, extra);
    store.update(st => ({
      ...st,
      appointments: st.appointments.map(x => (x.id === id ? { ...x, ...patch } : x)),
      notifications: text ? [note({ role: 'owner', id: a.ownerId }, text, icon), ...st.notifications] : st.notifications,
    }));
  };

  // Registro de tratamiento (RF-05): guarda el expediente y finaliza la visita
  act.saveTreatment = data => {
    const s = store.getState();
    const a = byId(s.appointments, data.apptId);
    const svc = L.service(a.serviceId);
    const pet = byId(s.pets, a.petId);
    const now = new Date().toISOString();
    const t = {
      id: PC.uid('t'), apptId: a.id, petId: a.petId, ownerId: a.ownerId, vetId: a.vetId, date: a.date,
      serviceId: a.serviceId, categoryId: a.categoryId,
      diagnosis: data.diagnosis.trim(), procedures: data.procedures, medications: data.medications,
      recommendations: (data.recommendations || '').trim(), vitals: data.vitals, nextVisit: data.nextVisit || null,
      createdAt: now,
    };
    store.update(st => ({
      ...st,
      treatments: [...st.treatments.filter(x => x.apptId !== a.id), t],
      appointments: st.appointments.map(x => (x.id === a.id ? { ...x, status: 'finalizada', history: [...x.history, { status: 'finalizada', at: now }] } : x)),
      pets: st.pets.map(p => {
        if (p.id !== a.petId) return p;
        const np = { ...p };
        if (data.vitals && data.vitals.weight) np.weight = data.vitals.weight;
        if (svc.cat === 'vacunacion') {
          np.vaccines = [...(p.vaccines || []), { name: svc.name, date: a.date, next: data.nextVisit || dt.add(a.date, 365) }];
        }
        return np;
      }),
      notifications: [
        note({ role: 'owner', id: a.ownerId }, `Nuevo registro clínico de ${pet.name}: ${t.diagnosis.replace(/[.\s]+$/, '')}.`, 'clipboard'),
        ...st.notifications,
      ],
    }));
    return t;
  };

  act.rateAppointment = (id, rating) =>
    store.update(s => ({ ...s, appointments: s.appointments.map(a => (a.id === id ? { ...a, rating } : a)) }));

  // Personal
  act.addVet = data => {
    const vet = {
      id: PC.uid('v'), password: 'demo1234', rating: 5.0, reviews: 0, since: new Date().getFullYear(), status: 'activo',
      availability: { 0: [], 1: ['s1', 's2', 's3', 's4'], 2: ['s1', 's2', 's3', 's4'], 3: ['s1', 's2', 's3', 's4'], 4: ['s1', 's2', 's3', 's4'], 5: ['s1', 's2', 's3', 's4'], 6: [] },
      ...data,
    };
    store.update(s => ({ ...s, vets: [...s.vets, vet] }));
    return vet;
  };
  act.updateVet = (id, patch) => store.update(s => ({ ...s, vets: s.vets.map(v => (v.id === id ? { ...v, ...patch } : v)) }));
  act.setVetAvailability = (vetId, dow, slotId, on) =>
    store.update(s => ({
      ...s,
      vets: s.vets.map(v => {
        if (v.id !== vetId) return v;
        const cur = v.availability[dow] || [];
        const next = on ? Array.from(new Set([...cur, slotId])).sort() : cur.filter(x => x !== slotId);
        return { ...v, availability: { ...v.availability, [dow]: next } };
      }),
    }));

  act.saveRoute = (vetId, date, order) => {
    const pos = {};
    order.forEach((id, i) => { pos[id] = i; });
    store.update(s => ({
      ...s,
      appointments: s.appointments.map(a => (a.vetId === vetId && a.date === date && pos[a.id] !== undefined ? { ...a, routeOrder: pos[a.id] } : a)),
      notifications: [
        note({ role: 'vet', id: vetId }, `Tu ruta del ${dt.fmt(date)} fue reordenada por logística. Revisa el nuevo orden en tu agenda.`, 'route'),
        ...s.notifications,
      ],
    }));
  };

  act.setAutoAssign = on => store.update(s => ({ ...s, settings: { ...s.settings, autoAssign: on } }));

  act.markRead = role => store.update(s => {
    const id = role === 'owner' ? s.session.ownerId : role === 'vet' ? s.session.vetId : s.session.adminId;
    return { ...s, notifications: s.notifications.map(n => (n.to.role === role && n.to.id === id ? { ...n, read: true } : n)) };
  });

  act.resetDemo = () => {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ }
    store.replace(PC.buildSeed());
  };

  PC.firstName = firstName;

  // ——— Router por hash:  #/rol/pagina?clave=valor
  PC.go = path => { window.location.hash = '#' + path; };
  PC.parseRoute = () => {
    const raw = (window.location.hash || '').replace(/^#/, '');
    const [p, q] = raw.split('?');
    const parts = p.split('/').filter(Boolean);
    const query = {};
    if (q) q.split('&').forEach(kv => { const [k, v] = kv.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { role: parts[0] || '', page: parts[1] || '', query, path: '/' + parts.join('/') };
  };
  PC.useRoute = () => {
    const [, setTick] = R.useState(0);
    R.useEffect(() => {
      const f = () => setTick(t => t + 1);
      window.addEventListener('hashchange', f);
      return () => window.removeEventListener('hashchange', f);
    }, []);
    return PC.parseRoute();
  };
})(window.PC);
