/* Propietario · Mis mascotas (RF-02): registro, edición y expediente */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useEffect } = R;
  const { Button, Card, Badge, PetAvatar, PageHeader, Empty, Modal, Input, Select, Textarea, Slider, Chip, Confirm } = PC.ui;
  const L = PC.logic;
  const D = PC.data;
  PC.owner = PC.owner || {};

  const EMOJI = { Canino: ['🐶', '🐕', '🐩', '🦮', '🐕‍🦺'], Felino: ['🐱', '🐈', '🐈‍⬛', '😺'] };

  function PetFormModal({ open, onClose, pet, ownerId, onSaved }) {
    const isEdit = !!pet;
    const init = () => (pet
      ? { name: pet.name, species: pet.species, breed: pet.breed, sex: pet.sex, years: Math.floor(pet.ageMonths / 12), months: pet.ageMonths % 12,
        weight: pet.weight, history: pet.history || '', care: pet.care || [], careNotes: pet.careNotes || '', emoji: pet.emoji }
      : { name: '', species: 'Canino', breed: '', sex: 'Macho', years: 1, months: 0, weight: 10, history: '', care: [], careNotes: '', emoji: '🐶' });
    const [f, setF] = useState(init);
    const [errors, setErrors] = useState({});
    useEffect(() => { if (open) { setF(init()); setErrors({}); } }, [open, pet && pet.id]);
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));

    const setSpecies = s => setF(p => ({
      ...p, species: s, emoji: EMOJI[s][0], breed: D.BREEDS[s].includes(p.breed) ? p.breed : '',
    }));
    const toggleCare = c => set('care', f.care.includes(c) ? f.care.filter(x => x !== c) : [...f.care, c]);

    const submit = e => {
      if (e) e.preventDefault();
      const er = {};
      if (f.name.trim().length < 2) er.name = 'Ingresa el nombre de tu mascota.';
      if (f.breed.trim().length < 2) er.breed = 'Indica la raza (o "Criollo / Mestizo").';
      const months = Number(f.years) * 12 + Number(f.months);
      if (!(months > 0)) er.age = 'Indica la edad (años y/o meses).';
      if (!(f.weight > 0)) er.weight = 'El peso debe ser mayor a 0.';
      setErrors(er);
      if (Object.keys(er).length) { PC.focusError(); return; }
      const data = {
        name: f.name.trim(), species: f.species, breed: f.breed.trim(), sex: f.sex, ageMonths: months, weight: f.weight,
        history: f.history.trim(), care: f.care, careNotes: f.careNotes.trim(), emoji: f.emoji,
      };
      if (isEdit) {
        PC.act.updatePet(pet.id, data);
        PC.toast.push({ title: 'Mascota actualizada', text: `Guardamos los cambios de ${data.name}.` });
        onClose();
      } else {
        const created = PC.act.addPet({ ...data, ownerId });
        PC.toast.push({ title: `${data.name} fue registrado`, text: 'Ya puedes agendar visitas y construir su historial clínico.', tone: 'gold' });
        onClose();
        if (onSaved) onSaved(created);
      }
    };

    return html`<${Modal} open=${open} onClose=${onClose} size="lg" icon="paw" title=${isEdit ? 'Editar mascota' : 'Registrar mascota'}
      subtitle="Estos datos ayudan al profesional a prepararse antes de llegar."
      footer=${html`<${Button} variant="ghost" onClick=${onClose}>Cancelar<//><${Button} variant="gold" icon="check" onClick=${submit}>${isEdit ? 'Guardar cambios' : 'Registrar mascota'}<//>`}>
      <form onSubmit=${submit} noValidate class="space-y-6">
        <fieldset>
          <legend class="mb-2 text-xs font-medium text-slate-300">Especie</legend>
          <div class="grid grid-cols-2 gap-3">
            ${['Canino', 'Felino'].map(s => html`<button key=${s} type="button" aria-pressed=${f.species === s} onClick=${() => setSpecies(s)}
              class=${cn('flex items-center justify-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all',
                f.species === s ? 'border-gold-400 bg-gold-500/15 text-gold-200 shadow-[0_0_0_3px_rgba(53,94,75,.15)]' : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/25')}>
              <span class="text-2xl" aria-hidden="true">${s === 'Canino' ? '🐶' : '🐱'}</span>${s}
            </button>`)}
          </div>
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <${Input} label="Nombre" required value=${f.name} error=${errors.name} onChange=${e => set('name', e.target.value)} placeholder="Ej.: Max" data-autofocus="true" />
          <div>
            <${Input} label="Raza" required list="breed-options" value=${f.breed} error=${errors.breed} onChange=${e => set('breed', e.target.value)} placeholder="Selecciona o escribe" />
            <datalist id="breed-options">${D.BREEDS[f.species].map(b => html`<option key=${b} value=${b}></option>`)}</datalist>
          </div>
          <${Select} label="Sexo" value=${f.sex} onChange=${e => set('sex', e.target.value)} options=${[{ value: 'Macho', label: 'Macho' }, { value: 'Hembra', label: 'Hembra' }]} />
          <div>
            <p class="mb-1.5 block text-xs font-medium text-slate-300">Edad <span class="text-gold-400" aria-hidden="true">*</span></p>
            <div class="grid grid-cols-2 gap-2">
              <input class=${cn('pc-input', errors.age && '!border-clay-400/70')} type="number" min="0" max="30" aria-label="Años" placeholder="Años" value=${f.years} onChange=${e => set('years', e.target.value)} />
              <input class=${cn('pc-input', errors.age && '!border-clay-400/70')} type="number" min="0" max="11" aria-label="Meses" placeholder="Meses" value=${f.months} onChange=${e => set('months', e.target.value)} />
            </div>
            ${errors.age ? html`<p role="alert" class="mt-1.5 flex items-center gap-1 text-xs text-clay-700"><${Icon} name="alert" size=${13} />${errors.age}</p>` : null}
          </div>
        </div>

        <${Slider} label="Peso" unit="kg" min=${0.5} max=${80} step=${0.5} value=${f.weight} onChange=${v => set('weight', v)}
          hint="Ayuda a calcular dosis y tiempos de servicio." />

        <div>
          <p class="mb-2 text-xs font-medium text-slate-300">Avatar</p>
          <div class="flex flex-wrap gap-2">
            ${EMOJI[f.species].map(em => html`<button key=${em} type="button" aria-pressed=${f.emoji === em} aria-label=${'Avatar ' + em} onClick=${() => set('emoji', em)}
              class=${cn('grid h-12 w-12 place-items-center rounded-2xl border text-2xl transition-all', f.emoji === em ? 'border-gold-400 bg-gold-500/15' : 'border-white/10 bg-white/[0.04] hover:border-white/25')}>${em}</button>`)}
          </div>
        </div>

        <${Textarea} label="Historial médico relevante" rows=${3} value=${f.history} onChange=${e => set('history', e.target.value)}
          placeholder="Enfermedades, cirugías, alergias conocidas, tratamientos en curso…" />

        <fieldset>
          <legend class="mb-2 text-xs font-medium text-slate-300">Observaciones de cuidado especial</legend>
          <div class="flex flex-wrap gap-2">${D.CARE_TAGS.map(c => html`<${Chip} key=${c} tone="amber" active=${f.care.includes(c)} onClick=${() => toggleCare(c)}>${c}<//>`)}</div>
          <${Textarea} className="mt-3" aria-label="Notas de cuidado" rows=${2} value=${f.careNotes} onChange=${e => set('careNotes', e.target.value)}
            placeholder="Ej.: se asusta con el timbre; evitar pollo en premios…" />
        </fieldset>
      </form>
    <//>`;
  }

  function Pets() {
    const state = PC.useStore();
    const route = PC.useRoute();
    const owner = PC.q.currentOwner(state);
    const pets = PC.q.petsOf(state, owner.id);
    const [form, setForm] = useState({ open: false, pet: null });
    const [drawer, setDrawer] = useState(null);
    const [confirm, setConfirm] = useState(null);

    // Acceso directo desde Inicio: #/owner/pets?add=1
    useEffect(() => {
      if (route.query.add === '1') { setForm({ open: true, pet: null }); PC.go('/owner/pets'); }
    }, [route.query.add]);

    return html`<div>
      <${PageHeader} eyebrow="Mi familia" title="Mis mascotas"
        subtitle="Mantén sus datos al día: el profesional los consulta antes de cada visita."
        actions=${html`<${Button} variant="gold" icon="plus" onClick=${() => setForm({ open: true, pet: null })}>Agregar mascota<//>`} />

      ${pets.length ? html`<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        ${pets.map((p, i) => {
          const v = L.nextVaccine(p);
          const days = v ? dt.diff(v.next, dt.today()) : null;
          const n = L.treatmentsForPet(state, p.id).length;
          const upcoming = L.upcomingFor(L.apptsForPet(state, p.id))[0];
          return html`<${Card} key=${p.id} hover className="anim-up flex flex-col p-5" style=${{ '--i': i }}>
            <div class="flex items-start gap-4">
              <${PetAvatar} pet=${p} size=${64} />
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-lg font-semibold text-white">${p.name}</h2>
                <p class="truncate text-sm text-slate-300">${p.species} · ${p.breed}</p>
                <p class="text-xs text-slate-400">${p.sex} · ${PC.formatAge(p.ageMonths)} · ${p.weight} kg</p>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-1.5">
              ${(p.care || []).slice(0, 3).map(c => html`<${Badge} key=${c} tone="amber">${c}<//>`)}
              ${days !== null ? html`<${Badge} tone=${days < 0 ? 'rose' : days <= 30 ? 'amber' : 'emerald'} icon="syringe">${days < 0 ? 'Vacuna vencida' : days <= 30 ? `Refuerzo en ${days} d` : 'Vacunas al día'}<//>` : html`<${Badge} tone="slate" icon="syringe">Sin vacunas<//>`}
            </div>
            <p class="mt-4 line-clamp-2 min-h-[2.5rem] text-sm text-slate-300">${p.history || 'Sin historial médico registrado.'}</p>
            <div class="mt-3 flex items-center gap-4 border-t border-white/10 pt-3 text-xs text-slate-300">
              <span class="flex items-center gap-1.5"><${Icon} name="clipboard" size=${14} className="text-gold-400" />${n} registros</span>
              ${upcoming ? html`<span class="flex items-center gap-1.5"><${Icon} name="calendar" size=${14} className="text-gold-400" />${dt.rel(upcoming.date)}</span>` : null}
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <${Button} variant="soft" size="sm" icon="eye" className="flex-1" onClick=${() => setDrawer(p.id)}>Expediente<//>
              <${Button} variant="outline" size="sm" icon="calendar-plus" className="flex-1" onClick=${() => PC.go('/owner/book?pet=' + p.id)}>Agendar<//>
              <${PC.ui.IconButton} icon="pencil" label=${'Editar ' + p.name} variant="soft" size="sm" onClick=${() => setForm({ open: true, pet: p })} />
              <${PC.ui.IconButton} icon="trash" label=${'Eliminar ' + p.name} variant="danger" size="sm" onClick=${() => setConfirm(p)} />
            </div>
          <//>`;
        })}
        <button type="button" onClick=${() => setForm({ open: true, pet: null })}
          class="anim-up flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gold-500/35 text-gold-300 transition-all hover:border-gold-400 hover:bg-gold-500/5" style=${{ '--i': pets.length }}>
          <span class="grid h-12 w-12 place-items-center rounded-2xl bg-gold-500/15"><${Icon} name="plus" size=${24} /></span>
          <span class="text-sm font-semibold">Registrar otra mascota</span>
        </button>
      </div>` : html`<${Empty} icon="paw" title="Aún no has registrado mascotas" text="Agrega a tu compañero con su especie, raza, edad, peso e historial para empezar a agendar."
        action=${html`<${Button} variant="gold" icon="plus" onClick=${() => setForm({ open: true, pet: null })}>Registrar mi primera mascota<//>`} />`}

      <${PetFormModal} open=${form.open} pet=${form.pet} ownerId=${owner.id} onClose=${() => setForm({ open: false, pet: null })}
        onSaved=${p => setDrawer(p.id)} />
      <${PC.shared.PetDrawer} petId=${drawer} open=${!!drawer} onClose=${() => setDrawer(null)} viewer="owner"
        onBook=${() => { const id = drawer; setDrawer(null); PC.go('/owner/book?pet=' + id); }} />
      <${Confirm} open=${!!confirm} title=${confirm ? '¿Eliminar a ' + confirm.name + '?' : ''}
        text="Se quitará de tu lista y se cancelarán sus citas próximas. Su historial clínico se conserva en el sistema."
        confirmLabel="Eliminar mascota" onCancel=${() => setConfirm(null)}
        onConfirm=${() => { PC.act.removePet(confirm.id); PC.toast.push({ title: 'Mascota eliminada', text: confirm.name + ' ya no aparece en tu lista.', tone: 'info' }); setConfirm(null); }} />
    </div>`;
  }

  PC.owner.Pets = Pets;
  PC.owner.PetFormModal = PetFormModal;
})(window.PC);
