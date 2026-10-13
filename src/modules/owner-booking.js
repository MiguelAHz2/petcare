/* Propietario · Agendamiento de citas en 4 pasos (RF-04) */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useEffect, useMemo } = R;
  const { Button, Card, Badge, PetAvatar, PageHeader, Chip, Input, Select, Textarea, Empty, Avatar } = PC.ui;
  const L = PC.logic;
  const D = PC.data;
  PC.owner = PC.owner || {};

  const STEPS = ['Servicio', 'Mascota', 'Fecha y franja', 'Confirmar'];

  function Book() {
    const state = PC.useStore();
    const route = PC.useRoute();
    const owner = PC.q.currentOwner(state);
    const pets = PC.q.petsOf(state, owner.id);
    const qs = route.query.service, qp = route.query.pet;

    const [sel, setSel] = useState(() => ({
      serviceId: qs && L.service(qs) ? qs : null,
      petId: qp && pets.some(p => p.id === qp) ? qp : null,
      date: null, slotId: null, address: owner.address, zoneId: owner.zoneId, notes: '',
    }));
    const [step, setStep] = useState(() => {
      const hasS = qs && L.service(qs), hasP = qp && pets.some(p => p.id === qp);
      return hasS && hasP ? 2 : hasS ? 1 : 0;
    });
    const [catFilter, setCatFilter] = useState('all');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState({});

    // Si llegan nuevos parámetros (p. ej. desde el catálogo), actualiza la selección
    useEffect(() => {
      if (qs && L.service(qs)) { setSel(s => ({ ...s, serviceId: qs, petId: s.petId && L.service(qs).species.includes((PC.q.pet(state, s.petId) || {}).species) ? s.petId : null, slotId: null })); setStep(s => (s === 0 ? 1 : s)); }
    }, [qs]);
    useEffect(() => {
      if (qp && pets.some(p => p.id === qp)) setSel(s => ({ ...s, petId: qp }));
    }, [qp]);
    // La dirección por defecto sigue al perfil del propietario activo
    useEffect(() => { setSel(s => ({ ...s, address: owner.address, zoneId: owner.zoneId })); }, [owner.id]);

    const svc = sel.serviceId ? L.service(sel.serviceId) : null;
    const pet = sel.petId ? PC.q.pet(state, sel.petId) : null;
    const slot = sel.slotId ? L.slot(sel.slotId) : null;
    const set = (k, v) => setSel(s => ({ ...s, [k]: v }));

    const canNext = [!!svc, !!pet, !!(sel.date && sel.slotId), true][step];

    // Profesional sugerido (según asignación automática)
    const suggested = useMemo(() => {
      if (!svc || !sel.date || !sel.slotId || !state.settings.autoAssign) return null;
      return L.bestVet(state, { date: sel.date, slotId: sel.slotId, categoryId: svc.cat, zoneId: sel.zoneId });
    }, [state.appointments, state.vets, svc && svc.id, sel.date, sel.slotId, sel.zoneId, state.settings.autoAssign]);

    const confirm = () => {
      const er = {};
      if (sel.address.trim().length < 5) er.address = 'Indica la dirección donde atenderemos a tu mascota.';
      setErrors(er);
      if (Object.keys(er).length) { PC.focusError(); return; }
      setBusy(true);
      setTimeout(() => {
        const r = PC.act.createAppointment({
          ownerId: owner.id, petId: sel.petId, serviceId: sel.serviceId, date: sel.date, slotId: sel.slotId,
          address: sel.address.trim(), zoneId: sel.zoneId, notes: sel.notes.trim(),
        });
        PC.toast.push({
          title: 'Cita agendada',
          text: r.vet ? `${r.vet.name} atenderá a ${pet.name} ${dt.rel(sel.date).toLowerCase()} · ${slot.label}.` : 'Estamos asignando el mejor profesional. Te avisaremos en breve.',
          tone: 'gold',
        });
        setBusy(false);
        PC.go('/owner/appointments?new=' + r.appt.id);
      }, 500);
    };

    // ——— Paso 0
    const services = D.SERVICES.filter(s => catFilter === 'all' || s.cat === catFilter);
    const step0 = html`<div class="space-y-4 anim-fade">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Categoría">
        <${Chip} active=${catFilter === 'all'} onClick=${() => setCatFilter('all')}>Todas<//>
        ${D.CATEGORIES.map(c => html`<${Chip} key=${c.id} icon=${c.icon} tone=${c.tone} active=${catFilter === c.id} onClick=${() => setCatFilter(c.id)}>${c.name}<//>`)}
      </div>
      <div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Servicio">
        ${services.map(s => {
          const c = L.category(s.cat);
          const on = sel.serviceId === s.id;
          return html`<button key=${s.id} type="button" role="radio" aria-checked=${on} onClick=${() => { set('serviceId', s.id); set('slotId', null); if (pet && !s.species.includes(pet.species)) set('petId', null); }}
            class=${cn('flex items-start gap-3 rounded-2xl border p-4 text-left transition-all', on ? 'border-gold-400 bg-gold-500/10 shadow-[0_0_0_3px_rgba(212,176,106,.15)]' : 'border-white/10 bg-white/[0.035] hover:border-white/25')}>
            <span class=${cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', PC.BUBBLE[c.tone])}><${Icon} name=${c.icon} size=${20} /></span>
            <span class="min-w-0 flex-1">
              <span class="flex flex-wrap items-center gap-2"><span class="text-sm font-semibold text-white">${s.name}</span>${s.kind === 'plan' ? html`<${Badge} tone="gold">Plan<//>` : null}</span>
              <span class="mt-0.5 block text-xs text-slate-300">${c.name} · ${s.duration} min · ${s.species.map(x => x === 'Canino' ? '🐶' : '🐱').join(' ')}</span>
            </span>
            <span class="shrink-0 text-sm font-semibold text-gold-300 tabular">${PC.money(s.price)}</span>
          </button>`;
        })}
      </div>
    </div>`;

    // ——— Paso 1
    const step1 = html`<div class="anim-fade">
      ${pets.length ? html`<div class="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Mascota">
        ${pets.map(p => {
          const ok = !svc || svc.species.includes(p.species);
          const on = sel.petId === p.id;
          return html`<button key=${p.id} type="button" role="radio" aria-checked=${on} disabled=${!ok} onClick=${() => set('petId', p.id)}
            class=${cn('flex items-center gap-4 rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45',
              on ? 'border-gold-400 bg-gold-500/10 shadow-[0_0_0_3px_rgba(212,176,106,.15)]' : 'border-white/10 bg-white/[0.035] hover:border-white/25')}>
            <${PetAvatar} pet=${p} size=${52} />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-white">${p.name}</span>
              <span class="block truncate text-xs text-slate-300">${p.breed} · ${PC.formatAge(p.ageMonths)} · ${p.weight} kg</span>
              ${!ok ? html`<span class="mt-1 block text-[11px] text-amber-300">Este servicio no aplica a ${p.species === 'Canino' ? 'caninos' : 'felinos'}.</span>` : null}
              ${ok && p.care && p.care.length ? html`<span class="mt-1 block text-[11px] text-amber-200">${p.care[0]}</span>` : null}
            </span>
            ${on ? html`<${Icon} name="check-circle" size=${22} className="text-gold-400" />` : null}
          </button>`;
        })}
      </div>` : html`<${Empty} icon="paw" title="Primero registra a tu mascota" text="Necesitamos sus datos para preparar la visita."
        action=${html`<${Button} variant="gold" icon="plus" onClick=${() => PC.go('/owner/pets?add=1')}>Registrar mascota<//>`} />`}
    </div>`;

    // ——— Paso 2
    const dateMarks = d => (svc ? L.dayAvailability(state, d, svc.cat) || null : null);
    const step2 = svc ? html`<div class="space-y-5 anim-fade">
      <div>
        <p class="mb-2 text-sm font-medium text-white">Elige el día</p>
        <${PC.shared.DateStrip} value=${sel.date} onChange=${d => { set('date', d); set('slotId', null); }} marks=${dateMarks}
          isDisabled=${d => L.dayAvailability(state, d, svc.cat) === 0} />
        <p class="text-xs text-slate-400">El número indica cuántas franjas tienen cupo ese día.</p>
      </div>
      ${sel.date ? html`<div>
        <p class="mb-2 text-sm font-medium text-white">Franja de llegada · ${PC.cap(dt.long(sel.date))}</p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Franja horaria">
          ${D.SLOTS.map(s => {
            const info = L.slotInfo(state, sel.date, s.id, svc.cat);
            const dis = info.free === 0;
            const on = sel.slotId === s.id;
            return html`<button key=${s.id} type="button" role="radio" aria-checked=${on} disabled=${dis} onClick=${() => set('slotId', s.id)}
              class=${cn('rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45',
                on ? 'border-gold-400 bg-gold-500/10 shadow-[0_0_0_3px_rgba(212,176,106,.15)]' : 'border-white/10 bg-white/[0.035] hover:border-white/25')}>
              <span class="flex items-center gap-2 text-base font-semibold tabular text-white"><${Icon} name="clock" size=${16} className="text-gold-400" />${s.label}</span>
              <span class=${cn('mt-1 block text-xs', dis ? 'text-slate-400' : info.free <= 2 ? 'text-amber-300' : 'text-emerald-300')}>
                ${info.past ? 'Franja finalizada' : dis ? 'Sin cupos' : info.free === 1 ? '¡Último cupo!' : info.free === 2 ? '¡Últimos 2 cupos!' : `${info.free} cupos disponibles`}
              </span>
            </button>`;
          })}
        </div>
      </div>` : html`<p class="rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-slate-300">Selecciona un día para ver las franjas disponibles.</p>`}
    </div>` : null;

    // ——— Paso 3
    const step3 = html`<div class="space-y-5 anim-fade">
      <${Input} label="Dirección de atención" icon="map-pin" required value=${sel.address} error=${errors.address} onChange=${e => set('address', e.target.value)}
        hint="Prellenada con tu dirección predeterminada; puedes cambiarla para esta visita." />
      <${Select} label="Localidad" value=${sel.zoneId} onChange=${e => set('zoneId', e.target.value)} options=${D.ZONES.map(z => ({ value: z.id, label: z.name }))} />
      <${Textarea} label="Indicaciones para el profesional (opcional)" rows=${3} value=${sel.notes} onChange=${e => set('notes', e.target.value)}
        placeholder="Portería, punto de referencia, comportamiento de la mascota…" />
      ${state.settings.autoAssign && suggested ? html`<div class="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
        <${Avatar} name=${suggested.name} color=${suggested.color} size=${44} />
        <div class="min-w-0"><p class="text-sm font-semibold text-white">${suggested.name}</p>
        <p class="text-xs text-emerald-100/80">${suggested.specialty} · ★ ${suggested.rating.toFixed(1)}</p></div>
        <${Badge} tone="emerald" icon="zap" className="ml-auto">Asignación automática<//>
      </div>` : html`<p class="flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 text-sm text-amber-100"><${Icon} name="info" size=${16} />Un coordinador asignará al profesional y te confirmará en breve.</p>`}
    </div>`;

    const body = [step0, step1, step2, step3][step];

    return html`<div>
      <${PageHeader} eyebrow="Agendamiento" title="Agenda una visita a domicilio" subtitle="En cuatro pasos tendrás a tu profesional en casa." />

      <ol class="mb-6 grid grid-cols-4 gap-2 anim-up" aria-label="Pasos">
        ${STEPS.map((t, i) => {
          const done = i < step, cur = i === step;
          const reachable = i <= step || [!!svc, !!svc && !!pet, !!svc && !!pet && !!sel.date && !!sel.slotId][i - 1];
          return html`<li key=${t}>
            <button type="button" disabled=${!reachable} onClick=${() => setStep(i)} aria-current=${cur ? 'step' : undefined}
              class=${cn('flex w-full flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-all sm:flex-row sm:justify-center sm:gap-2.5',
                cur ? 'border-gold-400 bg-gold-500/10' : done ? 'border-gold-500/30 bg-white/[0.04]' : 'border-white/10 bg-white/[0.02]', !reachable && 'opacity-50')}>
              <span class=${cn('grid h-7 w-7 place-items-center rounded-full text-xs font-bold', done || cur ? 'bg-gold-500 text-navy-900' : 'bg-white/10 text-slate-300')}>
                ${done ? html`<${Icon} name="check" size=${14} strokeWidth=${3} />` : i + 1}</span>
              <span class=${cn('text-[11px] font-medium sm:text-sm', cur ? 'text-white' : 'text-slate-300')}>${t}</span>
            </button>
          </li>`;
        })}
      </ol>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section class="glass min-w-0 rounded-3xl p-5 sm:p-6" aria-live="polite">
          <h2 class="mb-4 text-lg font-semibold text-white">${['¿Qué servicio necesitas?', '¿Para quién es la visita?', '¿Cuándo te viene mejor?', 'Revisa y confirma'][step]}</h2>
          ${body}
          <div class="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
            <${Button} variant="ghost" icon="arrow-left" disabled=${step === 0} onClick=${() => setStep(s => Math.max(0, s - 1))}>Atrás<//>
            ${step < 3
              ? html`<${Button} variant="gold" iconRight="arrow-right" disabled=${!canNext} onClick=${() => setStep(s => s + 1)}>Continuar<//>`
              : html`<${Button} variant="gold" icon="calendar-check" loading=${busy} disabled=${!svc || !pet || !sel.date || !sel.slotId} onClick=${confirm}>Confirmar cita<//>`}
          </div>
        </section>

        <aside class="lg:sticky lg:top-24 lg:self-start" aria-label="Resumen de la cita">
          <${Card} strong className="p-5">
            <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-white"><${Icon} name="clipboard" size=${18} className="text-gold-400" />Resumen</h2>
            <dl class="space-y-3 text-sm">
              ${[
                ['Servicio', svc ? svc.name : null, 'sparkles'],
                ['Mascota', pet ? `${pet.name} · ${pet.breed}` : null, 'paw'],
                ['Fecha', sel.date ? PC.cap(dt.long(sel.date)) : null, 'calendar'],
                ['Franja', slot ? slot.label : null, 'clock'],
                ['Lugar', sel.address ? sel.address : null, 'map-pin'],
              ].map(([k, v, ic]) => html`<div key=${k} class="flex items-start gap-3">
                <span class="mt-0.5 text-gold-400"><${Icon} name=${ic} size=${16} /></span>
                <div class="min-w-0"><dt class="text-[11px] font-medium uppercase tracking-wide text-slate-400">${k}</dt>
                <dd class=${cn('truncate', v ? 'text-slate-100' : 'text-slate-400 italic')}>${v || 'Por definir'}</dd></div>
              </div>`)}
            </dl>
            <div class="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
              <span class="text-sm text-slate-300">Total a pagar al finalizar</span>
              <span class="text-2xl font-semibold text-gold-300 tabular">${svc ? PC.money(svc.price) : '—'}</span>
            </div>
            ${svc ? html`<p class="mt-3 text-[11px] leading-snug text-slate-400">${svc.conditions[0]}</p>` : null}
          <//>
        </aside>
      </div>
    </div>`;
  }

  PC.owner.Book = Book;
})(window.PC);
