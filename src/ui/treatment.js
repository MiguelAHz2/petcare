/* Formulario clínico de tratamiento (RF-05): diagnóstico, procedimientos, medicamentos, recomendaciones */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useEffect } = R;
  const { Modal, Button, Input, Textarea, Select, Slider, Chip, PetAvatar, Badge } = PC.ui;
  const L = PC.logic;
  const D = PC.data;

  const blankMed = () => ({ name: '', dose: '', freq: '' });

  function TreatmentForm({ appt, open, onClose, onSaved }) {
    const state = PC.useStore();
    const pet = appt ? PC.q.pet(state, appt.petId) : null;
    const owner = appt ? PC.q.owner(state, appt.ownerId) : null;
    const svc = appt ? L.service(appt.serviceId) : null;

    const init = () => ({
      weight: pet ? pet.weight : 10,
      temp: 38.5,
      hr: pet && pet.species === 'Felino' ? 160 : 100,
      condition: 'Bueno',
      diagnosis: '',
      procedures: [],
      custom: '',
      meds: [blankMed()],
      recommendations: '',
      nextVisit: '',
    });
    const [f, setF] = useState(init);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (open) { setF(init()); setErrors({}); setSaving(false); } }, [open, appt && appt.id]);

    if (!appt || !pet) return null;
    const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
    const procOptions = D.PROCEDURES[svc.cat] || [];
    const allProcs = Array.from(new Set([...procOptions, ...f.procedures]));
    const toggleProc = p => set('procedures', f.procedures.includes(p) ? f.procedures.filter(x => x !== p) : [...f.procedures, p]);
    const addCustom = () => {
      const v = f.custom.trim();
      if (!v) return;
      setF(prev => ({ ...prev, procedures: prev.procedures.includes(v) ? prev.procedures : [...prev.procedures, v], custom: '' }));
    };
    const setMed = (i, k, v) => set('meds', f.meds.map((m, j) => (j === i ? { ...m, [k]: v } : m)));

    const submit = e => {
      if (e) e.preventDefault();
      const er = {};
      if (f.diagnosis.trim().length < 5) er.diagnosis = 'Describe el diagnóstico o hallazgo principal.';
      if (!f.procedures.length) er.procedures = 'Selecciona al menos un procedimiento realizado.';
      setErrors(er);
      if (Object.keys(er).length) { PC.focusError(); return; }
      setSaving(true);
      const t = PC.act.saveTreatment({
        apptId: appt.id,
        diagnosis: f.diagnosis,
        procedures: f.procedures,
        medications: f.meds.filter(m => m.name.trim()).map(m => ({ name: m.name.trim(), dose: m.dose.trim(), freq: m.freq.trim() })),
        recommendations: f.recommendations,
        vitals: { weight: f.weight, temp: f.temp, hr: Number(f.hr) || null, condition: f.condition },
        nextVisit: f.nextVisit || null,
      });
      PC.toast.push({ title: 'Tratamiento guardado', text: `Visita de ${pet.name} finalizada. El historial clínico se actualizó.`, tone: 'success' });
      if (onSaved) onSaved(t);
      onClose();
    };

    return html`<${Modal} open=${open} onClose=${onClose} size="lg" icon="clipboard" title=${'Registro de tratamiento · ' + pet.name}
      subtitle=${svc.name + ' · ' + dt.rel(appt.date) + ' ' + L.slot(appt.slotId).label}
      footer=${html`<${Button} variant="ghost" onClick=${onClose}>Cancelar<//>
        <${Button} variant="gold" icon="check" loading=${saving} onClick=${submit}>Guardar y finalizar visita<//>`}>
      <form onSubmit=${submit} noValidate class="space-y-6">
        <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <${PetAvatar} pet=${pet} size=${44} />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-white">${pet.name} · ${pet.breed}</p>
            <p class="text-xs text-slate-300">${PC.formatAge(pet.ageMonths)} · ${pet.sex} · Propietario: ${owner ? owner.name : '—'}</p>
          </div>
          ${(pet.care || []).map(c => html`<${Badge} key=${c} tone="amber" icon="alert">${c}<//>`)}
        </div>
        ${pet.careNotes ? html`<p class="-mt-3 text-xs text-sand-700/90">Nota de cuidado: ${pet.careNotes}</p>` : null}

        <fieldset class="space-y-4">
          <legend class="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><${Icon} name="activity" size=${16} className="text-gold-400" />Signos vitales</legend>
          <div class="grid gap-5 sm:grid-cols-2">
            <${Slider} label="Peso" unit="kg" min=${0.5} max=${80} step=${0.1} value=${f.weight} onChange=${v => set('weight', +v.toFixed(1))} />
            <${Slider} label="Temperatura" unit="°C" min=${35} max=${42} step=${0.1} value=${f.temp} onChange=${v => set('temp', +v.toFixed(1))}
              hint=${f.temp > 39.3 ? 'Temperatura elevada: considera registrar fiebre.' : f.temp < 37.5 ? 'Temperatura baja: verifica hipotermia.' : 'Dentro del rango normal (37,5 – 39,2 °C).'} />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <${Input} label="Frecuencia cardiaca (lpm)" type="number" min="30" max="260" value=${f.hr} onChange=${e => set('hr', e.target.value)} />
            <${Select} label="Estado general" value=${f.condition} onChange=${e => set('condition', e.target.value)}
              options=${['Excelente', 'Bueno', 'Regular', 'Delicado'].map(v => ({ value: v, label: v }))} />
          </div>
        </fieldset>

        <${Textarea} label="Diagnóstico / hallazgos" required rows=${3} value=${f.diagnosis} error=${errors.diagnosis}
          placeholder="Ej.: Otitis externa leve en oído izquierdo, sin signos sistémicos."
          onChange=${e => set('diagnosis', e.target.value)} />

        <fieldset>
          <legend class="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><${Icon} name="stethoscope" size=${16} className="text-gold-400" />Procedimientos realizados <span class="text-gold-400" aria-hidden="true">*</span></legend>
          <div class="flex flex-wrap gap-2">
            ${allProcs.map(p => html`<${Chip} key=${p} active=${f.procedures.includes(p)} onClick=${() => toggleProc(p)}>${p}<//>`)}
          </div>
          <div class="mt-3 flex gap-2">
            <input class="pc-input" placeholder="Otro procedimiento…" aria-label="Agregar otro procedimiento" value=${f.custom}
              onChange=${e => set('custom', e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
            <${Button} variant="soft" icon="plus" onClick=${addCustom}>Agregar<//>
          </div>
          ${errors.procedures ? html`<p role="alert" class="mt-2 flex items-center gap-1 text-xs text-clay-700"><${Icon} name="alert" size=${13} />${errors.procedures}</p>` : null}
        </fieldset>

        <fieldset>
          <legend class="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><${Icon} name="pill" size=${16} className="text-gold-400" />Medicamentos aplicados o formulados</legend>
          <div class="space-y-2">
            ${f.meds.map((m, i) => html`<div key=${i} class="grid items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
              <${Input} label=${i === 0 ? 'Medicamento' : undefined} aria-label="Medicamento" placeholder="Nombre / principio activo" value=${m.name} onChange=${e => setMed(i, 'name', e.target.value)} />
              <${Input} label=${i === 0 ? 'Dosis / vía' : undefined} aria-label="Dosis y vía" placeholder="Ej.: 1 ml SC" value=${m.dose} onChange=${e => setMed(i, 'dose', e.target.value)} />
              <${Input} label=${i === 0 ? 'Frecuencia / duración' : undefined} aria-label="Frecuencia y duración" placeholder="Cada 12 h por 7 días" value=${m.freq} onChange=${e => setMed(i, 'freq', e.target.value)} />
              <button type="button" aria-label="Quitar medicamento" disabled=${f.meds.length === 1} onClick=${() => set('meds', f.meds.filter((_, j) => j !== i))}
                class="grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-clay-400/15 hover:text-clay-700 disabled:opacity-30"><${Icon} name="trash" size=${16} /></button>
            </div>`)}
          </div>
          <${Button} variant="ghost" size="sm" icon="plus" className="mt-2" onClick=${() => set('meds', [...f.meds, blankMed()])}>Agregar medicamento<//>
        </fieldset>

        <${Textarea} label="Recomendaciones para el propietario" rows=${3} value=${f.recommendations}
          placeholder="Cuidados en casa, dieta, signos de alarma…" onChange=${e => set('recommendations', e.target.value)} />

        <${Input} label="Próximo control (opcional)" type="date" min=${dt.today()} value=${f.nextVisit} onChange=${e => set('nextVisit', e.target.value)}
          hint="Se programará un recordatorio automático para el propietario." className="sm:max-w-xs" />
      </form>
    <//>`;
  }

  PC.TreatmentForm = TreatmentForm;
})(window.PC);
