/* Propietario · Mis citas con estado en tiempo real y detalle de atención */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useEffect } = R;
  const { Button, Card, Badge, StatusBadge, PetAvatar, Avatar, PageHeader, Segmented, Empty, Confirm, Stars, Fact } = PC.ui;
  const L = PC.logic;
  PC.owner = PC.owner || {};

  function ApptCard({ appt, featured, highlight }) {
    const state = PC.useStore();
    const pet = PC.q.pet(state, appt.petId);
    const vet = PC.q.vet(state, appt.vetId);
    const svc = L.service(appt.serviceId);
    const cat = L.category(appt.categoryId);
    const slot = L.slot(appt.slotId);
    const treat = PC.q.treatmentOfAppt(state, appt.id);
    const [drawer, setDrawer] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const cancellable = ['pendiente', 'confirmada'].includes(appt.status);

    return html`<${Card} strong=${featured} className=${cn('p-5 sm:p-6 transition-shadow', highlight && 'ring-2 ring-gold-400 shadow-[0_0_0_6px_rgba(212,176,106,.12)]')}>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-4">
          <${PetAvatar} pet=${pet} size=${featured ? 60 : 52} />
          <div class="min-w-0">
            <p class="text-xs font-medium text-slate-400">${cat ? cat.name : ''}</p>
            <h3 class="truncate text-lg font-semibold text-white">${svc.name}</h3>
            <p class="text-sm text-slate-300">${pet ? pet.name : 'Mascota'} · ${pet ? pet.breed : ''}</p>
          </div>
        </div>
        <${StatusBadge} status=${appt.status} />
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-3">
        <${Fact} icon="calendar" label="Fecha">${PC.cap(dt.long(appt.date))}<//>
        <${Fact} icon="clock" label="Franja de llegada">${slot.label}<//>
        <${Fact} icon="map-pin" label="Dirección"><span class="line-clamp-2">${appt.address}</span><//>
      </div>

      <div class="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
        ${vet ? html`<${Avatar} name=${vet.name} color=${vet.color} size=${40} />
          <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-white">${vet.name}</p>
          <p class="truncate text-xs text-slate-300">${vet.specialty} · ★ ${vet.rating.toFixed(1)}</p></div>`
          : html`<span class="grid h-10 w-10 place-items-center rounded-full bg-amber-400/15 text-amber-300"><${Icon} name="clock" size=${18} /></span>
            <div class="min-w-0 flex-1"><p class="text-sm font-semibold text-white">Asignando profesional…</p><p class="text-xs text-slate-300">Te avisaremos apenas se confirme.</p></div>`}
        <span class="text-sm font-semibold text-gold-300 tabular">${PC.money(appt.price)}</span>
      </div>

      ${appt.status === 'en_camino' ? html`<div class="mt-4"><${PC.shared.EtaBanner} appt=${appt} vet=${vet} /></div>` : null}
      ${appt.status !== 'cancelada' ? html`<${PC.shared.StatusTimeline} appt=${appt} className="mt-6" />` : html`<${PC.shared.StatusTimeline} appt=${appt} className="mt-4" />`}
      ${appt.notes ? html`<p class="mt-4 rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-slate-300"><span class="font-medium text-slate-100">Tus indicaciones:</span> ${appt.notes}</p>` : null}

      ${appt.status === 'finalizada' ? html`<div class="mt-5 space-y-3 border-t border-white/10 pt-4">
        ${treat ? html`<${PC.shared.TreatmentCard} t=${treat} />` : null}
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm text-slate-300">${appt.rating ? 'Tu calificación' : '¿Cómo fue la atención?'}</span>
          <${Stars} value=${appt.rating || 0} size=${22} onChange=${r => { PC.act.rateAppointment(appt.id, r); PC.toast.push({ title: '¡Gracias por tu calificación!', text: 'Ayuda a mejorar el servicio.', tone: 'gold' }); }} />
        </div>
      </div>` : null}

      <div class="mt-5 flex flex-wrap gap-2">
        <${Button} variant="soft" size="sm" icon="eye" onClick=${() => setDrawer(true)}>Expediente de ${pet ? pet.name : ''}<//>
        ${appt.status === 'finalizada' ? html`<${Button} variant="outline" size="sm" icon="rotate-cw" onClick=${() => PC.go('/owner/book?service=' + appt.serviceId + '&pet=' + appt.petId)}>Repetir servicio<//>` : null}
        ${cancellable ? html`<${Button} variant="danger" size="sm" icon="x" onClick=${() => setConfirm(true)}>Cancelar cita<//>` : null}
      </div>

      <${PC.shared.PetDrawer} petId=${appt.petId} open=${drawer} onClose=${() => setDrawer(false)} viewer="owner" />
      <${Confirm} open=${confirm} title="¿Cancelar esta cita?" confirmLabel="Sí, cancelar" cancelLabel="Mantener cita"
        text=${`Cancelarás ${svc.name} para ${pet ? pet.name : 'tu mascota'} el ${dt.fmt(appt.date, { weekday: 'long', day: 'numeric', month: 'long' })}. Es gratis hasta 4 horas antes.`}
        onCancel=${() => setConfirm(false)}
        onConfirm=${() => { PC.act.cancelAppointment(appt.id); setConfirm(false); PC.toast.push({ title: 'Cita cancelada', text: 'Puedes reagendar cuando quieras.', tone: 'info' }); }} />
    <//>`;
  }

  function Appointments() {
    const state = PC.useStore();
    const route = PC.useRoute();
    const owner = PC.q.currentOwner(state);
    const all = PC.q.apptsOf(state, owner.id);
    const upcoming = L.upcomingFor(all);
    const history = all.filter(a => ['finalizada', 'cancelada'].includes(a.status)).sort((a, b) => b.date.localeCompare(a.date));
    const [tab, setTab] = useState('proximas');
    const newId = route.query.new;

    useEffect(() => {
      if (newId) {
        const el = document.getElementById('appt-' + newId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, [newId]);

    const list = tab === 'proximas' ? upcoming : history;

    return html`<div>
      <${PageHeader} eyebrow="Seguimiento" title="Mis citas"
        subtitle="El estado se actualiza en tiempo real cuando tu profesional cambia su avance."
        actions=${html`<${Button} variant="gold" icon="calendar-plus" onClick=${() => PC.go('/owner/book')}>Nueva cita<//>`} />

      <div class="mb-5">
        <${Segmented} label="Filtrar citas" value=${tab} onChange=${setTab}
          options=${[{ value: 'proximas', label: 'Próximas', count: upcoming.length }, { value: 'historial', label: 'Historial', count: history.length }]} />
      </div>

      ${list.length ? html`<div class="space-y-5">
        ${list.map((a, i) => html`<div key=${a.id} id=${'appt-' + a.id} class="anim-up" style=${{ '--i': Math.min(i, 6) }}><${ApptCard} appt=${a} highlight=${a.id === newId} /></div>`)}
      </div>` : html`<${Empty} icon=${tab === 'proximas' ? 'calendar-plus' : 'clipboard'}
        title=${tab === 'proximas' ? 'No tienes citas próximas' : 'Aún no hay historial'}
        text=${tab === 'proximas' ? 'Agenda una visita y la verás aquí con su estado en vivo.' : 'Las atenciones finalizadas y canceladas aparecerán aquí.'}
        action=${tab === 'proximas' ? html`<${Button} variant="gold" icon="calendar-plus" onClick=${() => PC.go('/owner/book')}>Agendar cita<//>` : null} />`}
    </div>`;
  }

  PC.owner.ApptCard = ApptCard;
  PC.owner.Appointments = Appointments;
})(window.PC);
