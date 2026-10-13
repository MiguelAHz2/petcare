/* Administrador · Panel de control con métricas operativas */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useMemo } = R;
  const { Button, Card, Badge, StatusBadge, Avatar, PageHeader, SectionTitle, Stat, Segmented, Meter, Stars, PetAvatar } = PC.ui;
  const { BarChart, HBars } = PC.charts;
  const L = PC.logic;
  const D = PC.data;
  PC.admin = PC.admin || {};

  const inRange = (d, from, to) => d >= from && d <= to;

  function Dashboard() {
    const state = PC.useStore();
    const [period, setPeriod] = useState(14);
    const today = dt.today();
    const from = dt.add(today, -(period - 1));
    const prevFrom = dt.add(from, -period), prevTo = dt.add(from, -1);

    const m = useMemo(() => {
      const done = state.appointments.filter(a => a.status === 'finalizada');
      const cur = done.filter(a => inRange(a.date, from, today));
      const prev = done.filter(a => inRange(a.date, prevFrom, prevTo));
      const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
      const rated = cur.filter(a => a.rating);
      const days = Array.from({ length: period }, (_, i) => dt.add(from, i));
      const byDay = days.map(d => {
        const list = cur.filter(a => a.date === d);
        return { date: d, value: list.reduce((s, a) => s + a.price, 0), count: list.length };
      });
      const byCat = D.CATEGORIES.map(c => ({ c, n: cur.filter(a => a.categoryId === c.id).length, rev: cur.filter(a => a.categoryId === c.id).reduce((s, a) => s + a.price, 0) }))
        .filter(x => x.n > 0).sort((a, b) => b.n - a.n);
      const byVet = state.vets.map(v => {
        const l = cur.filter(a => a.vetId === v.id);
        const r = l.filter(a => a.rating);
        return { v, n: l.length, rev: l.reduce((s, a) => s + a.price, 0), rating: r.length ? r.reduce((s, a) => s + a.rating, 0) / r.length : v.rating };
      }).sort((a, b) => b.n - a.n);
      const todays = L.sortRoute(state.appointments.filter(a => a.date === today && a.status !== 'cancelada'));
      const cap = state.vets.filter(v => v.status === 'activo').reduce((s, v) => s + (v.availability[dt.dow(today)] || []).length * L.CAP, 0);
      return {
        count: cur.length, countDelta: pct(cur.length, prev.length),
        revenue: cur.reduce((s, a) => s + a.price, 0), revDelta: pct(cur.reduce((s, a) => s + a.price, 0), prev.reduce((s, a) => s + a.price, 0)),
        satisfaction: rated.length ? rated.reduce((s, a) => s + a.rating, 0) / rated.length : 0, ratedN: rated.length,
        byDay, byCat, byVet, todays, occupancy: cap ? Math.min(100, Math.round((todays.length / cap) * 100)) : 0, cap,
        pending: state.appointments.filter(a => a.status === 'pendiente').length,
      };
    }, [state.appointments, state.vets, period]);

    const activeVets = state.vets.filter(v => v.status === 'activo').length;

    // Alertas operativas calculadas
    const alerts = useMemo(() => {
      const out = [];
      if (m.pending) out.push({ tone: 'amber', icon: 'alert', title: `${m.pending} ${m.pending === 1 ? 'solicitud' : 'solicitudes'} sin profesional`, text: 'Asígnalas para confirmar a las familias.', to: '/admin/assign', cta: 'Asignar' });
      const tomorrow = dt.add(today, 1);
      state.vets.forEach(v => {
        const day = L.vetDay(state, v.id, tomorrow);
        if (day.length < 2) return;
        const e = L.evaluate(day.map(a => L.stopFromAppt(a, L.isLocked(a))));
        if (e.lateCount) out.push({ tone: 'rose', icon: 'route', title: `${v.name}: ${e.lateCount} ${e.lateCount === 1 ? 'parada' : 'paradas'} fuera de franja mañana`, text: `${Math.round(e.km)} km planificados. Optimiza la ruta para respetar horarios.`, to: '/admin/routes', cta: 'Optimizar' });
      });
      state.vets.filter(v => v.status !== 'activo').forEach(v => {
        const n = state.appointments.filter(a => a.vetId === v.id && a.date >= today && ['confirmada', 'pendiente'].includes(a.status)).length;
        if (n) out.push({ tone: 'amber', icon: 'users', title: `${v.name} está en descanso con ${n} citas asignadas`, text: 'Reasigna sus visitas a otro profesional.', to: '/admin/assign', cta: 'Reasignar' });
      });
      return out;
    }, [state.appointments, state.vets, m.pending]);

    const delta = d => (d === null ? null : { up: d >= 0, text: `${Math.abs(d)} % vs. periodo anterior` });

    return html`<div>
      <${PageHeader} eyebrow="Operación" title="Panel de control" subtitle="Métricas en vivo de citas, ingresos y capacidad del equipo."
        actions=${html`<${Segmented} size="sm" label="Periodo" value=${period} onChange=${setPeriod}
          options=${[{ value: 7, label: '7 días' }, { value: 14, label: '14 días' }, { value: 30, label: '30 días' }]} />`} />

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 anim-up">
        <${Stat} label="Citas atendidas" value=${m.count} icon="check-circle" tone="emerald" delta=${delta(m.countDelta)} />
        <${Stat} label="Ingresos" value=${PC.moneyShort(m.revenue)} icon="banknote" delta=${delta(m.revDelta)} />
        <${Stat} label="Profesionales activos" value=${activeVets + ' / ' + state.vets.length} icon="users" tone="sky" hint=${state.vets.length - activeVets ? (state.vets.length - activeVets) + ' en descanso' : 'Equipo completo'} />
        <${Stat} label="Ocupación de hoy" value=${m.occupancy + ' %'} icon="activity" tone="violet" hint=${m.todays.length + ' de ' + m.cap + ' cupos'} />
        <${Stat} label="Satisfacción" value=${m.satisfaction ? m.satisfaction.toFixed(1) + ' ★' : '—'} icon="star" hint=${m.ratedN + ' calificaciones'} />
        <${Stat} label="Por asignar" value=${m.pending} icon="clock" tone=${m.pending ? 'amber' : 'emerald'} hint=${m.pending ? 'Requieren acción' : 'Todo asignado'} />
      </div>

      <div class="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <${Card} className="p-5 anim-up" style=${{ '--i': 1 }}>
          <${SectionTitle} title="Ingresos por día" icon="trending-up" right=${html`<span class="text-xs text-slate-400">Últimos ${period} días · COP</span>`} />
          <${BarChart} data=${m.byDay.map(d => ({ label: String(dt.parse(d.date).getDate()), title: PC.cap(dt.long(d.date)), value: d.value, sub: d.count + (d.count === 1 ? ' cita atendida' : ' citas atendidas') }))}
            format=${PC.money} axisFormat=${PC.moneyShort} height=${200} ariaLabel=${`Ingresos diarios de los últimos ${period} días`} valueLabel="Ingresos" labelEvery=${period > 14 ? 3 : period > 7 ? 2 : 1} />
        <//>

        <${Card} className="p-5 anim-up" style=${{ '--i': 2 }}>
          <${SectionTitle} title="Citas por servicio" icon="layers" />
          ${m.byCat.length ? html`<${PC.charts.HBars} data=${m.byCat.map(x => ({ label: x.c.name, icon: x.c.icon, value: x.n, sub: PC.moneyShort(x.rev) }))} />`
            : html`<p class="py-6 text-center text-sm text-slate-300">Sin atenciones en el periodo.</p>`}
        <//>
      </div>

      <div class="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
        <${Card} className="p-5 anim-up" style=${{ '--i': 3 }}>
          <${SectionTitle} title="Rendimiento del equipo" icon="users" />
          <ul class="divide-y divide-white/10">
            ${m.byVet.map(r => html`<li key=${r.v.id} class="flex items-center gap-3 py-3">
              <${Avatar} name=${r.v.name} color=${r.v.color} size=${40} />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-white">${r.v.name}</p>
                <p class="truncate text-xs text-slate-300">${r.v.specialty}</p>
              </div>
              <div class="text-right"><p class="text-sm font-semibold tabular text-white">${r.n} <span class="text-xs font-normal text-slate-400">citas</span></p>
              <p class="text-xs text-slate-300">★ ${r.rating.toFixed(1)} · ${PC.moneyShort(r.rev)}</p></div>
            </li>`)}
          </ul>
        <//>

        <${Card} className="p-5 anim-up" style=${{ '--i': 4 }}>
          <${SectionTitle} title="Alertas operativas" icon="alert" />
          ${alerts.length ? html`<ul class="space-y-3">
            ${alerts.map((a, i) => html`<li key=${i} class=${cn('flex items-start gap-3 rounded-2xl border p-3', PC.TONES[a.tone])}>
              <span class="mt-0.5"><${Icon} name=${a.icon} size=${18} /></span>
              <div class="min-w-0 flex-1"><p class="text-sm font-semibold text-white">${a.title}</p><p class="text-xs text-slate-200/85">${a.text}</p></div>
              <${Button} size="xs" variant="soft" onClick=${() => PC.go(a.to)}>${a.cta}<//>
            </li>`)}
          </ul>` : html`<p class="flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4 text-sm text-emerald-100"><${Icon} name="check-circle" size=${18} />Sin alertas: todas las citas están asignadas y las rutas respetan las franjas.</p>`}
        <//>
      </div>

      <${Card} className="mt-5 p-5 anim-up" style=${{ '--i': 5 }}>
        <${SectionTitle} title=${'Operación de hoy · ' + PC.cap(dt.long(today))} icon="calendar-check"
          right=${html`<${Button} size="xs" variant="soft" iconRight="arrow-right" onClick=${() => PC.go('/admin/assign')}>Gestionar<//>`} />
        <div class="relative overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <caption class="sr-only">Citas programadas para hoy</caption>
            <thead><tr class="text-xs text-slate-300">
              <th scope="col" class="pb-2 pr-3 font-medium">Franja</th><th scope="col" class="pb-2 pr-3 font-medium">Mascota</th>
              <th scope="col" class="pb-2 pr-3 font-medium">Servicio</th><th scope="col" class="pb-2 pr-3 font-medium">Profesional</th>
              <th scope="col" class="pb-2 pr-3 font-medium">Zona</th><th scope="col" class="pb-2 font-medium">Estado</th>
            </tr></thead>
            <tbody class="divide-y divide-white/[0.07]">
              ${m.todays.map(a => {
                const pet = PC.q.pet(state, a.petId), vet = PC.q.vet(state, a.vetId);
                return html`<tr key=${a.id}>
                  <td class="py-2.5 pr-3 tabular text-slate-200">${L.slot(a.slotId).label}</td>
                  <td class="py-2.5 pr-3"><span class="flex items-center gap-2 text-white"><span aria-hidden="true">${pet ? pet.emoji : ''}</span>${pet ? pet.name : ''}</span></td>
                  <td class="py-2.5 pr-3 text-slate-200">${L.service(a.serviceId).name}</td>
                  <td class="py-2.5 pr-3 text-slate-200">${vet ? vet.name : html`<span class="text-amber-300">Sin asignar</span>`}</td>
                  <td class="py-2.5 pr-3 text-slate-300">${(L.zone(a.zoneId) || {}).name}</td>
                  <td class="py-2.5"><${StatusBadge} status=${a.status} /></td>
                </tr>`;
              })}
              ${!m.todays.length ? html`<tr><td colspan="6" class="py-6 text-center text-slate-300">No hay citas programadas para hoy.</td></tr>` : null}
            </tbody>
          </table>
        </div>
      <//>
    </div>`;
  }

  PC.admin.Dashboard = Dashboard;
})(window.PC);
