/* Propietario · Perfil y preferencias */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useEffect } = R;
  const { Button, Card, Input, Select, Toggle, PageHeader, SectionTitle, Avatar, Confirm } = PC.ui;
  const D = PC.data;
  PC.owner = PC.owner || {};

  function Profile() {
    const state = PC.useStore();
    const owner = PC.q.currentOwner(state);
    const [f, setF] = useState(() => ({ name: owner.name, phone: owner.phone, address: owner.address, zoneId: owner.zoneId, notify: owner.notify || {} }));
    const [errors, setErrors] = useState({});
    const [resetting, setResetting] = useState(false);
    useEffect(() => { setF({ name: owner.name, phone: owner.phone, address: owner.address, zoneId: owner.zoneId, notify: owner.notify || {} }); setErrors({}); }, [owner.id]);
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const dirty = f.name !== owner.name || f.phone !== owner.phone || f.address !== owner.address || f.zoneId !== owner.zoneId || JSON.stringify(f.notify) !== JSON.stringify(owner.notify || {});

    const save = e => {
      e.preventDefault();
      const er = {};
      if (f.name.trim().length < 3) er.name = 'Ingresa tu nombre completo.';
      if (f.address.trim().length < 5) er.address = 'Indica una dirección válida.';
      setErrors(er);
      if (Object.keys(er).length) { PC.focusError(); return; }
      PC.act.updateProfile(owner.id, { name: f.name.trim(), phone: f.phone.trim(), address: f.address.trim(), zoneId: f.zoneId, notify: f.notify });
      PC.toast.push({ title: 'Perfil actualizado', text: 'Tu dirección predeterminada se usará en próximos agendamientos.' });
    };

    const pets = PC.q.petsOf(state, owner.id).length;
    const appts = PC.q.apptsOf(state, owner.id).length;

    return html`<div>
      <${PageHeader} eyebrow="Cuenta" title="Mi perfil" subtitle="Gestiona tus datos de contacto, dirección predeterminada y preferencias." />
      <div class="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit=${save} noValidate class="space-y-6">
          <${Card} className="p-5 sm:p-6 anim-up">
            <${SectionTitle} title="Datos personales" icon="user" />
            <div class="grid gap-4 sm:grid-cols-2">
              <${Input} label="Nombre completo" required value=${f.name} error=${errors.name} onChange=${e => set('name', e.target.value)} className="sm:col-span-2" />
              <${Input} label="Correo electrónico" icon="mail" value=${owner.email} disabled hint="El correo es tu identificador de acceso." />
              <${Input} label="Teléfono / WhatsApp" icon="phone" type="tel" value=${f.phone} onChange=${e => set('phone', e.target.value)} />
            </div>
          <//>
          <${Card} className="p-5 sm:p-6 anim-up" style=${{ '--i': 1 }}>
            <${SectionTitle} title="Dirección predeterminada" icon="map-pin" />
            <div class="grid gap-4 sm:grid-cols-2">
              <${Input} label="Dirección de atención" required value=${f.address} error=${errors.address} onChange=${e => set('address', e.target.value)} className="sm:col-span-2" />
              <${Select} label="Localidad" value=${f.zoneId} onChange=${e => set('zoneId', e.target.value)} options=${D.ZONES.map(z => ({ value: z.id, label: z.name }))} />
            </div>
          <//>
          <${Card} className="p-5 sm:p-6 anim-up" style=${{ '--i': 2 }}>
            <${SectionTitle} title="Notificaciones" icon="bell" />
            <div class="space-y-4">
              <${Toggle} label="Correo electrónico" description="Confirmaciones y registros clínicos." checked=${!!f.notify.email} onChange=${v => set('notify', { ...f.notify, email: v })} />
              <${Toggle} label="WhatsApp" description="Avisos cuando tu profesional va en camino." checked=${!!f.notify.whatsapp} onChange=${v => set('notify', { ...f.notify, whatsapp: v })} />
              <${Toggle} label="Notificaciones push" description="Alertas inmediatas en tu dispositivo." checked=${!!f.notify.push} onChange=${v => set('notify', { ...f.notify, push: v })} />
            </div>
          <//>
          <div class="flex justify-end gap-2">
            <${Button} variant="ghost" disabled=${!dirty} onClick=${() => setF({ name: owner.name, phone: owner.phone, address: owner.address, zoneId: owner.zoneId, notify: owner.notify || {} })}>Descartar<//>
            <${Button} type="submit" variant="gold" icon="save" disabled=${!dirty}>Guardar cambios<//>
          </div>
        </form>

        <aside class="space-y-5">
          <${Card} strong className="p-5 text-center anim-up">
            <${Avatar} name=${owner.name} size=${72} className="mx-auto" />
            <h2 class="mt-3 text-lg font-semibold text-white">${owner.name}</h2>
            <p class="text-sm text-slate-300">${owner.email}</p>
            <div class="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div><p class="text-2xl font-semibold text-gold-300">${pets}</p><p class="text-xs text-slate-300">Mascotas</p></div>
              <div><p class="text-2xl font-semibold text-gold-300">${appts}</p><p class="text-xs text-slate-300">Citas</p></div>
            </div>
          <//>
          <${Card} className="p-5 anim-up" style=${{ '--i': 1 }}>
            <h2 class="mb-1 text-sm font-semibold text-white">Datos de demostración</h2>
            <p class="mb-3 text-xs text-slate-300">Todo se guarda en este navegador. Puedes restaurar la información inicial en cualquier momento.</p>
            <${Button} variant="soft" size="sm" icon="undo" onClick=${() => setResetting(true)}>Restablecer demo<//>
          <//>
        </aside>
      </div>
      <${Confirm} open=${resetting} title="¿Restablecer datos de demostración?" tone="gold" icon="undo" confirmLabel="Restablecer"
        text="Se borrarán las mascotas, citas y registros que hayas creado y volverás a los datos iniciales."
        onCancel=${() => setResetting(false)}
        onConfirm=${() => { PC.act.resetDemo(); setResetting(false); PC.go('/owner/home'); PC.toast.push({ title: 'Demo restablecida', tone: 'info' }); }} />
    </div>`;
  }

  PC.owner.Profile = Profile;
})(window.PC);
