/* Administrador · Gestión logística de rutas (RF-07): tablero arrastrable + mapa + optimizador */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useMemo, useEffect } = R;
  const { Button, Card, Badge, StatusBadge, Avatar, PetAvatar, PageHeader, SectionTitle, Select, Empty, Stat } = PC.ui;
  const L = PC.logic;
  PC.admin = PC.admin || {};

  const normalize = list => list.filter(a => L.isLocked(a)).concat(list.filter(a => !L.isLocked(a)));

  function Routes() {
    const state = PC.useStore();
    const route = PC.useRoute();
    const today = dt.today();
    const [vetId, setVetId] = useState(route.query.vet && PC.q.vet(state, route.query.vet) ? route.query.vet : (PC.q.vet(state, 'v1') ? 'v1' : state.vets[0].id));
    const [date, setDate] = useState(dt.add(today, 1));
    const [dragId, setDragId] = useState(null);
    const [overIdx, setOverIdx] = useState(null);
    const [hi, setHi] = useState(null);
    const [msg, setMsg] = useState('');
    const [work, setWork] = useState({ key: '', order: [], baseline: [], ghost: null, impact: null });

    const vet = PC.q.vet(state, vetId);
    const day = useMemo(() => normalize(L.vetDay(state, vetId, date)), [state.appointments, vetId, date]);
    const dayIds = day.map(a => a.id);
    const key = vetId + '|' + date + '|' + dayIds.join(',');
    const cur = work.key === key ? work : { key, order: dayIds, baseline: dayIds, ghost: null, impact: null };

    const byId = {};
    day.forEach(a => { byId[a.id] = a; });
    const stopsFor = ids => ids.filter(id => byId[id]).map(id => L.stopFromAppt(byId[id], L.isLocked(byId[id])));
    const ev = L.evaluate(stopsFor(cur.order));
    const ev0 = L.evaluate(stopsFor(cur.baseline));
    const legs = {};
    ev.legs.forEach(l => { legs[l.id] = l; });
    const lockedCount = cur.order.filter(id => L.isLocked(byId[id])).length;
    const freeCount = cur.order.length - lockedCount;
    const dirty = cur.order.join() !== cur.baseline.join();

    const apply = (patch) => setWork({ ...cur, ...patch });
    const petName = id => { const a = byId[id]; const p = a ? PC.q.pet(state, a.petId) : null; return p ? p.name : 'Parada'; };

    const move = (from, to) => {
      if (from < lockedCount || to < lockedCount || to >= cur.order.length || from === to || from < 0) return;
      const o = cur.order.slice();
      const [x] = o.splice(from, 1);
      o.splice(to, 0, x);
      apply({ order: o, ghost: cur.ghost || cur.order, impact: null });
      setMsg(`${petName(x)} movida a la posición ${to + 1} de ${o.length}.`);
    };

    const optimize = () => {
      if (freeCount < 2) { PC.toast.push({ title: 'Nada que optimizar', text: 'Se necesitan al menos 2 paradas sin iniciar.', tone: 'info' }); return; }
      const before = ev;
      const res = L.optimize(stopsFor(cur.order)).map(s => s.id);
      const after = L.evaluate(stopsFor(res));
      const changed = res.join() !== cur.order.join();
      apply({ order: res, ghost: changed ? cur.order : cur.ghost, impact: { dKm: before.km - after.km, dMin: (before.end - after.end), dLate: before.lateCount - after.lateCount } });
      if (!changed) PC.toast.push({ title: 'La ruta ya es óptima', text: 'No encontramos un orden con menos traslado que respete las franjas.', tone: 'info' });
      else PC.toast.push({ title: 'Ruta optimizada', text: `Ahorras ${(before.km - after.km).toFixed(1)} km y ${Math.max(0, Math.round(before.end - after.end))} min respetando las franjas.`, tone: 'gold', icon: 'wand' });
    };

    const reset = () => { apply({ order: cur.baseline, ghost: null, impact: null }); setMsg('Orden original restaurado.'); };

    const save = () => {
      PC.act.saveRoute(vetId, date, cur.order);
      PC.toast.push({ title: 'Ruta guardada', text: `${vet.name} verá el nuevo orden en su agenda de ${dt.fmt(date)}.`, tone: 'gold', icon: 'route' });
    };

    const onSelectMap = id => {
      setHi(id);
      const el = document.getElementById('stop-' + id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const mapStops = day.map(a => ({ id: a.id, geo: a.geo, status: a.status, label: petName(a.id) }));
    const marks = d => state.appointments.filter(a => a.vetId === vetId && a.date === d && a.status !== 'cancelada').length || null;
    const savedKm = ev0.km - ev.km;

    return html`<div>
      <${PageHeader} eyebrow="Logística" title="Rutas de visitas domiciliarias"
        subtitle="Ordena la jornada de cada profesional: arrastra las paradas o deja que el optimizador minimice traslados respetando las franjas."
        actions=${html`<div class="flex items-center gap-2"><${Avatar} name=${vet.name} color=${vet.color} size=${36} />
          <${Select} aria-label="Profesional" value=${vetId} onChange=${e => setVetId(e.target.value)} className="min-w-[210px]"
            options=${state.vets.map(v => ({ value: v.id, label: v.name }))} /></div>`} />

      <div class="anim-up"><${PC.shared.DateStrip} value=${date} onChange=${setDate} count=${14} marks=${marks} /></div>

      ${day.length ? html`<div class="mt-4 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <section aria-label="Orden de paradas">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <${SectionTitle} title=${`Itinerario · ${PC.cap(dt.fmt(date, { weekday: 'long', day: 'numeric', month: 'long' }))}`} icon="route" className="!mb-0" />
            <div class="flex flex-wrap gap-2">
              <${Button} variant="gold" icon="wand" onClick=${optimize} disabled=${freeCount < 2}>Optimizar ruta<//>
              <${Button} variant="soft" icon="undo" onClick=${reset} disabled=${!dirty}>Revertir<//>
              <${Button} variant="outline" icon="save" onClick=${save} disabled=${!dirty}>Guardar ruta<//>
            </div>
          </div>
          <p class="sr-only-live" aria-live="polite">${msg}</p>

          <ol class="space-y-2.5">
            ${cur.order.map((id, i) => {
              const a = byId[id];
              if (!a) return null;
              const pet = PC.q.pet(state, a.petId);
              const svc = L.service(a.serviceId);
              const leg = legs[id];
              const locked = L.isLocked(a);
              const over = overIdx === i && dragId && dragId !== id && !locked;
              return html`<li key=${id} id=${'stop-' + id}
                draggable=${!locked}
                onDragStart=${e => { if (locked) return; e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; setDragId(id); }}
                onDragEnd=${() => { setDragId(null); setOverIdx(null); }}
                onDragOver=${e => { if (dragId && !locked) { e.preventDefault(); setOverIdx(i); } }}
                onDrop=${e => { e.preventDefault(); if (dragId) move(cur.order.indexOf(dragId), i); setDragId(null); setOverIdx(null); }}
                onMouseEnter=${() => setHi(id)} onMouseLeave=${() => setHi(h => (h === id ? null : h))}
                class=${cn('glass flex items-center gap-3 rounded-2xl p-3 transition-all duration-200', locked ? 'opacity-80' : 'cursor-grab active:cursor-grabbing',
                  dragId === id && 'dragging', over && 'drag-over-line', hi === id && 'border-gold-400/70 shadow-[0_0_0_3px_rgba(53,94,75,.15)]')}>
                <span class=${cn('shrink-0', locked ? 'text-slate-500' : 'text-slate-400')} aria-hidden="true"><${Icon} name=${locked ? 'lock' : 'grip'} size=${18} /></span>
                <span class=${cn('grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold tabular', a.status === 'finalizada' ? 'border-gold-500 bg-gold-500 text-navy-900' : 'text-white')}
                  style=${a.status === 'finalizada' ? undefined : { borderColor: vet.color, background: '#FCFAF5' }}>${i + 1}</span>
                <${PetAvatar} pet=${pet} size=${40} className="hidden sm:grid" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-white">${pet ? pet.name : ''} <span class="font-normal text-slate-300">· ${svc.name}</span></p>
                  <p class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-300">
                    <span class="flex items-center gap-1"><${Icon} name="map-pin" size=${12} className="text-gold-400" />${(L.zone(a.zoneId) || {}).name}</span>
                    <span class="tabular">Franja ${L.slot(a.slotId).label}</span>
                    ${leg && i > 0 ? html`<span class="text-slate-400">+${leg.km.toFixed(1)} km</span>` : null}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  ${leg ? html`<p class=${cn('text-sm font-semibold tabular', leg.late > 0 ? 'text-sand-700' : 'text-white')}>${dt.mins(leg.arrive)}</p>` : null}
                  ${leg && leg.late > 0 ? html`<p class="text-[11px] text-sand-700">Fuera de franja</p>`
                    : leg && leg.wait > 0 ? html`<p class="text-[11px] text-slate-400">Espera ${Math.round(leg.wait)} min</p>`
                      : html`<p class="text-[11px] text-slate-400">Llegada</p>`}
                </div>
                ${locked ? html`<${StatusBadge} status=${a.status} className="hidden md:inline-flex" />` : html`<div class="flex shrink-0 flex-col gap-1">
                  <button type="button" aria-label=${`Subir ${pet ? pet.name : 'parada'}`} disabled=${i <= lockedCount} onClick=${() => move(i, i - 1)}
                    class="grid h-6 w-7 place-items-center rounded-md bg-white/[0.06] text-slate-200 hover:bg-white/15 disabled:opacity-30"><${Icon} name="chevron-up" size=${14} /></button>
                  <button type="button" aria-label=${`Bajar ${pet ? pet.name : 'parada'}`} disabled=${i === cur.order.length - 1} onClick=${() => move(i, i + 1)}
                    class="grid h-6 w-7 place-items-center rounded-md bg-white/[0.06] text-slate-200 hover:bg-white/15 disabled:opacity-30"><${Icon} name="chevron-down" size=${14} /></button>
                </div>`}
              </li>`;
            })}
          </ol>
          <p class="mt-3 text-xs text-slate-400">Las visitas finalizadas o en curso (<${Icon} name="lock" size=${11} className="inline" />) quedan fijas. Teclado: usa los botones de subir y bajar.</p>
        </section>

        <aside class="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <${Card} className="p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h2 class="flex items-center gap-2 text-base font-semibold text-white"><${Icon} name="map" size=${18} className="text-gold-400" />Mapa de la jornada</h2>
              <span class="flex items-center gap-3 text-[11px] text-slate-300">
                <span class="flex items-center gap-1.5"><span class="h-0.5 w-5 rounded" style=${{ background: vet.color }}></span>Ruta</span>
                ${cur.ghost ? html`<span class="flex items-center gap-1.5"><span class="h-0.5 w-5 border-t border-dashed border-slate-400"></span>Anterior</span>` : null}
              </span>
            </div>
            <${PC.shared.RouteMap} stops=${mapStops} order=${cur.order} ghostOrder=${cur.ghost} color=${vet.color} highlightId=${hi} onSelect=${onSelectMap}
              ariaLabel=${`Mapa de la ruta de ${vet.name} del ${dt.fmt(date)}`} />
          <//>

          <div class="grid grid-cols-2 gap-3">
            <${Stat} label="Distancia total" value=${ev.km.toFixed(1) + ' km'} icon="route" className="!p-4"
              delta=${dirty && Math.abs(savedKm) >= 0.05 ? { up: savedKm > 0, text: `${Math.abs(savedKm).toFixed(1)} km ${savedKm > 0 ? 'menos' : 'más'}` } : null} />
            <${Stat} label="Tiempo de traslado" value=${Math.round(ev.travel) + ' min'} icon="clock" tone="sky" className="!p-4"
              hint=${`${ev.waitMin ? Math.round(ev.waitMin) + ' min de espera' : 'Sin esperas'}`} />
            <${Stat} label="Fin de jornada" value=${dt.mins(ev.end)} icon="flag" tone="violet" className="!p-4"
              delta=${dirty && Math.abs(ev0.end - ev.end) >= 1 ? { up: ev0.end > ev.end, text: `${Math.abs(Math.round(ev0.end - ev.end))} min ${ev0.end > ev.end ? 'antes' : 'después'}` } : null} />
            <${Stat} label="Fuera de franja" value=${ev.lateCount} icon=${ev.lateCount ? 'alert' : 'check-circle'} tone=${ev.lateCount ? 'amber' : 'emerald'} className="!p-4"
              hint=${ev.lateCount ? `${Math.round(ev.lateMin)} min de retraso acumulado` : 'Todas dentro de su franja'} />
          </div>

          ${cur.impact && dirty ? html`<div class="anim-pop rounded-2xl border border-gold-500/35 bg-gold-500/10 p-4">
            <p class="flex items-center gap-2 text-sm font-semibold text-gold-200"><${Icon} name="wand" size=${16} />Impacto de la optimización</p>
            <p class="mt-1 text-sm text-slate-100">${cur.impact.dKm > 0.05 ? `Se evitan ${cur.impact.dKm.toFixed(1)} km` : 'Distancia similar'}${cur.impact.dLate > 0 ? ` y ${cur.impact.dLate} ${cur.impact.dLate === 1 ? 'retraso' : 'retrasos'} de franja` : ''}. Guarda la ruta para enviarla al profesional.</p>
          </div>` : null}
        </aside>
      </div>` : html`<div class="mt-6"><${Empty} icon="route" title="Sin visitas para este profesional y fecha"
        text="Elige otra fecha con citas (marcadas con un número) o asigna nuevas citas desde Asignación."
        action=${html`<${Button} variant="soft" icon="users" onClick=${() => PC.go('/admin/assign')}>Ir a asignación<//>`} /></div>`}
    </div>`;
  }

  PC.admin.Routes = Routes;
})(window.PC);
