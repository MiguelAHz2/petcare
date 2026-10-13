/* Componentes compartidos entre roles: línea de estado, expediente, mapa logístico, selector de fecha */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useMemo } = R;
  const { Badge, Button, Tabs, Avatar, PetAvatar, Stat, Empty, Fact, Disclosure } = PC.ui;
  const L = PC.logic;
  const D = PC.data;

  // ——— Línea de tiempo de estado de una cita
  const STEPS = [
    { key: 'confirmada', n: 1, label: 'Confirmada', icon: 'calendar-check' },
    { key: 'en_camino', n: 2, label: 'En camino', icon: 'navigation' },
    { key: 'iniciada', n: 3, label: 'En atención', icon: 'stethoscope' },
    { key: 'finalizada', n: 4, label: 'Finalizada', icon: 'flag' },
  ];

  function StatusTimeline({ appt, className }) {
    if (appt.status === 'cancelada') {
      return html`<p class=${cn('flex items-center gap-2 text-sm text-rose-300', className)}><${Icon} name="x" size=${16} />Esta cita fue cancelada.</p>`;
    }
    const cur = D.STATUS[appt.status].step;
    const at = key => { const h = appt.history.find(x => x.status === key); return h ? dt.time(h.at) : null; };
    return html`<ol class=${cn('flex items-start', className)} aria-label="Progreso de la cita">
      ${STEPS.map((s, i) => {
        const done = cur > s.n || (appt.status === 'finalizada' && s.n === 4);
        const current = cur === s.n && appt.status !== 'finalizada';
        const reached = done || current;
        return html`<li key=${s.key} class="relative flex flex-1 flex-col items-center text-center" aria-current=${current ? 'step' : undefined}>
          ${i > 0 ? html`<span class=${cn('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 transition-colors duration-500', cur >= s.n ? 'bg-gold-500' : 'bg-white/12')} aria-hidden="true"></span>` : null}
          <span class=${cn('relative z-10 grid h-8 w-8 place-items-center rounded-full border-2 transition-all duration-300',
            done ? 'border-gold-500 bg-gold-500 text-navy-900' : current ? 'border-gold-400 bg-navy-900 text-gold-300 shadow-[0_0_0_4px_rgba(212,176,106,.18)]' : 'border-white/15 bg-navy-900 text-slate-400')}>
            ${done ? html`<${Icon} name="check" size=${15} strokeWidth=${2.6} />` : html`<${Icon} name=${s.icon} size=${15} />`}
          </span>
          <span class=${cn('mt-1.5 text-[11px] font-medium leading-tight', reached ? 'text-slate-100' : 'text-slate-400')}>${s.label}</span>
          <span class="text-[10px] tabular text-slate-400">${at(s.key) || ' '}</span>
        </li>`;
      })}
    </ol>`;
  }

  // ——— ETA en vivo (cuando la cita está "en camino")
  function EtaBanner({ appt, vet }) {
    const now = PC.useNow(15000);
    if (appt.status !== 'en_camino' || !appt.etaAt) return null;
    const left = Math.max(0, Math.ceil((appt.etaAt - now) / 60000));
    const total = (appt.etaMin || 15) * 60000;
    const prog = PC.clamp(1 - (appt.etaAt - now) / total, 0.06, 1);
    return html`<div class="rounded-2xl border border-violet-400/30 bg-violet-400/10 p-4">
      <div class="flex items-center gap-3">
        <span class="ping-dot grid h-10 w-10 place-items-center rounded-full bg-violet-400/20 text-violet-200"><${Icon} name="navigation" size=${18} /></span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-white">${left > 0 ? `${vet ? vet.name : 'Tu profesional'} llega en ${left} min` : `${vet ? vet.name : 'Tu profesional'} está llegando`}</p>
          <p class="text-xs text-violet-100/80">En camino a ${appt.address}</p>
        </div>
      </div>
      <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(prog * 100)} aria-label="Progreso del trayecto">
        <div class="h-full rounded-full bg-violet-300 transition-all duration-1000" style=${{ width: prog * 100 + '%' }}></div>
      </div>
    </div>`;
  }

  // ——— Selector de fecha en franja horizontal
  function DateStrip({ value, onChange, from, count = 14, marks, isDisabled, className }) {
    const start = from || dt.today();
    const days = Array.from({ length: count }, (_, i) => dt.add(start, i));
    return html`<div class=${cn('-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 no-scrollbar', className)} role="listbox" aria-label="Seleccionar fecha">
      ${days.map(d => {
        const dd = dt.parse(d);
        const sel = d === value;
        const dis = isDisabled ? isDisabled(d) : false;
        const mark = marks ? marks(d) : null;
        const isToday = d === dt.today();
        return html`<button key=${d} type="button" role="option" aria-selected=${sel} disabled=${dis} onClick=${() => onChange(d)}
          aria-label=${dt.long(d) + (mark ? ', ' + mark + ' elementos' : '') + (dis ? ', no disponible' : '')}
          class=${cn('relative flex w-[62px] shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-2.5 transition-all duration-200',
            sel ? 'border-gold-400 bg-gold-500 text-navy-900 shadow-[0_8px_22px_-10px_rgba(212,176,106,.9)]'
              : dis ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-500 opacity-60'
                : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-gold-500/40 hover:bg-white/[0.08]')}>
          <span class=${cn('text-[11px] font-medium uppercase', sel ? 'text-navy-900/75' : 'text-slate-400')}>${D.WEEKDAYS[dd.getDay()]}</span>
          <span class="text-xl font-semibold leading-tight tabular">${dd.getDate()}</span>
          <span class=${cn('text-[10px]', sel ? 'text-navy-900/75' : 'text-slate-400')}>${isToday ? 'Hoy' : dd.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
          ${mark ? html`<span class=${cn('absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-bold', sel ? 'bg-navy-900 text-gold-300' : 'bg-gold-500 text-navy-900')}>${mark}</span>` : null}
        </button>`;
      })}
    </div>`;
  }

  // ——— Registro clínico individual
  function TreatmentCard({ t, defaultOpen }) {
    const state = PC.useStore();
    const vet = PC.q.vet(state, t.vetId);
    const svc = L.service(t.serviceId);
    const cat = L.category(t.categoryId);
    const [open, setOpen] = useState(!!defaultOpen);
    return html`<article class="rounded-2xl border border-white/10 bg-white/[0.035]">
      <button type="button" aria-expanded=${open} onClick=${() => setOpen(o => !o)} class="flex w-full items-start gap-3 p-4 text-left">
        <span class=${cn('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl', PC.BUBBLE[cat ? cat.tone : 'gold'])}><${Icon} name=${cat ? cat.icon : 'clipboard'} size=${18} /></span>
        <span class="min-w-0 flex-1">
          <span class="flex flex-wrap items-center gap-x-2 text-xs text-slate-400"><span class="tabular">${dt.short(t.date)}</span><span aria-hidden="true">·</span><span>${svc ? svc.name : 'Atención'}</span></span>
          <span class="mt-0.5 block text-sm font-semibold text-white">${t.diagnosis || 'Atención registrada'}</span>
          <span class="mt-0.5 block text-xs text-slate-300">${vet ? vet.name : 'Profesional'}</span>
        </span>
        <${Icon} name="chevron-down" size=${18} className=${cn('mt-1 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      ${open ? html`<div class="anim-fade space-y-4 border-t border-white/10 px-4 pb-4 pt-3 text-sm">
        ${t.vitals ? html`<div class="flex flex-wrap gap-2">
          ${t.vitals.weight ? html`<${Badge} tone="slate" icon="scale">${t.vitals.weight} kg<//>` : null}
          ${t.vitals.temp ? html`<${Badge} tone="slate" icon="thermometer">${t.vitals.temp} °C<//>` : null}
          ${t.vitals.hr ? html`<${Badge} tone="slate" icon="activity">${t.vitals.hr} lpm<//>` : null}
          ${t.vitals.condition ? html`<${Badge} tone="emerald" icon="heart-pulse">${t.vitals.condition}<//>` : null}
        </div>` : null}
        ${t.procedures && t.procedures.length ? html`<div>
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Procedimientos</p>
          <div class="flex flex-wrap gap-1.5">${t.procedures.map(p => html`<${Badge} key=${p} tone="sky">${p}<//>`)}</div>
        </div>` : null}
        ${t.medications && t.medications.length ? html`<div>
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Medicamentos aplicados / formulados</p>
          <ul class="space-y-1.5">${t.medications.map((m, i) => html`<li key=${i} class="flex items-start gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
            <${Icon} name="pill" size=${15} className="mt-0.5 text-gold-400" />
            <span><span class="font-medium text-slate-100">${m.name}</span><span class="text-slate-300"> · ${[m.dose, m.freq].filter(Boolean).join(' · ')}</span></span>
          </li>`)}</ul>
        </div>` : null}
        ${t.recommendations ? html`<div>
          <p class="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Recomendaciones</p>
          <p class="text-slate-200">${t.recommendations}</p>
        </div>` : null}
        ${t.nextVisit ? html`<p class="flex items-center gap-2 text-xs text-gold-300"><${Icon} name="calendar" size=${14} />Próximo control sugerido: ${dt.short(t.nextVisit)}</p>` : null}
      </div>` : null}
    </article>`;
  }

  // ——— Expediente de la mascota (propietario / veterinario / admin)
  function PetRecord({ pet, viewer = 'owner', onBook }) {
    const state = PC.useStore();
    const [tab, setTab] = useState('resumen');
    const treatments = L.treatmentsForPet(state, pet.id);
    const appts = L.apptsForPet(state, pet.id);
    const done = appts.filter(a => a.status === 'finalizada').length;
    const owner = PC.q.owner(state, pet.ownerId);
    const weights = treatments.filter(t => t.vitals && t.vitals.weight).slice(0, 8).reverse().map(t => t.vitals.weight);
    const today = dt.today();

    const vacStatus = v => {
      if (!v.next) return { tone: 'slate', label: 'Aplicada' };
      const d = dt.diff(v.next, today);
      if (d < 0) return { tone: 'rose', label: 'Vencida' };
      if (d <= 30) return { tone: 'amber', label: `Refuerzo en ${d} d` };
      return { tone: 'emerald', label: 'Al día' };
    };

    const tabs = [
      { value: 'resumen', label: 'Resumen', icon: 'paw' },
      { value: 'historial', label: 'Historial clínico', icon: 'clipboard', count: treatments.length },
      { value: 'vacunas', label: 'Vacunas', icon: 'syringe', count: (pet.vaccines || []).length },
      { value: 'citas', label: 'Citas', icon: 'calendar', count: appts.length },
    ];

    return html`<div class="space-y-5">
      <div class="flex items-center gap-4">
        <${PetAvatar} pet=${pet} size=${72} />
        <div class="min-w-0">
          <h3 class="truncate text-xl font-semibold text-white">${pet.name}</h3>
          <p class="text-sm text-slate-300">${pet.species} · ${pet.breed}</p>
          <p class="text-xs text-slate-400">${viewer !== 'owner' && owner ? 'Propietario: ' + owner.name : pet.sex + ' · ' + PC.formatAge(pet.ageMonths)}</p>
        </div>
      </div>

      <${Tabs} value=${tab} onChange=${setTab} tabs=${tabs} label="Secciones del expediente" />

      ${tab === 'resumen' ? html`<div class="space-y-5 anim-fade">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <${Stat} label="Peso" value=${pet.weight + ' kg'} icon="scale" className="!p-3" />
          <${Stat} label="Edad" value=${PC.formatAge(pet.ageMonths).replace(' años', ' a').replace(' año', ' a')} icon="calendar" tone="sky" className="!p-3" />
          <${Stat} label="Sexo" value=${pet.sex} icon="user" tone="violet" className="!p-3" />
          <${Stat} label="Atenciones" value=${done} icon="check-circle" tone="emerald" className="!p-3" />
        </div>

        ${(pet.care && pet.care.length) || pet.careNotes ? html`<div class="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
          <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-200"><${Icon} name="alert" size=${16} />Cuidados especiales</p>
          ${pet.care && pet.care.length ? html`<div class="mb-2 flex flex-wrap gap-1.5">${pet.care.map(c => html`<${Badge} key=${c} tone="amber">${c}<//>`)}</div>` : null}
          ${pet.careNotes ? html`<p class="text-sm text-amber-50/90">${pet.careNotes}</p>` : null}
        </div>` : null}

        <div>
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">Historial médico relevante</p>
          <p class="text-sm leading-relaxed text-slate-200">${pet.history || 'Sin antecedentes registrados.'}</p>
        </div>

        ${weights.length > 1 ? html`<div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div><p class="text-sm font-medium text-white">Evolución de peso</p><p class="text-xs text-slate-400">Últimos ${weights.length} controles</p></div>
          <${PC.charts.Sparkline} values=${weights} width=${130} height=${38} />
        </div>` : null}

        ${treatments[0] ? html`<div>
          <p class="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Última atención</p>
          <${TreatmentCard} t=${treatments[0]} />
        </div>` : null}

        ${viewer === 'owner' && onBook ? html`<${Button} variant="gold" icon="calendar-plus" onClick=${onBook}>Agendar cita para ${pet.name}<//>` : null}
      </div>` : null}

      ${tab === 'historial' ? html`<div class="space-y-3 anim-fade">
        ${treatments.length ? treatments.map((t, i) => html`<${TreatmentCard} key=${t.id} t=${t} defaultOpen=${i === 0} />`)
          : html`<${Empty} icon="clipboard" title="Sin registros clínicos" text="Cuando el profesional finalice una visita, el tratamiento aparecerá aquí." />`}
      </div>` : null}

      ${tab === 'vacunas' ? html`<div class="space-y-2 anim-fade">
        ${(pet.vaccines || []).length ? pet.vaccines.slice().sort((a, b) => b.date.localeCompare(a.date)).map((v, i) => {
          const st = vacStatus(v);
          return html`<div key=${i} class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
            <div class="flex min-w-0 items-center gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><${Icon} name="syringe" size=${17} /></span>
              <div class="min-w-0"><p class="truncate text-sm font-medium text-white">${v.name}</p>
              <p class="text-xs text-slate-400">Aplicada: ${dt.short(v.date)}${v.next ? ' · Refuerzo: ' + dt.short(v.next) : ''}</p></div>
            </div>
            <${Badge} tone=${st.tone}>${st.label}<//>
          </div>`;
        }) : html`<${Empty} icon="syringe" title="Sin vacunas registradas" text="El carné se actualiza automáticamente en cada vacunación." />`}
      </div>` : null}

      ${tab === 'citas' ? html`<div class="space-y-2 anim-fade">
        ${appts.length ? appts.slice(0, 14).map(a => {
          const svc = L.service(a.serviceId);
          const vet = PC.q.vet(state, a.vetId);
          return html`<div key=${a.id} class="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-white">${svc.name}</p>
              <p class="text-xs text-slate-400">${dt.rel(a.date)} · ${L.slot(a.slotId).label}${vet ? ' · ' + vet.name : ''}</p>
            </div>
            <${PC.ui.StatusBadge} status=${a.status} />
          </div>`;
        }) : html`<${Empty} icon="calendar" title="Aún sin citas" text="Agenda la primera visita a domicilio." />`}
      </div>` : null}
    </div>`;
  }

  // ——— Mapa logístico (SVG): sede, zonas, paradas numeradas y ruta animada
  const AVENUES = [
    'M57 0 C 60 28, 55 62, 51 100',   // Autonorte / Caracas
    'M30 0 C 34 30, 29 62, 27 100',   // Av. Boyacá
    'M73 0 C 71 30, 75 62, 77 100',   // Carrera Séptima
    'M0 24 C 30 26, 60 21, 100 25',   // Calle 100
    'M0 41 C 30 38, 62 44, 100 39',   // Calle 63 / 72
    'M0 60 C 30 63, 60 58, 100 61',   // Calle 26
    'M0 80 C 32 77, 62 83, 100 79',   // Autosur
  ];

  function RouteMap({ stops, order, color = '#D4B06A', highlightId, onSelect, ghostOrder, showLabels = true, className, ariaLabel }) {
    // Paradas con la misma coordenada (mismo domicilio) se separan en círculo para no taparse
    const groups = {};
    stops.forEach(s => { const k = s.geo.x + ',' + s.geo.y; (groups[k] = groups[k] || []).push(s.id); });
    const byId = {};
    stops.forEach(s => {
      const g = groups[s.geo.x + ',' + s.geo.y];
      let geo = s.geo;
      if (g.length > 1) {
        const a = (g.indexOf(s.id) / g.length) * Math.PI * 2 - Math.PI / 2;
        geo = { x: s.geo.x + Math.cos(a) * 2.8, y: s.geo.y + Math.sin(a) * 2.8 };
      }
      byId[s.id] = { ...s, geo };
    });
    const seq = order.map(id => byId[id]).filter(Boolean);
    const ghost = (ghostOrder || []).map(id => byId[id]).filter(Boolean);
    const base = D.BASE;
    const path = pts => 'M' + [base].concat(pts.map(s => s.geo)).map(p => p.x + ' ' + p.y).join(' L');

    return html`<svg viewBox="0 0 100 100" class=${cn('h-auto w-full rounded-2xl', className)} role="img" aria-label=${ariaLabel || 'Mapa logístico de la jornada'}>
      <defs>
        <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16345c"/><stop offset="1" stop-color="#0b1c36"/></linearGradient>
        <pattern id="mapGrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,.045)" stroke-width=".25"/></pattern>
        <radialGradient id="mapGlow" cx=".35" cy=".5" r=".7"><stop offset="0" stop-color="rgba(212,176,106,.10)"/><stop offset="1" stop-color="rgba(212,176,106,0)"/></radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#mapBg)" />
      <rect width="100" height="100" fill="url(#mapGrid)" />
      <rect width="100" height="100" fill="url(#mapGlow)" />
      <path d="M86 0 C 92 18, 84 38, 90 58 S 94 84, 88 100 L100 100 L100 0Z" fill="rgba(255,255,255,.035)" />
      <text x="93" y="52" font-size="2.2" fill="rgba(255,255,255,.28)" transform="rotate(90 93 52)" text-anchor="middle" letter-spacing=".4">CERROS ORIENTALES</text>
      ${AVENUES.map((d, i) => html`<path key=${i} d=${d} fill="none" stroke="rgba(255,255,255,.085)" stroke-width="1.1" stroke-linecap="round" />`)}
      ${AVENUES.map((d, i) => html`<path key=${'c' + i} d=${d} fill="none" stroke="rgba(11,28,54,.9)" stroke-width=".25" stroke-dasharray="1.2 1.2" />`)}

      ${D.ZONES.map(z => html`<g key=${z.id} aria-hidden="true">
        <circle cx=${z.x} cy=${z.y} r=".7" fill="rgba(255,255,255,.28)" />
        <text x=${z.x} y=${z.y - 1.6} font-size="2.2" fill="rgba(226,232,240,.5)" text-anchor="middle">${z.name}</text>
      </g>`)}

      ${ghost.length > 1 ? html`<path d=${path(ghost)} fill="none" stroke="rgba(148,163,184,.55)" stroke-width=".45" stroke-dasharray="1 1.4" stroke-linejoin="round" />` : null}
      ${seq.length ? html`<g>
        <path d=${path(seq)} fill="none" stroke=${color} stroke-opacity=".18" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" />
        <path d=${path(seq)} fill="none" stroke=${color} stroke-width=".85" stroke-linejoin="round" stroke-linecap="round" class="route-flow" />
      </g>` : null}

      <g aria-label="Sede PetCare" transform=${`translate(${base.x} ${base.y})`}>
        <circle r="3.4" fill="#0D223F" stroke="#D4B06A" stroke-width=".7" />
        <path d="M-1.6 .4 L0 -1.4 L1.6 .4 V1.8 H-1.6Z" fill="#D4B06A" />
        <text y="6.4" font-size="2.2" fill="#E7CC94" text-anchor="middle" font-weight="600">Sede</text>
      </g>

      ${seq.map((s, i) => {
        const hi = s.id === highlightId;
        const finished = s.status === 'finalizada';
        const name = s.label || '';
        return html`<g key=${s.id} class="map-stop" transform=${`translate(${s.geo.x} ${s.geo.y})`} tabIndex=${onSelect ? 0 : undefined}
          role=${onSelect ? 'button' : undefined} aria-label=${`Parada ${i + 1}: ${name}`}
          onClick=${onSelect ? () => onSelect(s.id) : undefined}
          onKeyDown=${onSelect ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.id); } } : undefined}>
          ${hi ? html`<circle r="5.4" fill=${color} fill-opacity=".18"><animate attributeName="r" values="4;7;4" dur="1.8s" repeatCount="indefinite" /></circle>` : null}
          <circle class="map-stop-ring" r="3.2" fill=${finished ? color : '#0D223F'} stroke=${color} stroke-width=${hi ? 1.2 : .8} />
          <text y="1.1" font-size="3.1" font-weight="700" text-anchor="middle" fill=${finished ? '#0D223F' : '#fff'}>${i + 1}</text>
          ${showLabels && name ? html`<text y="7" font-size="2.3" text-anchor="middle" fill="rgba(241,245,249,.95)" paint-order="stroke" stroke="#0b1c36" stroke-width=".9">${name}</text>` : null}
        </g>`;
      })}
    </svg>`;
  }

  // Expediente en panel lateral (reutilizable por los tres roles)
  function PetDrawer({ petId, open, onClose, viewer = 'owner', onBook }) {
    const state = PC.useStore();
    const pet = petId ? PC.q.pet(state, petId) : null;
    return html`<${PC.ui.Drawer} open=${!!open && !!pet} onClose=${onClose} icon="clipboard" width="max-w-2xl"
      title=${pet ? 'Expediente de ' + pet.name : 'Expediente'} subtitle=${viewer === 'owner' ? 'Historial clínico, vacunas y citas' : 'Consulta rápida de antecedentes'}>
      ${pet ? html`<${PetRecord} pet=${pet} viewer=${viewer} onBook=${onBook} />` : null}
    <//>`;
  }

  PC.shared = { StatusTimeline, EtaBanner, DateStrip, TreatmentCard, PetRecord, PetDrawer, RouteMap, STEPS };
})(window.PC);
