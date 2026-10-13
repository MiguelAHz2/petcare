/* Administrador · Asignación de citas a profesionales (RF-06) con tablero arrastrable */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useMemo } = R;
  const { Button, Card, Badge, StatusBadge, Avatar, PetAvatar, PageHeader, SectionTitle, Segmented, Toggle, Modal, Meter, Empty, Select } = PC.ui;
  const L = PC.logic;
  const D = PC.data;
  PC.admin = PC.admin || {};

  const query = a => ({ date: a.date, slotId: a.slotId, categoryId: a.categoryId, zoneId: a.zoneId, ignoreId: a.id });

  function doAssign(apptId, vetId) {
    const r = PC.act.assignAppointment(apptId, vetId);
    if (r.ok) PC.toast.push({ title: 'Cita asignada', text: `${r.vet.name} fue notificado/a y la familia recibió la confirmación.`, tone: 'gold' });
    else PC.toast.push({ title: 'No se pudo asignar', text: r.error, tone: 'error' });
    return r;
  }

  function PickVetModal({ appt, onClose }) {
    const state = PC.useStore();
    if (!appt) return null;
    const pet = PC.q.pet(state, appt.petId);
    const svc = L.service(appt.serviceId);
    const ranked = L.rankVets(state, query(appt));
    return html`<${Modal} open=${true} onClose=${onClose} icon="users" title="Asignar profesional"
      subtitle=${`${pet ? pet.name : ''} · ${svc.name} · ${dt.rel(appt.date)} ${L.slot(appt.slotId).label}`}>
      <ul class="space-y-2">
        ${ranked.map((r, i) => html`<li key=${r.vet.id} class=${cn('flex items-center gap-3 rounded-2xl border p-3', r.fit.ok ? 'border-white/10 bg-white/[0.04]' : 'border-white/5 bg-white/[0.015] opacity-70')}>
          <${Avatar} name=${r.vet.name} color=${r.vet.color} size=${42} />
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">${r.vet.name}
              ${i === 0 && r.fit.ok ? html`<${Badge} tone="gold" icon="zap">Mejor opción<//>` : null}</p>
            <p class="truncate text-xs text-slate-300">${r.vet.specialty} · ★ ${r.vet.rating.toFixed(1)}</p>
            <p class=${cn('mt-0.5 text-xs', r.fit.ok ? 'text-sage-700' : 'text-sand-700')}>${r.fit.reason}${r.fit.ok && r.zoneMatch ? ' · cubre la zona' : ''}</p>
          </div>
          <${Button} size="sm" variant=${r.fit.ok ? 'gold' : 'soft'} disabled=${!r.fit.ok} onClick=${() => { if (doAssign(appt.id, r.vet.id).ok) onClose(); }}>Asignar<//>
        </li>`)}
      </ul>
    <//>`;
  }

  function Assign() {
    const state = PC.useStore();
    const [dragId, setDragId] = useState(null);
    const [overVet, setOverVet] = useState(null);
    const [pick, setPick] = useState(null);
    const [filter, setFilter] = useState('semana');
    const today = dt.today();

    const pending = state.appointments.filter(a => a.status === 'pendiente').sort((a, b) => a.date.localeCompare(b.date) || L.slot(a.slotId).start - L.slot(b.slotId).start);
    const dragAppt = dragId ? PC.q.appt(state, dragId) : null;

    const table = useMemo(() => {
      const end = dt.add(today, 7);
      return state.appointments.filter(a => a.date >= today && a.status !== 'cancelada' && a.status !== 'finalizada')
        .filter(a => filter === 'pendientes' ? a.status === 'pendiente' : filter === 'semana' ? a.date <= end : true)
        .sort((a, b) => a.date.localeCompare(b.date) || L.slot(a.slotId).start - L.slot(b.slotId).start);
    }, [state.appointments, filter]);

    const onDrop = (e, vetId) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain') || dragId;
      setOverVet(null); setDragId(null);
      if (id) doAssign(id, vetId);
    };

    const autoAll = () => {
      const n = PC.act.autoAssignPending();
      PC.toast.push({ title: n ? `${n} ${n === 1 ? 'cita asignada' : 'citas asignadas'}` : 'Sin cambios', text: n ? 'Se eligió el mejor profesional por zona, carga y calificación.' : 'No hay profesionales con cupo para las citas pendientes.', tone: n ? 'gold' : 'info' });
    };

    return html`<div>
      <${PageHeader} eyebrow="Asignación" title="Asignar citas a profesionales"
        subtitle="Arrastra una solicitud sobre un profesional, o usa «Asignar» para ver sugerencias por zona, carga y calificación."
        actions=${html`<${Button} variant="gold" icon="wand" disabled=${!pending.length} onClick=${autoAll}>Auto-asignar pendientes (${pending.length})<//>`} />

      <${Card} className="mb-6 p-4 anim-up">
        <${Toggle} label="Asignación inteligente automática" checked=${state.settings.autoAssign}
          description="Al agendar, el sistema asigna de inmediato al profesional con mejor puntaje. Si está desactivada, las solicitudes llegan aquí como «Por asignar»."
          onChange=${v => { PC.act.setAutoAssign(v); PC.toast.push({ title: v ? 'Asignación automática activada' : 'Asignación manual activada', tone: 'info' }); }} />
      <//>

      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <section aria-label="Solicitudes por asignar">
          <${SectionTitle} title=${`Por asignar (${pending.length})`} icon="clock" />
          ${pending.length ? html`<ul class="space-y-3">
            ${pending.map(a => {
              const pet = PC.q.pet(state, a.petId), owner = PC.q.owner(state, a.ownerId), svc = L.service(a.serviceId), cat = L.category(a.categoryId);
              const best = L.bestVet(state, query(a));
              return html`<li key=${a.id} draggable=${true} onDragStart=${e => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move'; setDragId(a.id); }}
                onDragEnd=${() => { setDragId(null); setOverVet(null); }}
                class=${cn('glass cursor-grab rounded-2xl p-4 active:cursor-grabbing', dragId === a.id && 'dragging')}>
                <div class="flex items-start gap-3">
                  <span class="mt-1 text-slate-400" aria-hidden="true"><${Icon} name="grip" size=${18} /></span>
                  <${PetAvatar} pet=${pet} size=${44} />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-white">${pet ? pet.name : ''} · ${svc.name}</p>
                    <p class="text-xs text-slate-300">${PC.cap(dt.fmt(a.date))} · ${L.slot(a.slotId).label}</p>
                    <p class="text-xs text-slate-400">${owner ? owner.name : ''} · ${(L.zone(a.zoneId) || {}).name}</p>
                  </div>
                  <${Badge} tone=${cat.tone} icon=${cat.icon}>${cat.name}<//>
                </div>
                <div class="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <p class="min-w-0 truncate text-xs text-slate-300">${best ? html`Sugerido: <span class="font-medium text-sage-700">${best.name}</span>` : html`<span class="text-sand-700">Sin profesional con cupo</span>`}</p>
                  <${Button} size="xs" variant="gold" icon="users" onClick=${() => setPick(a.id)}>Asignar<//>
                </div>
              </li>`;
            })}
          </ul>` : html`<${Empty} icon="check-circle" title="Todo asignado" text="No hay solicitudes pendientes. Las nuevas aparecerán aquí si la asignación automática está desactivada." />`}
        </section>

        <section aria-label="Profesionales">
          <${SectionTitle} title="Profesionales" icon="users" right=${dragAppt ? html`<span class="text-xs text-gold-300">Suelta sobre un profesional para asignar</span>` : null} />
          <div class="grid gap-4 sm:grid-cols-2">
            ${state.vets.map(v => {
              const load = state.appointments.filter(a => a.vetId === v.id && a.date === (dragAppt ? dragAppt.date : today) && a.status !== 'cancelada').length;
              const cap = (v.availability[dt.dow(dragAppt ? dragAppt.date : today)] || []).length * L.CAP;
              const fit = dragAppt ? L.vetFit(state, v, query(dragAppt)) : null;
              const over = overVet === v.id;
              return html`<div key=${v.id} onDragOver=${e => { if (dragId) { e.preventDefault(); setOverVet(v.id); } }} onDragLeave=${() => setOverVet(o => (o === v.id ? null : o))} onDrop=${e => onDrop(e, v.id)}
                class=${cn('glass rounded-2xl border-2 p-4 transition-all duration-200',
                  over ? (fit && fit.ok ? 'border-sage-400 bg-sage-400/20 scale-[1.02]' : 'border-clay-400 bg-clay-400/20') : dragId ? (fit && fit.ok ? 'border-sage-400/40' : 'border-white/5 opacity-60') : 'border-transparent')}>
                <div class="flex items-center gap-3">
                  <${Avatar} name=${v.name} color=${v.color} size=${44} />
                  <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-white">${v.name}</p><p class="truncate text-xs text-slate-300">${v.specialty}</p></div>
                  <${Badge} tone=${v.status === 'activo' ? 'emerald' : 'slate'} dot=${true}>${v.status === 'activo' ? 'Activo' : 'Descanso'}<//>
                </div>
                <div class="mt-3 flex flex-wrap gap-1">${v.skills.map(s => html`<${Badge} key=${s} tone="slate">${L.category(s).name}<//>`)}</div>
                <div class="mt-3"><div class="mb-1 flex justify-between text-[11px] text-slate-300"><span>${dragAppt ? 'Carga ' + dt.rel(dragAppt.date).toLowerCase() : 'Carga de hoy'}</span><span class="tabular">${load}/${cap}</span></div>
                  <${Meter} value=${load} max=${cap || 1} tone=${load >= cap && cap ? 'rose' : 'gold'} label=${'Carga de ' + v.name} /></div>
                ${fit ? html`<p class=${cn('mt-3 flex items-center gap-1.5 text-xs font-medium', fit.ok ? 'text-sage-700' : 'text-sand-700')}><${Icon} name=${fit.ok ? 'check-circle' : 'alert'} size=${14} />${fit.reason}</p>` : null}
              </div>`;
            })}
          </div>
        </section>
      </div>

      <section class="mt-8" aria-label="Todas las citas">
        <${SectionTitle} title="Citas programadas" icon="calendar"
          right=${html`<${Segmented} size="sm" label="Filtro" value=${filter} onChange=${setFilter}
            options=${[{ value: 'pendientes', label: 'Por asignar' }, { value: 'semana', label: 'Próx. 7 días' }, { value: 'todas', label: 'Todas' }]} />`} />
        <${Card} className="overflow-hidden">
          <div class="relative overflow-x-auto">
            <table class="w-full min-w-[760px] text-left text-sm">
              <caption class="sr-only">Citas programadas y su profesional</caption>
              <thead class="border-b border-white/10 bg-white/[0.03] text-xs text-slate-300"><tr>
                <th scope="col" class="px-4 py-3 font-medium">Fecha y franja</th><th scope="col" class="py-3 pr-3 font-medium">Mascota</th>
                <th scope="col" class="py-3 pr-3 font-medium">Servicio</th><th scope="col" class="py-3 pr-3 font-medium">Zona</th>
                <th scope="col" class="py-3 pr-3 font-medium">Profesional</th><th scope="col" class="py-3 pr-4 font-medium">Estado</th>
              </tr></thead>
              <tbody class="divide-y divide-white/[0.06]">
                ${table.map(a => {
                  const pet = PC.q.pet(state, a.petId);
                  const ranked = L.rankVets(state, query(a));
                  const locked = ['en_camino', 'iniciada'].includes(a.status);
                  return html`<tr key=${a.id} class="hover:bg-white/[0.025]">
                    <td class="px-4 py-2.5 tabular"><span class="font-medium text-white">${PC.cap(dt.rel(a.date))}</span><span class="block text-xs text-slate-400">${L.slot(a.slotId).label}</span></td>
                    <td class="py-2.5 pr-3"><span class="flex items-center gap-2 text-white"><span aria-hidden="true">${pet ? pet.emoji : ''}</span>${pet ? pet.name : ''}</span></td>
                    <td class="py-2.5 pr-3 text-slate-200">${L.service(a.serviceId).name}</td>
                    <td class="py-2.5 pr-3 text-slate-300">${(L.zone(a.zoneId) || {}).name}</td>
                    <td class="py-2.5 pr-3">
                      <select aria-label=${'Profesional para ' + (pet ? pet.name : 'la cita')} disabled=${locked} value=${a.vetId || ''}
                        onChange=${e => { if (e.target.value) doAssign(a.id, e.target.value); }}
                        class=${cn('pc-input !py-1.5 !text-[13px] min-w-[190px]', !a.vetId && '!border-sand-400/50')}>
                        ${!a.vetId ? html`<option value="">Elegir profesional…</option>` : null}
                        ${ranked.map(r => html`<option key=${r.vet.id} value=${r.vet.id} disabled=${!r.fit.ok && r.vet.id !== a.vetId}>${r.vet.name}${r.vet.id === a.vetId ? '' : r.fit.ok ? '' : ' — ' + r.fit.reason}</option>`)}
                      </select>
                    </td>
                    <td class="py-2.5 pr-4"><${StatusBadge} status=${a.status} /></td>
                  </tr>`;
                })}
                ${!table.length ? html`<tr><td colspan="6" class="py-8 text-center text-slate-300">No hay citas para este filtro.</td></tr>` : null}
              </tbody>
            </table>
          </div>
        <//>
      </section>

      ${pick ? html`<${PickVetModal} appt=${PC.q.appt(state, pick)} onClose=${() => setPick(null)} />` : null}
    </div>`;
  }

  PC.admin.Assign = Assign;
})(window.PC);
