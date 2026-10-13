/* Autenticación: inicio de sesión, registro de propietarios y accesos demo */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon } = PC;
  const { useState } = R;
  const { Button, Input, Select, Segmented } = PC.ui;
  const D = PC.data;

  const DEMOS = [
    { role: 'owner', label: 'Propietaria', who: 'Laura Martínez', email: 'laura@demo.co', icon: 'paw', text: '3 mascotas · cita en camino' },
    { role: 'vet', label: 'Veterinaria', who: 'Dra. Camila Restrepo', email: 'camila@petcare.co', icon: 'stethoscope', text: 'Agenda del día y ruta' },
    { role: 'admin', label: 'Administradora', who: 'Natalia Quintero', email: 'admin@petcare.co', icon: 'layers', text: 'Analítica, personal y rutas' },
  ];

  function enterAs(email) {
    const r = PC.act.login(email, 'demo1234');
    if (r.ok) {
      const home = { owner: 'home', vet: 'agenda', admin: 'dashboard' }[r.role];
      PC.go(`/${r.role}/${home}`);
      PC.toast.push({ title: `Bienvenido, ${PC.firstName(r.user.name)}`, text: 'Sesión demo iniciada. Puedes cambiar de rol desde el encabezado.', tone: 'gold' });
    }
  }

  function AuthScreen() {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', zoneId: 'chico' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const submit = e => {
      e.preventDefault();
      const er = {};
      if (mode === 'register' && form.name.trim().length < 3) er.name = 'Ingresa tu nombre completo.';
      if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Ingresa un correo válido.';
      if (form.password.length < 6) er.password = 'Mínimo 6 caracteres.';
      if (mode === 'register' && form.address.trim().length < 5) er.address = 'Indica tu dirección de atención.';
      setErrors(er);
      if (Object.keys(er).length) { PC.focusError(); return; }
      setBusy(true);
      setTimeout(() => {
        if (mode === 'login') {
          const r = PC.act.login(form.email, form.password);
          if (!r.ok) { setErrors({ form: r.error }); setBusy(false); return; }
          PC.go(`/${r.role}/${{ owner: 'home', vet: 'agenda', admin: 'dashboard' }[r.role]}`);
          PC.toast.push({ title: `Hola de nuevo, ${PC.firstName(r.user.name)}`, tone: 'success' });
        } else {
          const r = PC.act.register(form);
          if (!r.ok) { setErrors({ email: r.error }); setBusy(false); return; }
          PC.go('/owner/pets');
          PC.toast.push({ title: 'Cuenta creada', text: 'Registra a tu primera mascota para comenzar.', tone: 'gold' });
        }
        setBusy(false);
      }, 350);
    };

    return html`<div class="app-bg relative min-h-screen overflow-hidden">
      <div aria-hidden="true" class="pointer-events-none absolute -left-28 top-16 h-80 w-80 rounded-full bg-sage-400/30 blur-3xl"></div>
      <div aria-hidden="true" class="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-sand-400/30 blur-3xl"></div>
      <div class="relative mx-auto grid min-h-screen max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8">
        <section class="min-w-0 anim-up">
          <div class="mb-8 flex items-center gap-3">
            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-gold-500 text-navy-900 shadow-[0_10px_30px_-10px_rgba(53,94,75,.38)]"><${Icon} name="paw" size=${26} strokeWidth=${2.2} /></span>
            <div><p class="text-lg font-bold leading-tight text-white">PetCare <span class="gold-text">Domicilio</span></p><p class="text-xs text-slate-300">Bienestar para mascotas, en casa</p></div>
          </div>
          <h1 class="text-4xl font-semibold leading-[1.1] tracking-tight text-white text-balance sm:text-5xl">Cuidado veterinario <span class="gold-text">premium</span> que llega a tu puerta.</h1>
          <p class="mt-5 max-w-xl text-base leading-relaxed text-slate-300">Agenda salud, vacunación, estética, relajación, entrenamiento y servicios funerarios. Sigue a tu profesional en tiempo real y conserva el expediente clínico completo de tu mascota.</p>
          <div class="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            ${[['stethoscope', 'Profesionales verificados'], ['navigation', 'Seguimiento en vivo'], ['clipboard', 'Historial clínico digital']].map(([ic, tx]) => html`<div key=${tx} class="glass flex items-center gap-3 rounded-2xl p-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300"><${Icon} name=${ic} size=${18} /></span>
              <span class="text-[13px] font-medium leading-snug text-slate-100">${tx}</span></div>`)}
          </div>

          <div class="mt-9">
            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-sand-700">Explora la demo con un clic</p>
            <div class="grid gap-3 sm:grid-cols-3">
              ${DEMOS.map(d => html`<button key=${d.role} type="button" onClick=${() => enterAs(d.email)}
                class="glass glass-hover group rounded-2xl p-4 text-left">
                <span class="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gold-500/15 text-gold-300 transition-colors group-hover:bg-gold-500 group-hover:text-navy-900"><${Icon} name=${d.icon} size=${20} /></span>
                <p class="text-sm font-semibold text-white">${d.label}</p>
                <p class="text-xs text-slate-300">${d.who}</p>
                <p class="mt-1 text-[11px] text-slate-400">${d.text}</p>
              </button>`)}
            </div>
          </div>
        </section>

        <div class="relative">
        <span aria-hidden="true" class="anim-float absolute -right-3 -top-6 z-10 hidden h-16 w-16 place-items-center rounded-3xl border border-forest-500/15 bg-cream-50 text-4xl shadow-lg sm:grid">🐶</span>
        <span aria-hidden="true" class="anim-float absolute -bottom-6 -left-4 z-10 hidden h-14 w-14 place-items-center rounded-3xl border border-forest-500/15 bg-sand-300 text-3xl shadow-lg sm:grid" style=${{ animationDelay: '-3s' }}>🐱</span>
        <section class="glass-strong anim-up w-full rounded-3xl p-6 sm:p-8" style=${{ '--i': 2 }}>
          <${Segmented} full value=${mode} onChange=${m => { setMode(m); setErrors({}); }} label="Modo de acceso"
            options=${[{ value: 'login', label: 'Iniciar sesión', icon: 'log-in' }, { value: 'register', label: 'Crear cuenta', icon: 'user' }]} />
          <form onSubmit=${submit} noValidate class="mt-6 space-y-4">
            <h2 class="text-xl font-semibold text-white">${mode === 'login' ? 'Bienvenido de nuevo' : 'Registra tu cuenta de propietario'}</h2>
            ${errors.form ? html`<p role="alert" class="flex items-center gap-2 rounded-xl border border-clay-400/30 bg-clay-400/20 px-3 py-2 text-sm text-clay-700"><${Icon} name="alert" size=${16} />${errors.form}</p>` : null}
            ${mode === 'register' ? html`<${Input} label="Nombre completo" icon="user" required autoComplete="name" value=${form.name} error=${errors.name} onChange=${e => set('name', e.target.value)} />` : null}
            <${Input} label="Correo electrónico" icon="mail" type="email" required autoComplete="email" value=${form.email} error=${errors.email} onChange=${e => set('email', e.target.value)} placeholder="tucorreo@ejemplo.com" />
            <${Input} label="Contraseña" icon="lock" type="password" required autoComplete=${mode === 'login' ? 'current-password' : 'new-password'} value=${form.password} error=${errors.password} onChange=${e => set('password', e.target.value)}
              hint=${mode === 'register' ? 'Es una demostración: no uses una contraseña real. Los datos solo se guardan en tu navegador.' : undefined} />
            ${mode === 'register' ? html`<div class="space-y-4 anim-fade">
              <${Input} label="Teléfono / WhatsApp" icon="phone" type="tel" autoComplete="tel" value=${form.phone} onChange=${e => set('phone', e.target.value)} placeholder="+57 300 000 0000" />
              <${Input} label="Dirección predeterminada" icon="map-pin" required value=${form.address} error=${errors.address} onChange=${e => set('address', e.target.value)} placeholder="Carrera 15 # 85-20, Apto 301" />
              <${Select} label="Localidad" value=${form.zoneId} onChange=${e => set('zoneId', e.target.value)} options=${D.ZONES.map(z => ({ value: z.id, label: z.name }))} />
            </div>` : null}
            <${Button} type="submit" variant="gold" size="lg" className="w-full" loading=${busy} iconRight="arrow-right">${mode === 'login' ? 'Ingresar' : 'Crear mi cuenta'}<//>
            ${mode === 'login' ? html`<p class="text-center text-xs text-slate-400">Cuentas demo: <span class="text-slate-200">laura@demo.co</span>, <span class="text-slate-200">camila@petcare.co</span> o <span class="text-slate-200">admin@petcare.co</span> · contraseña <span class="text-slate-200">demo1234</span></p>` : null}
          </form>
        </section>
        </div>
      </div>
    </div>`;
  }

  PC.AuthScreen = AuthScreen;
})(window.PC);
