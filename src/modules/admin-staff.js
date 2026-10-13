/* Administrador · Gestión de personal y disponibilidad (RF-06) */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useMemo } = R;
  const { Button, Card, Badge, Avatar, PageHeader, Meter, Modal, Input, Select, Chip, Segmented, Toggle } = PC.ui;
  const L = PC.logic;
  const D = PC.data;
  PC.admin = PC.admin || {};

  const COLORS = ['#355E4B', '#4F7C8A', '#C06F5B', '#8A6F8E', '#B58A4A', '#6F8C6B'];

  function VetFormModal({ open, onClose }) {
    const blank = () => ({ name: '', license: '', specialty: '', email: '', phone: '', skills: [], zones: [], color: COLORS[0] });
    const [f, setF] = useState(blank);
    const [errors, setErrors] = useState({});
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const toggle = (k, v) => set(k, f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]);

    const submit = e => {
      if (e) e.preventDefault();
      const er = {};
      if (f.name.trim().length < 5) er.name = 'Ingresa nombre y apellido.';
      if (f.license.trim().length < 3) er.license = 'La tarjeta profesional es obligatoria.';
      if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Correo no válido.';
      if (!f.skills.length) er.skills = 'Selecciona al menos un servicio que presta.';
      setErrors(er);
      if (Object.keys(er).length) { PC.focusError(); return; }
      const vet = PC.act.addVet({
        name: f.name.trim(), license: f.license.trim(), specialty: f.specialty.trim() || 'Medicina general', email: f.email.trim().toLowerCase(),
        phone: f.phone.trim(), skills: f.skills, zones: f.zones.length ? f.zones : ['chico'], color: f.color,
        bio: 'Profesional recién incorporado al equipo PetCare.',
      });
      PC.toast.push({ title: 'Profesional registrado', text: `${vet.name} ya puede recibir asignaciones en la jornada L–V.`, tone: 'gold' });
      setF(blank()); setErrors({});
      onClose();
    };

    return html`<${Modal} open=${open} onClose=${onClose} size="lg" icon="users" title="Registrar profesional"
      subtitle="Se creará con disponibilidad estándar de lunes a viernes (08:00–16:00)."
      footer=${html`<${Button} variant="ghost" onClick=${onClose}>Cancelar<//><${Button} variant="gold" icon="check" onClick=${submit}>Registrar profesional<//>`}>
      <form onSubmit=${submit} noValidate class="space-y-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <${Input} label="Nombre completo" required value=${f.name} error=${errors.name} onChange=${e => set('name', e.target.value)} placeholder="Dra. Laura Gómez" data-autofocus="true" />
          <${Input} label="Tarjeta profesional / registro" required value=${f.license} error=${errors.license} onChange=${e => set('license', e.target.value)} placeholder="MV-00000" />
          <${Input} label="Especialidad" value=${f.specialty} onChange=${e => set('specialty', e.target.value)} placeholder="Ej.: Medicina felina" />
          <${Input} label="Correo corporativo" type="email" required value=${f.email} error=${errors.email} onChange=${e => set('email', e.target.value)} />
          <${Input} label="Teléfono" type="tel" value=${f.phone} onChange=${e => set('phone', e.target.value)} />
        </div>
        <fieldset>
          <legend class="mb-2 text-xs font-medium text-slate-300">Servicios que presta <span class="text-gold-400" aria-hidden="true">*</span></legend>
          <div class="flex flex-wrap gap-2">${D.CATEGORIES.map(c => html`<${Chip} key=${c.id} icon=${c.icon} tone=${c.tone} active=${f.skills.includes(c.id)} onClick=${() => toggle('skills', c.id)}>${c.name}<//>`)}</div>
          ${errors.skills ? html`<p role="alert" class="mt-2 flex items-center gap-1 text-xs text-clay-700"><${Icon} name="alert" size=${13} />${errors.skills}</p>` : null}
        </fieldset>
        <fieldset>
          <legend class="mb-2 text-xs font-medium text-slate-300">Zonas de cobertura</legend>
          <div class="flex flex-wrap gap-2">${D.ZONES.map(z => html`<${Chip} key=${z.id} active=${f.zones.includes(z.id)} onClick=${() => toggle('zones', z.id)}>${z.name}<//>`)}</div>
        </fieldset>
        <fieldset>
          <legend class="mb-2 text-xs font-medium text-slate-300">Color en mapas y rutas</legend>
          <div class="flex gap-2">${COLORS.map(c => html`<button key=${c} type="button" aria-label=${'Color ' + c} aria-pressed=${f.color === c} onClick=${() => set('color', c)}
            class=${cn('h-9 w-9 rounded-full border-2 transition-all', f.color === c ? 'scale-110 border-white' : 'border-transparent')} style=${{ background: c }}></button>`)}</div>
        </fieldset>
      </form>
    <//>`;
  }

  function AvailabilityMatrix({ vet }) {
    const days = [1, 2, 3, 4, 5, 6, 0];
    return html`<div class="relative overflow-x-auto"><table class="text-xs">
      <caption class="sr-only">Disponibilidad semanal de ${vet.name}</caption>
      <thead><tr><th class="pr-2"></th>${D.SLOTS.map(s => html`<th key=${s.id} scope="col" class="px-1 pb-1 font-medium text-slate-400 tabular">${s.label.slice(0, 5)}</th>`)}</tr></thead>
      <tbody>${days.map(d => html`<tr key=${d}>
        <th scope="row" class="pr-2 text-left font-medium text-slate-300">${D.WEEKDAYS[d]}</th>
        ${D.SLOTS.map(s => { const on = (vet.availability[d] || []).includes(s.id);
          return html`<td key=${s.id} class="p-0.5"><span class=${cn('block h-6 w-10 rounded-md', on ? 'bg-gold-500/70' : 'bg-white/[0.06]')} title=${on ? 'Disponible' : 'No disponible'}><span class="sr-only">${on ? 'Disponible' : 'No disponible'}</span></span></td>`; })}
      </tr>`)}</tbody>
    </table></div>`;
  }

  function Staff() {
    const state = PC.useStore();
    const [form, setForm] = useState(false);
    const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
    const [open, setOpen] = useState(null);
    const [filter, setFilter] = useState('all');
    const today = dt.today();

    const rows = useMemo(() => {
      const r = state.vets.map(v => {
        const todayN = state.appointments.filter(a => a.vetId === v.id && a.date === today && a.status !== 'cancelada').length;
        const cap = (v.availability[dt.dow(today)] || []).length * L.CAP;
        const upcoming = state.appointments.filter(a => a.vetId === v.id && a.date >= today && ['confirmada', 'en_camino', 'iniciada'].includes(a.status)).length;
        const slots = Object.values(v.availability).reduce((n, a) => n + a.length, 0);
        return { v, todayN, cap, upcoming, slots };
      }).filter(x => filter === 'all' || (filter === 'activo' ? x.v.status === 'activo' : x.v.status !== 'activo'));
      const val = { name: x => x.v.name, rating: x => x.v.rating, load: x => (x.cap ? x.todayN / x.cap : 0), status: x => x.v.status, slots: x => x.slots }[sort.key];
      return r.sort((a, b) => { const A = val(a), B = val(b); const c = typeof A === 'string' ? A.localeCompare(B) : A - B; return sort.dir === 'asc' ? c : -c; });
    }, [state.vets, state.appointments, sort, filter]);

    const th = (key, label, cls) => html`<th scope="col" aria-sort=${sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} class=${cn('pb-3 pr-3 font-medium', cls)}>
      <button type="button" class="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white" onClick=${() => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))}>
        ${label}<${Icon} name=${sort.key === key ? (sort.dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'chevron-down'} size=${12} className=${sort.key === key ? 'text-gold-300' : 'opacity-40'} /></button></th>`;

    return html`<div>
      <${PageHeader} eyebrow="Equipo" title="Gestión de personal"
        subtitle="Registra profesionales, revisa su carga del día y su disponibilidad semanal."
        actions=${html`<${Button} variant="gold" icon="plus" onClick=${() => setForm(true)}>Registrar profesional<//>`} />

      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <${Segmented} size="sm" label="Filtrar por estado" value=${filter} onChange=${setFilter}
          options=${[{ value: 'all', label: 'Todos', count: state.vets.length }, { value: 'activo', label: 'Activos', count: state.vets.filter(v => v.status === 'activo').length },
            { value: 'descanso', label: 'En descanso', count: state.vets.filter(v => v.status !== 'activo').length }]} />
        <p class="text-xs text-slate-400">Haz clic en un encabezado para ordenar.</p>
      </div>

      <ul class="space-y-4 lg:hidden" aria-label="Profesionales">
        ${rows.map(({ v, todayN, cap, upcoming, slots }) => html`<li key=${v.id}>
          <${Card} className="anim-up p-4">
            <div class="flex items-center gap-3">
              <${Avatar} name=${v.name} color=${v.color} size=${46} />
              <div class="min-w-0 flex-1">
                <p class="truncate text-base font-semibold text-white">${v.name}</p>
                <p class="truncate text-xs text-slate-300">${v.license} · ${v.specialty}</p>
              </div>
              <span class="flex shrink-0 items-center gap-1 text-sm text-slate-100"><${Icon} name="star" size=${14} className="fill-current text-gold-400" />${v.rating.toFixed(1)}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">
              ${v.skills.map(s => { const c = L.category(s); return html`<${Badge} key=${s} tone=${c.tone} icon=${c.icon}>${c.name}<//>`; })}
            </div>
            <div class="mt-4">
              <div class="mb-1 flex justify-between text-xs text-slate-300"><span>Carga de hoy</span><span class="tabular">${todayN}/${cap} · ${upcoming} próximas</span></div>
              <${Meter} value=${todayN} max=${cap || 1} tone=${todayN > cap ? 'rose' : 'gold'} label=${'Carga de ' + v.name} />
            </div>
            <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button type="button" role="switch" aria-checked=${v.status === 'activo'} aria-label=${'Estado de ' + v.name}
                onClick=${() => { const on = v.status !== 'activo'; PC.act.updateVet(v.id, { status: on ? 'activo' : 'descanso' }); PC.toast.push({ title: `${v.name}: ${on ? 'activo' : 'en descanso'}`, tone: 'info' }); }}
                class=${cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium', v.status === 'activo' ? PC.TONES.emerald : PC.TONES.slate)}>
                <span class=${cn('h-2 w-2 rounded-full', v.status === 'activo' ? 'bg-sage-500' : 'bg-slate-400')}></span>${v.status === 'activo' ? 'Activo' : 'En descanso'}</button>
              <${Button} size="xs" variant="soft" iconRight=${open === v.id ? 'chevron-up' : 'chevron-down'} aria-expanded=${open === v.id} onClick=${() => setOpen(open === v.id ? null : v.id)}>Disponibilidad (${slots})<//>
            </div>
            ${open === v.id ? html`<div class="anim-fade mt-4 space-y-3 border-t border-white/10 pt-4">
              <${AvailabilityMatrix} vet=${v} />
              <p class="text-xs text-slate-300">${v.zones.map(z => (L.zone(z) || {}).name).join(' · ')}</p>
            </div>` : null}
          <//>
        </li>`)}
      </ul>

      <${Card} className="anim-up hidden overflow-hidden lg:block">
        <div class="relative overflow-x-auto">
          <table class="w-full min-w-[820px] text-left text-sm">
            <caption class="sr-only">Listado de profesionales</caption>
            <thead class="border-b border-white/10 bg-white/[0.03]"><tr class="px-4">
              ${th('name', 'Profesional', 'pl-5 pt-3')}
              <th scope="col" class="pb-3 pr-3 pt-3 text-xs font-medium text-slate-300">Servicios y zonas</th>
              ${th('load', 'Carga de hoy', 'pt-3')}
              ${th('slots', 'Franjas/sem.', 'pt-3')}
              ${th('rating', 'Calificación', 'pt-3')}
              ${th('status', 'Estado', 'pt-3')}
              <th scope="col" class="pb-3 pr-5 pt-3"><span class="sr-only">Acciones</span></th>
            </tr></thead>
            <tbody class="divide-y divide-white/[0.07]">
              ${rows.map(({ v, todayN, cap, upcoming, slots }) => {
                const isOpen = open === v.id;
                return html`<${R.Fragment} key=${v.id}>
                  <tr class="align-middle transition-colors hover:bg-white/[0.03]">
                    <td class="py-3 pl-5 pr-3"><div class="flex items-center gap-3">
                      <${Avatar} name=${v.name} color=${v.color} size=${42} />
                      <div class="min-w-0"><p class="truncate font-semibold text-white">${v.name}</p><p class="truncate text-xs text-slate-300">${v.license} · ${v.specialty}</p></div>
                    </div></td>
                    <td class="py-3 pr-3"><div class="flex max-w-[260px] flex-wrap gap-1">
                      ${v.skills.map(s => { const c = L.category(s); return html`<${Badge} key=${s} tone=${c.tone} icon=${c.icon}>${c.name}<//>`; })}
                      <span class="w-full text-[11px] text-slate-400">${v.zones.slice(0, 3).map(z => (L.zone(z) || {}).name).join(', ')}${v.zones.length > 3 ? ' +' + (v.zones.length - 3) : ''}</span>
                    </div></td>
                    <td class="py-3 pr-3 w-40"><div class="flex items-center gap-2">
                      <${Meter} value=${todayN} max=${cap || 1} tone=${todayN > cap ? 'rose' : todayN / (cap || 1) > 0.75 ? 'amber' : 'gold'} label=${'Carga de ' + v.name} />
                      <span class="text-xs tabular text-slate-200">${todayN}/${cap}</span></div>
                      <p class="mt-1 text-[11px] text-slate-400">${upcoming} citas próximas</p></td>
                    <td class="py-3 pr-3 tabular text-slate-200">${slots}</td>
                    <td class="py-3 pr-3"><span class="flex items-center gap-1 text-slate-100"><${Icon} name="star" size=${14} className="fill-current text-gold-400" />${v.rating.toFixed(1)} <span class="text-xs text-slate-400">(${v.reviews})</span></span></td>
                    <td class="py-3 pr-3">
                      <button type="button" role="switch" aria-checked=${v.status === 'activo'} aria-label=${'Estado de ' + v.name}
                        onClick=${() => { const on = v.status !== 'activo'; PC.act.updateVet(v.id, { status: on ? 'activo' : 'descanso' }); PC.toast.push({ title: `${v.name}: ${on ? 'activo' : 'en descanso'}`, tone: 'info' }); }}
                        class=${cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors', v.status === 'activo' ? PC.TONES.emerald : PC.TONES.slate)}>
                        <span class=${cn('h-2 w-2 rounded-full', v.status === 'activo' ? 'bg-sage-500' : 'bg-slate-400')}></span>${v.status === 'activo' ? 'Activo' : 'En descanso'}</button>
                    </td>
                    <td class="py-3 pr-5 text-right">
                      <${Button} size="xs" variant="ghost" iconRight=${isOpen ? 'chevron-up' : 'chevron-down'} aria-expanded=${isOpen} onClick=${() => setOpen(isOpen ? null : v.id)}>Disponibilidad<//>
                    </td>
                  </tr>
                  ${isOpen ? html`<tr class="bg-white/[0.025]"><td colspan="7" class="px-5 py-4">
                    <div class="grid gap-5 md:grid-cols-[auto_1fr]">
                      <${AvailabilityMatrix} vet=${v} />
                      <div class="space-y-2 text-sm text-slate-300">
                        <p>${v.bio}</p>
                        <p class="flex items-center gap-2"><${Icon} name="mail" size=${14} className="text-gold-400" />${v.email}</p>
                        <p class="flex items-center gap-2"><${Icon} name="phone" size=${14} className="text-gold-400" />${v.phone || '—'}</p>
                        <p class="flex items-center gap-2"><${Icon} name="calendar" size=${14} className="text-gold-400" />En PetCare desde ${v.since}</p>
                        <div class="flex flex-wrap gap-2 pt-1">
                          <${Button} size="sm" variant="soft" icon="route" onClick=${() => PC.go('/admin/routes?vet=' + v.id)}>Ver rutas<//>
                          <${Button} size="sm" variant="soft" icon="calendar" onClick=${() => { PC.store.update(s => ({ ...s, session: { ...s.session, vetId: v.id } })); PC.go('/vet/agenda'); }}>Ver su agenda<//>
                        </div>
                      </div>
                    </div>
                  </td></tr>` : null}
                <//>`;
              })}
            </tbody>
          </table>
        </div>
      <//>

      <${VetFormModal} open=${form} onClose=${() => setForm(false)} />
    </div>`;
  }

  PC.admin.Staff = Staff;
})(window.PC);
