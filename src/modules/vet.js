/* Veterinario / Profesional · Agenda (RF-01, RF-06), tratamientos (RF-05), pacientes y disponibilidad */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useMemo } = R;
  const { Button, Card, Badge, StatusBadge, PetAvatar, Avatar, PageHeader, SectionTitle, Stat, Select, Input, Empty, Toggle, Segmented } = PC.ui;
  const L = PC.logic;
  const D = PC.data;
  PC.vet = PC.vet || {};

  const setVet = id => PC.store.update(s => ({ ...s, session: { ...s.session, vetId: id } }));

  function VetPicker({ state, vet }) {
    return html`<div class="flex items-center gap-2">
      <${Avatar} name=${vet.name} color=${vet.color} size=${36} />
      <${Select} aria-label="Ver la agenda como" value=${vet.id} onChange=${e => setVet(e.target.value)}
        options=${state.vets.map(v => ({ value: v.id, label: v.name + (v.status !== 'activo' ? ' (en descanso)' : '') }))} className="min-w-[210px]" />
    </div>`;
  }

  // ——— Tarjeta de parada en la agenda
  function StopCard({ appt, index, leg, total, onTreat, onPet }) {
    const state = PC.useStore();
    const pet = PC.q.pet(state, appt.petId);
    const owner = PC.q.owner(state, appt.ownerId);
    const svc = L.service(appt.serviceId);
    const slot = L.slot(appt.slotId);
    const treat = PC.q.treatmentOfAppt(state, appt.id);
    const [showT, setShowT] = useState(false);
    const done = appt.status === 'finalizada';
    const finishedAt = done ? (appt.history.find(h => h.status === 'finalizada') || {}).at : null;

    const go = (next, title, text) => {
      PC.act.setStatus(appt.id, next);
      PC.toast.push({ title, text, tone: 'info', icon: next === 'en_camino' ? 'navigation' : 'stethoscope' });
    };

    return html`<li class="relative flex gap-4">
      <div class="flex flex-col items-center">
        <span class=${cn('z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold',
          done ? 'border-gold-500 bg-gold-500 text-navy-900' : appt.status === 'iniciada' ? 'border-emerald-400 bg-emerald-400/20 text-emerald-200'
            : appt.status === 'en_camino' ? 'border-violet-400 bg-violet-400/20 text-violet-200' : 'border-white/20 bg-navy-900 text-white')}>
          ${done ? html`<${Icon} name="check" size=${16} strokeWidth=${3} />` : index + 1}</span>
        ${index < total - 1 ? html`<span class="w-px flex-1 bg-white/15" aria-hidden="true"></span>` : null}
      </div>

      <${Card} className=${cn('mb-5 flex-1 p-4 sm:p-5', done && 'opacity-90')}>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
            <span class="flex items-center gap-1.5 font-medium text-slate-100"><${Icon} name="clock" size=${14} className="text-gold-400" />
              ${done && finishedAt ? 'Finalizada ' + dt.time(finishedAt) : leg ? 'Llegada estimada ' + dt.mins(leg.start) : slot.label}</span>
            <span>Franja ${slot.label}</span>
            ${leg && leg.late > 0 && !done ? html`<${Badge} tone="amber" icon="alert">Fuera de franja<//>` : null}
          </p>
          <${StatusBadge} status=${appt.status} />
        </div>

        <div class="mt-3 flex items-start gap-3">
          <${PetAvatar} pet=${pet} size=${48} />
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-base font-semibold text-white">${pet ? pet.name : 'Mascota'} <span class="text-sm font-normal text-slate-300">· ${pet ? pet.breed : ''}</span></h3>
            <p class="text-sm text-slate-200">${svc.name} <span class="text-slate-400">· ${svc.duration} min</span></p>
            <p class="mt-0.5 text-xs text-slate-300">${pet ? `${PC.formatAge(pet.ageMonths)} · ${pet.weight} kg · ${pet.sex}` : ''}</p>
          </div>
        </div>

        <div class="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
          <p class="flex items-start gap-1.5"><${Icon} name="map-pin" size=${14} className="mt-0.5 shrink-0 text-gold-400" /><span>${appt.address} <span class="text-slate-400">· ${(L.zone(appt.zoneId) || {}).name}</span></span></p>
          <p class="flex items-center gap-1.5"><${Icon} name="user" size=${14} className="shrink-0 text-gold-400" />${owner ? owner.name : ''}${owner && owner.phone ? ' · ' + owner.phone : ''}</p>
        </div>

        ${(pet && pet.care && pet.care.length) || appt.notes ? html`<div class="mt-3 flex flex-wrap items-center gap-1.5">
          ${(pet.care || []).map(c => html`<${Badge} key=${c} tone="amber" icon="alert">${c}<//>`)}
          ${appt.notes ? html`<span class="text-xs italic text-slate-300">“${appt.notes}”</span>` : null}
        </div>` : null}

        <div class="mt-4 flex flex-wrap gap-2">
          ${appt.status === 'confirmada' ? html`<${Button} variant="violet" size="sm" icon="navigation"
            onClick=${() => go('en_camino', 'Vas en camino', `Avisamos a ${owner ? PC.firstName(owner.name) : 'la familia'} que llegas pronto.`)}>Salir en camino<//>` : null}
          ${appt.status === 'en_camino' ? html`<${Button} variant="success" size="sm" icon="play"
            onClick=${() => go('iniciada', 'Atención iniciada', `Cuando termines, registra el tratamiento de ${pet.name}.`)}>Llegué · Iniciar atención<//>` : null}
          ${appt.status === 'iniciada' ? html`<${Button} variant="gold" size="sm" icon="clipboard" onClick=${() => onTreat(appt)}>Registrar tratamiento y finalizar<//>` : null}
          ${done && treat ? html`<${Button} variant="soft" size="sm" icon=${showT ? 'chevron-up' : 'file-text'} onClick=${() => setShowT(s => !s)}>${showT ? 'Ocultar registro' : 'Ver registro clínico'}<//>` : null}
          <${Button} variant="ghost" size="sm" icon="eye" onClick=${() => onPet(appt.petId)}>Antecedentes<//>
        </div>
        ${showT && treat ? html`<div class="mt-3 anim-fade"><${PC.shared.TreatmentCard} t=${treat} defaultOpen /></div>` : null}
      <//>
    </li>`;
  }

  function Agenda() {
    const state = PC.useStore();
    const vet = PC.q.currentVet(state);
    const [date, setDate] = useState(dt.today());
    const [treat, setTreat] = useState(null);
    const [petDrawer, setPetDrawer] = useState(null);

    const day = useMemo(() => L.vetDay(state, vet.id, date), [state.appointments, vet.id, date]);
    const stops = day.map(a => L.stopFromAppt(a, false));
    const ev = L.evaluate(stops);
    const legs = {};
    ev.legs.forEach(l => { legs[l.id] = l; });
    const finished = day.filter(a => a.status === 'finalizada').length;
    const pending = day.length - finished;
    const income = L.revenue(day);
    const next = day.find(a => a.status !== 'finalizada');

    const mapStops = day.map(a => ({ id: a.id, geo: a.geo, status: a.status, label: (PC.q.pet(state, a.petId) || {}).name }));
    const marks = d => state.appointments.filter(a => a.vetId === vet.id && a.date === d && a.status !== 'cancelada').length || null;
    const treatAppt = treat ? PC.q.appt(state, treat) : null;

    return html`<div>
      <${PageHeader} eyebrow="Mi jornada" title=${'Agenda de ' + vet.name}
        subtitle="Las citas llegan asignadas por la empresa. Actualiza tu avance para que la familia lo vea en vivo."
        actions=${html`<${VetPicker} state=${state} vet=${vet} />`} />

      ${vet.status !== 'activo' ? html`<p class="mb-5 flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 text-sm text-amber-100"><${Icon} name="info" size=${16} />Estás marcado en descanso: no recibirás nuevas asignaciones. Puedes reactivarte en Disponibilidad.</p>` : null}

      <div class="anim-up"><${PC.shared.DateStrip} value=${date} onChange=${setDate} count=${10} marks=${marks} /></div>

      <div class="my-5 grid grid-cols-2 gap-3 lg:grid-cols-4 anim-up" style=${{ '--i': 1 }}>
        <${Stat} label="Visitas del día" value=${day.length} icon="calendar" hint=${next ? 'Siguiente: ' + ((PC.q.pet(state, next.petId) || {}).name || '') : 'Jornada completada'} />
        <${Stat} label="Finalizadas" value=${finished + ' / ' + day.length} icon="check-circle" tone="emerald" hint=${pending ? pending + ' por atender' : 'Todo al día'} />
        <${Stat} label="Recorrido estimado" value=${ev.km.toFixed(1) + ' km'} icon="route" tone="sky" hint=${day.length ? `${Math.round(ev.travel)} min de traslado` : 'Sin visitas'} />
        <${Stat} label="Ingresos del día" value=${PC.moneyShort(income)} icon="banknote" tone="violet" hint="Solo atenciones finalizadas" />
      </div>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Visitas del día">
          <${SectionTitle} title=${PC.cap(dt.long(date))} icon="route" />
          ${day.length ? html`<ol>${day.map((a, i) => html`<${StopCard} key=${a.id} appt=${a} index=${i} total=${day.length} leg=${legs[a.id]}
            onTreat=${ap => setTreat(ap.id)} onPet=${setPetDrawer} />`)}</ol>`
            : html`<${Empty} icon="calendar" title="Sin visitas para este día" text="Cuando la empresa te asigne citas aparecerán aquí automáticamente."
              action=${html`<${Button} variant="soft" icon="sliders" onClick=${() => PC.go('/vet/availability')}>Revisar mi disponibilidad<//>`} />`}
        </section>

        <aside class="space-y-5">
          <${Card} className="p-4">
            <${SectionTitle} title="Ruta del día" icon="map" />
            ${day.length ? html`<${PC.shared.RouteMap} stops=${mapStops} order=${day.map(a => a.id)} color=${vet.color} highlightId=${next ? next.id : null} ariaLabel=${'Ruta de ' + vet.name} />`
              : html`<p class="py-8 text-center text-sm text-slate-300">Sin ruta para esta fecha.</p>`}
            <p class="mt-3 text-xs text-slate-400">El orden lo define el equipo de logística para minimizar traslados y respetar las franjas.</p>
          <//>
          <${Card} className="p-4">
            <${SectionTitle} title="Mi perfil profesional" icon="badge" />
            <div class="flex items-center gap-3">
              <${Avatar} name=${vet.name} color=${vet.color} size=${48} />
              <div class="min-w-0"><p class="truncate text-sm font-semibold text-white">${vet.name}</p><p class="truncate text-xs text-slate-300">${vet.specialty}</p>
              <p class="text-xs text-slate-400">${vet.license} · ★ ${vet.rating.toFixed(1)} (${vet.reviews})</p></div>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">${vet.zones.map(z => html`<${Badge} key=${z} tone="slate" icon="map-pin">${(L.zone(z) || {}).name}<//>`)}</div>
          <//>
        </aside>
      </div>

      <${PC.TreatmentForm} appt=${treatAppt} open=${!!treat} onClose=${() => setTreat(null)} />
      <${PC.shared.PetDrawer} petId=${petDrawer} open=${!!petDrawer} onClose=${() => setPetDrawer(null)} viewer="vet" />
    </div>`;
  }

  // ——— Pacientes (historial clínico de consulta rápida)
  function Patients() {
    const state = PC.useStore();
    const vet = PC.q.currentVet(state);
    const [q, setQ] = useState('');
    const [drawer, setDrawer] = useState(null);

    const rows = useMemo(() => {
      const ids = Array.from(new Set(state.appointments.filter(a => a.vetId === vet.id && a.status !== 'cancelada').map(a => a.petId)));
      return ids.map(id => {
        const pet = PC.q.pet(state, id);
        if (!pet) return null;
        const own = state.treatments.filter(t => t.petId === id && t.vetId === vet.id).sort((a, b) => b.date.localeCompare(a.date));
        const upcoming = L.upcomingFor(state.appointments.filter(a => a.petId === id && a.vetId === vet.id))[0];
        return { pet, owner: PC.q.owner(state, pet.ownerId), last: own[0], visits: own.length, upcoming };
      }).filter(Boolean).filter(r => !q.trim() || (r.pet.name + ' ' + r.pet.breed + ' ' + (r.owner ? r.owner.name : '')).toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => a.pet.name.localeCompare(b.pet.name));
    }, [state.appointments, state.treatments, state.pets, vet.id, q]);

    return html`<div>
      <${PageHeader} eyebrow="Historial clínico" title="Mis pacientes"
        subtitle="Consulta rápida de antecedentes de las mascotas que has atendido o atenderás."
        actions=${html`<${VetPicker} state=${state} vet=${vet} />`} />
      <div class="mb-5 max-w-md"><${Input} icon="search" aria-label="Buscar paciente" placeholder="Buscar por mascota, raza o propietario…" value=${q} onChange=${e => setQ(e.target.value)} /></div>
      ${rows.length ? html`<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        ${rows.map((r, i) => html`<${Card} key=${r.pet.id} hover className="anim-up p-4" style=${{ '--i': i % 9 }}>
          <button type="button" class="block w-full text-left" onClick=${() => setDrawer(r.pet.id)} aria-label=${'Abrir expediente de ' + r.pet.name}>
            <div class="flex items-center gap-3">
              <${PetAvatar} pet=${r.pet} size=${52} />
              <div class="min-w-0 flex-1"><p class="truncate text-base font-semibold text-white">${r.pet.name}</p>
              <p class="truncate text-xs text-slate-300">${r.pet.breed} · ${PC.formatAge(r.pet.ageMonths)}</p>
              <p class="truncate text-xs text-slate-400">${r.owner ? r.owner.name : ''}</p></div>
            </div>
            ${r.last ? html`<p class="mt-3 line-clamp-2 text-sm text-slate-200"><span class="text-slate-400">${dt.rel(r.last.date)}:</span> ${r.last.diagnosis}</p>` : html`<p class="mt-3 text-sm text-slate-400">Primera visita pendiente.</p>`}
            <div class="mt-3 flex flex-wrap gap-1.5">
              <${Badge} tone="slate" icon="clipboard">${r.visits} ${r.visits === 1 ? 'atención' : 'atenciones'}<//>
              ${r.upcoming ? html`<${Badge} tone="sky" icon="calendar">${dt.rel(r.upcoming.date)}<//>` : null}
              ${(r.pet.care || []).slice(0, 1).map(c => html`<${Badge} key=${c} tone="amber">${c}<//>`)}
            </div>
          </button>
        <//>`)}
      </div>` : html`<${Empty} icon="users" title="Sin pacientes por ahora" text="Aparecerán cuando tengas citas asignadas." />`}
      <${PC.shared.PetDrawer} petId=${drawer} open=${!!drawer} onClose=${() => setDrawer(null)} viewer="vet" />
    </div>`;
  }

  // ——— Disponibilidad semanal (alimenta el agendamiento)
  function Availability() {
    const state = PC.useStore();
    const vet = PC.q.currentVet(state);
    const days = [1, 2, 3, 4, 5, 6, 0];
    const total = days.reduce((n, d) => n + (vet.availability[d] || []).length, 0);
    const toggle = (dow, slotId) => PC.act.setVetAvailability(vet.id, dow, slotId, !(vet.availability[dow] || []).includes(slotId));
    const setDay = (dow, all) => D.SLOTS.forEach(s => PC.act.setVetAvailability(vet.id, dow, s.id, all));
    const preset = () => {
      days.forEach(d => D.SLOTS.forEach(s => PC.act.setVetAvailability(vet.id, d, s.id, d >= 1 && d <= 5 && s.id !== 's5')));
      PC.toast.push({ title: 'Jornada estándar aplicada', text: 'Lunes a viernes, 08:00 a 16:00.', tone: 'info' });
    };

    return html`<div>
      <${PageHeader} eyebrow="Disponibilidad" title="Mi disponibilidad semanal"
        subtitle="Las franjas que actives aquí son las que los propietarios podrán reservar. Los cambios se aplican al instante."
        actions=${html`<${VetPicker} state=${state} vet=${vet} />`} />

      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <${Card} className="anim-up min-w-0 p-4 sm:p-6">
          <div class="relative overflow-x-auto">
            <table class="w-full min-w-[560px] border-separate border-spacing-y-2 text-sm">
              <caption class="sr-only">Matriz de disponibilidad por día y franja</caption>
              <thead><tr class="text-left text-xs text-slate-300">
                <th scope="col" class="pb-1 pr-3 font-medium">Día</th>
                ${D.SLOTS.map(s => html`<th key=${s.id} scope="col" class="pb-1 text-center font-medium tabular">${s.label.replace(' – ', '–')}</th>`)}
                <th scope="col" class="pb-1 text-right font-medium"><span class="sr-only">Acciones</span></th>
              </tr></thead>
              <tbody>
                ${days.map(d => {
                  const cur = vet.availability[d] || [];
                  return html`<tr key=${d}>
                    <th scope="row" class="pr-3 text-left font-medium text-white">${D.WEEKDAYS_LONG[d]}</th>
                    ${D.SLOTS.map(s => {
                      const on = cur.includes(s.id);
                      return html`<td key=${s.id} class="px-1 text-center">
                        <button type="button" role="switch" aria-checked=${on} aria-label=${`${D.WEEKDAYS_LONG[d]} ${s.label}`} onClick=${() => toggle(d, s.id)}
                          class=${cn('h-11 w-full min-w-[64px] rounded-xl border text-xs font-semibold transition-all',
                            on ? 'border-gold-400 bg-gold-500/20 text-gold-200 hover:bg-gold-500/30' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25')}>
                          ${on ? html`<${Icon} name="check" size=${16} className="mx-auto" strokeWidth=${2.6} />` : '—'}
                        </button></td>`;
                    })}
                    <td class="pl-2 text-right">
                      <button type="button" class="text-xs font-medium text-gold-300 hover:text-gold-200" onClick=${() => setDay(d, cur.length < D.SLOTS.length)}>
                        ${cur.length < D.SLOTS.length ? 'Todo' : 'Ninguna'}</button>
                    </td>
                  </tr>`;
                })}
              </tbody>
            </table>
          </div>
        <//>

        <aside class="space-y-5">
          <${Card} strong className="p-5 anim-up" style=${{ '--i': 1 }}>
            <p class="text-sm text-slate-300">Franjas habilitadas por semana</p>
            <p class="mt-1 text-4xl font-semibold text-gold-300">${total}</p>
            <p class="text-xs text-slate-400">≈ ${total * 2} horas · capacidad de ${total * L.CAP} visitas</p>
            <div class="mt-4 border-t border-white/10 pt-4">
              <${Toggle} label="Disponible para nuevas asignaciones" description="Desactívalo si estás de descanso o incapacitado."
                checked=${vet.status === 'activo'} onChange=${on => { PC.act.updateVet(vet.id, { status: on ? 'activo' : 'descanso' }); PC.toast.push({ title: on ? 'Vuelves a estar disponible' : 'Marcado en descanso', tone: 'info' }); }} />
            </div>
          <//>
          <${Card} className="p-5 anim-up" style=${{ '--i': 2 }}>
            <p class="mb-3 text-sm font-semibold text-white">Atajos</p>
            <div class="space-y-2">
              <${Button} variant="soft" size="sm" className="w-full" icon="calendar-check" onClick=${preset}>Jornada estándar L–V (08–16)<//>
            </div>
            <p class="mt-4 text-xs text-slate-400">Cada franja admite hasta ${L.CAP} visitas por profesional.</p>
          <//>
        </aside>
      </div>
    </div>`;
  }

  PC.vet.Agenda = Agenda;
  PC.vet.Patients = Patients;
  PC.vet.Availability = Availability;
})(window.PC);
