/* Lógica de negocio pura: disponibilidad, asignación inteligente, rutas y métricas */
(function (PC) {
  'use strict';
  const { dt } = PC;
  const D = PC.data;
  const L = {};

  L.CAP = 2;               // visitas máximas por profesional y franja
  L.START_MIN = 480;       // inicio de jornada (08:00)
  L.SPEED_KMH = 24;        // velocidad urbana promedio
  L.KM_PER_UNIT = 0.3;     // unidad de mapa → km (incluye factor vial)
  L.PREP_MIN = 10;         // alistamiento + cierre por parada

  L.service = id => D.SERVICES.find(s => s.id === id);
  L.category = id => D.CATEGORIES.find(c => c.id === id);
  L.slot = id => D.SLOTS.find(s => s.id === id);
  L.zone = id => D.ZONES.find(z => z.id === id);
  L.catOfService = id => { const s = L.service(id); return s ? s.cat : null; };

  L.hash = str => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // Coordenada determinista: centro de zona + pequeña dispersión por dirección
  L.geoFor = (zoneId, key = '') => {
    const z = L.zone(zoneId) || D.BASE;
    const h = L.hash(zoneId + '|' + key);
    const jx = ((h % 1000) / 1000 - 0.5) * 6;
    const jy = (((h >>> 10) % 1000) / 1000 - 0.5) * 6;
    return { x: +(z.x + jx).toFixed(1), y: +(z.y + jy).toFixed(1) };
  };

  L.km = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * L.KM_PER_UNIT;
  L.travelMin = km => Math.round((km / L.SPEED_KMH) * 60);

  // ——— Consultas de citas
  function sortRoute(list) {
    const hasRoute = list.some(a => a.routeOrder != null);
    return list.slice().sort((a, b) => {
      if (hasRoute) {
        const ra = a.routeOrder != null ? a.routeOrder : 999;
        const rb = b.routeOrder != null ? b.routeOrder : 999;
        if (ra !== rb) return ra - rb;
      }
      const sa = L.slot(a.slotId).start, sb = L.slot(b.slotId).start;
      return sa - sb || (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  }
  L.sortRoute = sortRoute;

  L.vetDay = (state, vetId, date) =>
    sortRoute(state.appointments.filter(a => a.vetId === vetId && a.date === date && a.status !== 'cancelada'));

  L.slotCount = (state, vetId, date, slotId) =>
    state.appointments.filter(a => a.vetId === vetId && a.date === date && a.slotId === slotId && a.status !== 'cancelada').length;

  L.slotPast = (date, slotId) => {
    const diff = dt.diff(date, dt.today());
    if (diff < 0) return true;
    if (diff > 0) return false;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= L.slot(slotId).end;
  };

  // ¿El profesional puede atender esa cita? → { ok, reason }
  L.vetFit = (state, vet, { date, slotId, categoryId, ignoreId }) => {
    if (vet.status !== 'activo') return { ok: false, reason: 'En descanso' };
    if (!vet.skills.includes(categoryId)) return { ok: false, reason: 'No presta este servicio' };
    const dow = dt.dow(date);
    if (!(vet.availability[dow] || []).includes(slotId)) return { ok: false, reason: 'Sin disponibilidad en esa franja' };
    const used = state.appointments.filter(a => a.id !== ignoreId && a.vetId === vet.id && a.date === date && a.slotId === slotId && a.status !== 'cancelada').length;
    if (used >= L.CAP) return { ok: false, reason: 'Franja completa' };
    return { ok: true, reason: 'Disponible' };
  };

  L.eligibleVets = (state, q) => state.vets.filter(v => L.vetFit(state, v, q).ok);

  // Puntuación de idoneidad (mayor = mejor)
  L.score = (state, vet, q) => {
    const load = state.appointments.filter(a => a.vetId === vet.id && a.date === q.date && a.status !== 'cancelada').length;
    return (q.zoneId && vet.zones.includes(q.zoneId) ? 3 : 0) + (6 - Math.min(load, 6)) * 0.5 + vet.rating / 5;
  };

  L.rankVets = (state, q) =>
    state.vets
      .map(v => ({ vet: v, fit: L.vetFit(state, v, q), score: L.score(state, v, q), zoneMatch: !!(q.zoneId && v.zones.includes(q.zoneId)) }))
      .sort((a, b) => (b.fit.ok - a.fit.ok) || (b.score - a.score));

  L.bestVet = (state, q) => {
    const r = L.rankVets(state, q).find(x => x.fit.ok);
    return r ? r.vet : null;
  };

  // Disponibilidad para el selector de agendamiento
  L.slotInfo = (state, date, slotId, categoryId) => {
    if (L.slotPast(date, slotId)) return { free: 0, past: true, vets: [] };
    const vets = L.eligibleVets(state, { date, slotId, categoryId });
    let free = 0;
    vets.forEach(v => { free += L.CAP - L.slotCount(state, v.id, date, slotId); });
    return { free, past: false, vets };
  };

  L.dayAvailability = (state, date, categoryId) =>
    D.SLOTS.reduce((n, s) => n + (L.slotInfo(state, date, s.id, categoryId).free > 0 ? 1 : 0), 0);

  // ——— Rutas
  L.stopFromAppt = (a, locked) => {
    const sl = L.slot(a.slotId), sv = L.service(a.serviceId);
    return { id: a.id, geo: a.geo, slotStart: sl.start, slotEnd: sl.end, duration: sv.duration + L.PREP_MIN, locked: !!locked, appt: a };
  };

  L.isLocked = a => ['finalizada', 'iniciada', 'en_camino'].includes(a.status);

  L.evaluate = (stops, base = D.BASE, startMin = L.START_MIN) => {
    let t = startMin, pos = base, km = 0, travel = 0, waitMin = 0, lateMin = 0;
    const legs = [];
    stops.forEach(s => {
      const d = L.km(pos, s.geo);
      const tm = L.travelMin(d);
      const arrive = t + tm;
      const start = Math.max(arrive, s.slotStart);
      const wait = start - arrive;
      const late = Math.max(0, arrive - s.slotEnd);
      legs.push({ id: s.id, km: d, travel: tm, arrive, start, wait, late, depart: start + s.duration });
      km += d; travel += tm; waitMin += wait; lateMin += late;
      t = start + s.duration; pos = s.geo;
    });
    return { legs, km, travel, waitMin, lateMin, end: t, lateCount: legs.filter(l => l.late > 0).length };
  };

  // Optimiza el orden de las paradas libres respetando franjas (permutaciones exactas ≤ 8, 2-opt si hay más)
  L.optimize = (stops, base = D.BASE) => {
    const fixed = stops.filter(s => s.locked);
    const free = stops.filter(s => !s.locked);
    if (free.length < 2) return stops.slice();
    const cost = order => {
      const e = L.evaluate(fixed.concat(order), base);
      return e.km + e.lateMin * 1.2 + e.waitMin * 0.03;
    };
    let best = free.slice();
    let bestCost = cost(best);
    if (free.length <= 8) {
      const arr = free.slice();
      const c = new Array(arr.length).fill(0);
      const check = () => {
        const v = cost(arr);
        if (v < bestCost - 1e-9) { bestCost = v; best = arr.slice(); }
      };
      check();
      let i = 0;
      while (i < arr.length) {
        if (c[i] < i) {
          const k = i % 2 === 0 ? 0 : c[i];
          const tmp = arr[k]; arr[k] = arr[i]; arr[i] = tmp;
          check();
          c[i]++; i = 0;
        } else { c[i] = 0; i++; }
      }
    } else {
      let improved = true, guard = 0;
      while (improved && guard++ < 200) {
        improved = false;
        for (let i = 0; i < best.length - 1; i++) {
          for (let j = i + 1; j < best.length; j++) {
            const cand = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
            const v = cost(cand);
            if (v < bestCost - 1e-9) { best = cand; bestCost = v; improved = true; }
          }
        }
      }
    }
    return fixed.concat(best);
  };

  // ——— Métricas
  L.revenue = list => list.filter(a => a.status === 'finalizada').reduce((s, a) => s + (a.price || 0), 0);

  L.treatmentsForPet = (state, petId) =>
    state.treatments.filter(t => t.petId === petId).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  L.apptsForPet = (state, petId) =>
    state.appointments.filter(a => a.petId === petId).sort((a, b) => b.date.localeCompare(a.date));

  L.upcomingFor = (appts) =>
    appts.filter(a => ['pendiente', 'confirmada', 'en_camino', 'iniciada'].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date) || L.slot(a.slotId).start - L.slot(b.slotId).start);

  L.nextVaccine = pet => {
    const list = (pet.vaccines || []).filter(v => v.next).slice().sort((a, b) => a.next.localeCompare(b.next));
    return list[0] || null;
  };

  PC.logic = L;
})(window.PC);
