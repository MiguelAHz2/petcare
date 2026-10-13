/* Propietario · Inicio */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState } = R;
  const { Button, Card, Stat, Badge, PetAvatar, PageHeader, SectionTitle, Empty } = PC.ui;
  const L = PC.logic;
  PC.owner = PC.owner || {};

  function Home() {
    const state = PC.useStore();
    const owner = PC.q.currentOwner(state);
    const pets = PC.q.petsOf(state, owner.id);
    const appts = PC.q.apptsOf(state, owner.id);
    const upcoming = L.upcomingFor(appts);
    const next = upcoming[0];
    const done = appts.filter(a => a.status === 'finalizada').length;
    const recent = state.treatments.filter(t => t.ownerId === owner.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const [drawerPet, setDrawerPet] = useState(null);

    // Próximo refuerzo de vacuna entre todas las mascotas
    const vacs = pets.map(p => ({ pet: p, v: L.nextVaccine(p) })).filter(x => x.v).sort((a, b) => a.v.next.localeCompare(b.v.next));
    const nextVac = vacs[0];
    const popular = PC.data.SERVICES.filter(s => s.popular).slice(0, 3);

    return html`<div>
      <${PageHeader} eyebrow=${PC.greeting()} title=${'Hola, ' + PC.firstName(owner.name)}
        subtitle=${next ? 'Tu próxima visita está lista. Aquí puedes seguirla en tiempo real.' : 'Todo en calma por ahora. Agenda una visita cuando quieras.'}
        actions=${html`<${Button} variant="gold" icon="calendar-plus" onClick=${() => PC.go('/owner/book')}>Agendar cita<//>
          <${Button} variant="soft" icon="plus" onClick=${() => PC.go('/owner/pets?add=1')}>Agregar mascota<//>`} />

      <div class="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-3">
        <section class="min-w-0 anim-up lg:col-span-2" style=${{ '--i': 1 }}>
          <${SectionTitle} title="Próxima visita" icon="navigation"
            right=${upcoming.length > 1 ? html`<button type="button" class="text-xs font-medium text-gold-300 hover:text-gold-200" onClick=${() => PC.go('/owner/appointments')}>Ver ${upcoming.length} próximas</button>` : null} />
          ${next ? html`<${PC.owner.ApptCard} appt=${next} featured />`
            : html`<${Empty} icon="calendar-plus" title="No tienes visitas programadas" text="Agenda salud, vacunación, estética y más, sin salir de casa."
              action=${html`<${Button} variant="gold" icon="calendar-plus" onClick=${() => PC.go('/owner/book')}>Agendar ahora<//>`} />`}
        </section>

        <section class="grid grid-cols-2 gap-3 lg:grid-cols-1 anim-up" style=${{ '--i': 2 }}>
          <${Stat} label="Mascotas registradas" value=${pets.length} icon="paw" hint=${pets.slice(0, 3).map(p => p.name).join(', ') || 'Aún sin mascotas'} />
          <${Stat} label="Atenciones realizadas" value=${done} icon="check-circle" tone="emerald" hint="Historial clínico completo" />
          <${Stat} label="Próximo refuerzo" tone="sky" icon="syringe"
            value=${nextVac ? dt.fmt(nextVac.v.next, { day: 'numeric', month: 'short' }) : '—'}
            hint=${nextVac ? `${nextVac.pet.name} · ${nextVac.v.name}` : 'Sin vacunas pendientes'} className="col-span-2 lg:col-span-1" />
        </section>
      </div>

      <section class="mt-8 anim-up" style=${{ '--i': 3 }}>
        <${SectionTitle} title="Mis mascotas" icon="paw" right=${html`<button type="button" class="text-xs font-medium text-gold-300 hover:text-gold-200" onClick=${() => PC.go('/owner/pets')}>Ver todas</button>`} />
        ${pets.length ? html`<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          ${pets.map(p => {
            const v = L.nextVaccine(p);
            const days = v ? dt.diff(v.next, dt.today()) : null;
            return html`<${Card} key=${p.id} hover className="p-4">
              <button type="button" class="flex w-full items-center gap-4 text-left" onClick=${() => setDrawerPet(p.id)} aria-label=${'Abrir expediente de ' + p.name}>
                <${PetAvatar} pet=${p} size=${56} />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-base font-semibold text-white">${p.name}</span>
                  <span class="block truncate text-xs text-slate-300">${p.breed} · ${PC.formatAge(p.ageMonths)}</span>
                  <span class="mt-1.5 flex flex-wrap gap-1.5">
                    <${Badge} tone="slate" icon="scale">${p.weight} kg<//>
                    ${days !== null ? html`<${Badge} tone=${days < 0 ? 'rose' : days <= 30 ? 'amber' : 'emerald'} icon="syringe">${days < 0 ? 'Vacuna vencida' : days <= 30 ? `Refuerzo en ${days} d` : 'Vacunas al día'}<//>` : null}
                  </span>
                </span>
                <${Icon} name="chevron-right" size=${18} className="text-slate-400" />
              </button>
            <//>`;
          })}
        </div>` : html`<${Empty} icon="paw" title="Aún no tienes mascotas registradas" text="Registra a tu compañero para agendar visitas y construir su historial clínico."
          action=${html`<${Button} variant="gold" icon="plus" onClick=${() => PC.go('/owner/pets?add=1')}>Registrar mascota<//>`} />`}
      </section>

      <div class="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <section class="anim-up" style=${{ '--i': 4 }}>
          <${SectionTitle} title="Actividad clínica reciente" icon="clipboard" />
          ${recent.length ? html`<div class="space-y-2">
            ${recent.map(t => {
              const pet = PC.q.pet(state, t.petId);
              const vet = PC.q.vet(state, t.vetId);
              const svc = L.service(t.serviceId);
              return html`<button key=${t.id} type="button" onClick=${() => setDrawerPet(t.petId)} class="glass glass-hover flex w-full items-start gap-3 rounded-2xl p-4 text-left">
                <${PetAvatar} pet=${pet} size=${40} />
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-semibold text-white">${pet ? pet.name : 'Mascota'} · ${svc ? svc.name : 'Atención'}</span>
                  <span class="block truncate text-xs text-slate-300">${t.diagnosis}</span>
                  <span class="mt-1 block text-[11px] text-slate-400">${dt.rel(t.date)} · ${vet ? vet.name : ''}</span>
                </span>
              </button>`;
            })}
          </div>` : html`<${Empty} icon="clipboard" title="Sin registros todavía" text="Los tratamientos aparecerán aquí al finalizar cada visita." />`}
        </section>

        <section class="anim-up" style=${{ '--i': 5 }}>
          <${SectionTitle} title="Servicios más solicitados" icon="sparkles" right=${html`<button type="button" class="text-xs font-medium text-gold-300 hover:text-gold-200" onClick=${() => PC.go('/owner/catalog')}>Ver catálogo</button>`} />
          <div class="space-y-2">
            ${popular.map(s => {
              const c = L.category(s.cat);
              return html`<button key=${s.id} type="button" onClick=${() => PC.go('/owner/book?service=' + s.id)} class="glass glass-hover flex w-full items-center gap-3 rounded-2xl p-4 text-left">
                <span class=${cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', PC.BUBBLE[c.tone])}><${Icon} name=${c.icon} size=${20} /></span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold text-white">${s.name}</span>
                  <span class="block text-xs text-slate-300">${c.name} · ${s.duration} min</span>
                </span>
                <span class="text-sm font-semibold text-gold-300 tabular">${PC.money(s.price)}</span>
              </button>`;
            })}
          </div>
        </section>
      </div>

      <${PC.shared.PetDrawer} petId=${drawerPet} open=${!!drawerPet} onClose=${() => setDrawerPet(null)} viewer="owner"
        onBook=${() => { const id = drawerPet; setDrawerPet(null); PC.go('/owner/book?pet=' + id); }} />
    </div>`;
  }

  PC.owner.Home = Home;
})(window.PC);
