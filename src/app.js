/* Shell de la aplicación: encabezado con selector de rol, navegación, rutas y arranque */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon, dt } = PC;
  const { useState, useEffect, useRef } = R;
  const { Button, IconButton, Avatar, Dropdown, ToastHost, Badge } = PC.ui;

  const ROLES = [
    { id: 'owner', label: 'Propietario', icon: 'paw', home: 'home' },
    { id: 'vet', label: 'Veterinario', icon: 'stethoscope', home: 'agenda' },
    { id: 'admin', label: 'Administrador', icon: 'layers', home: 'dashboard' },
  ];

  const NAV = {
    owner: [
      { id: 'home', label: 'Inicio', icon: 'home' },
      { id: 'pets', label: 'Mis mascotas', short: 'Mascotas', icon: 'paw' },
      { id: 'catalog', label: 'Planes y servicios', short: 'Servicios', icon: 'layers' },
      { id: 'book', label: 'Agendar cita', short: 'Agendar', icon: 'calendar-plus', primary: true },
      { id: 'appointments', label: 'Mis citas', short: 'Citas', icon: 'calendar-check' },
      { id: 'profile', label: 'Mi perfil', short: 'Perfil', icon: 'user', desktopOnly: true },
    ],
    vet: [
      { id: 'agenda', label: 'Mi agenda', icon: 'calendar' },
      { id: 'patients', label: 'Pacientes', icon: 'clipboard' },
      { id: 'availability', label: 'Disponibilidad', icon: 'sliders' },
    ],
    admin: [
      { id: 'dashboard', label: 'Panel', icon: 'dashboard' },
      { id: 'staff', label: 'Personal', icon: 'users' },
      { id: 'assign', label: 'Asignación', icon: 'calendar-check' },
      { id: 'routes', label: 'Rutas', icon: 'route' },
    ],
  };

  const PAGES = {
    owner: { home: PC.owner.Home, pets: PC.owner.Pets, catalog: PC.owner.Catalog, book: PC.owner.Book, appointments: PC.owner.Appointments, profile: PC.owner.Profile },
    vet: { agenda: PC.vet.Agenda, patients: PC.vet.Patients, availability: PC.vet.Availability },
    admin: { dashboard: PC.admin.Dashboard, staff: PC.admin.Staff, assign: PC.admin.Assign, routes: PC.admin.Routes },
  };

  const ROLE_LABEL = { owner: 'Propietario', vet: 'Veterinario', admin: 'Administrador' };

  function userFor(state, role) {
    if (role === 'owner') { const o = PC.q.currentOwner(state); return { name: o.name, email: o.email, color: '#355E4B' }; }
    if (role === 'vet') { const v = PC.q.currentVet(state); return { name: v.name, email: v.email, color: v.color }; }
    const a = PC.q.currentAdmin(state);
    return { name: a.name, email: a.email, color: '#8A6F8E' };
  }

  // ——— Selector de rol dinámico (sin recargar la página)
  function RoleSwitcher({ role, onChange, className }) {
    const idx = Math.max(0, ROLES.findIndex(r => r.id === role));
    const onKey = (e, i) => {
      let n = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % ROLES.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + ROLES.length) % ROLES.length;
      else return;
      e.preventDefault();
      onChange(ROLES[n].id);
      setTimeout(() => { const el = document.getElementById('role-' + ROLES[n].id); if (el) el.focus(); }, 0);
    };
    return html`<div role="radiogroup" aria-label="Cambiar de rol" class=${cn('relative grid grid-cols-3 rounded-2xl border border-forest-500/15 bg-cream-50/85 p-1 shadow-sm', className)}>
      <span aria-hidden="true" class="absolute bottom-1 top-1 rounded-xl bg-gold-500 shadow-[0_6px_18px_-8px_rgba(53,94,75,.38)] transition-transform duration-300 ease-out"
        style=${{ left: 4, width: 'calc((100% - 8px) / 3)', transform: `translateX(${idx * 100}%)` }}></span>
      ${ROLES.map((r, i) => html`<button key=${r.id} id=${'role-' + r.id} type="button" role="radio" aria-checked=${role === r.id} tabIndex=${role === r.id ? 0 : -1}
        onKeyDown=${e => onKey(e, i)} onClick=${() => onChange(r.id)}
        class=${cn('relative z-10 flex items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors duration-200 sm:px-4',
          role === r.id ? 'text-navy-900' : 'text-slate-300 hover:text-white')}>
        <${Icon} name=${r.icon} size=${17} /><span class="hidden sm:inline">${r.label}</span><span class="sr-only sm:hidden">${r.label}</span>
      </button>`)}
    </div>`;
  }

  function Bell({ role }) {
    const state = PC.useStore();
    const list = PC.q.notificationsFor(state, role);
    const unread = list.filter(n => !n.read).length;
    return html`<${Dropdown} width="w-[22rem]" renderButton=${({ toggle, open }) => html`<${IconButton} icon="bell" label=${'Notificaciones' + (unread ? `, ${unread} sin leer` : '')} onClick=${toggle} badge=${unread || null} variant="soft" aria-expanded=${open} />`}>
      ${() => html`<div>
        <div class="flex items-center justify-between px-2 pb-2 pt-1">
          <p class="text-sm font-semibold text-white">Notificaciones</p>
          ${unread ? html`<button type="button" class="text-xs font-medium text-gold-300 hover:text-gold-200" onClick=${() => PC.act.markRead(role)}>Marcar como leídas</button>` : null}
        </div>
        <ul class="max-h-80 space-y-1 overflow-y-auto">
          ${list.slice(0, 12).map(n => html`<li key=${n.id} class=${cn('flex items-start gap-3 rounded-xl p-2.5', !n.read && 'bg-gold-500/[0.08]')}>
            <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-gold-300"><${Icon} name=${n.icon || 'bell'} size=${16} /></span>
            <div class="min-w-0"><p class="text-[13px] leading-snug text-slate-100">${n.text}</p><p class="mt-0.5 text-[11px] text-slate-400">${dt.stamp(n.at)}</p></div>
            ${!n.read ? html`<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-400" aria-label="No leída"></span>` : null}
          </li>`)}
          ${!list.length ? html`<li class="px-3 py-8 text-center text-sm text-slate-300">Sin notificaciones por ahora.</li>` : null}
        </ul>
      </div>`}
    <//>`;
  }

  function AccountMenu({ role, user }) {
    return html`<${Dropdown} width="w-64" renderButton=${({ toggle, open }) => html`<button type="button" onClick=${toggle} aria-label="Menú de cuenta" aria-expanded=${open}
        class="flex items-center gap-2 rounded-2xl border border-forest-500/15 bg-cream-50/85 p-1 pr-3 shadow-sm transition-colors hover:bg-sage-100">
        <${Avatar} name=${user.name} color=${user.color} size=${34} />
        <span class="hidden max-w-[130px] truncate text-sm font-medium text-white md:block">${PC.firstName(user.name)}</span>
        <${Icon} name="chevron-down" size=${14} className="hidden text-slate-400 md:block" />
      </button>`}>
      ${({ close }) => html`<div>
        <div class="flex items-center gap-3 border-b border-white/10 px-2 pb-3 pt-1">
          <${Avatar} name=${user.name} color=${user.color} size=${42} />
          <div class="min-w-0"><p class="truncate text-sm font-semibold text-white">${user.name}</p><p class="truncate text-xs text-slate-300">${user.email}</p>
          <${Badge} tone="gold" className="mt-1">${ROLE_LABEL[role]}<//></div>
        </div>
        <div class="pt-2">
          ${role === 'owner' ? html`<button type="button" class="menu-item" onClick=${() => { close(); PC.go('/owner/profile'); }}><${Icon} name="user" size=${16} />Mi perfil</button>` : null}
          <button type="button" class="menu-item" onClick=${() => { close(); PC.act.resetDemo(); PC.go(`/${role}/${ROLES.find(r => r.id === role).home}`); PC.toast.push({ title: 'Datos de demostración restablecidos', tone: 'info' }); }}><${Icon} name="undo" size=${16} />Restablecer datos demo</button>
          <button type="button" class="menu-item text-clay-700" onClick=${() => { close(); PC.act.logout(); PC.go('/auth'); }}><${Icon} name="log-out" size=${16} />Cerrar sesión</button>
        </div>
      </div>`}
    <//>`;
  }

  function Header({ role, onRole, user }) {
    return html`<header class="sticky top-0 z-40 border-b border-white/10 bg-navy-900/80 backdrop-blur-xl">
      <div class="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-6">
        <button type="button" onClick=${() => PC.go(`/${role}/${ROLES.find(r => r.id === role).home}`)} class="flex shrink-0 items-center gap-2.5 rounded-xl" aria-label="PetCare Domicilio, ir al inicio">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-gold-500 text-navy-900 shadow-[0_8px_22px_-8px_rgba(53,94,75,.38)]"><${Icon} name="paw" size=${22} strokeWidth=${2.3} /></span>
          <span class="hidden text-left leading-tight sm:block"><span class="block text-[15px] font-bold text-white">PetCare <span class="gold-text">Domicilio</span></span>
          <span class="block text-[11px] text-slate-300">Bienestar en casa</span></span>
        </button>
        <div class="mx-auto w-full max-w-[460px] flex-1"><${RoleSwitcher} role=${role} onChange=${onRole} /></div>
        <div class="flex shrink-0 items-center gap-2">
          ${role === 'owner' ? html`<${Button} variant="gold" size="sm" icon="calendar-plus" className="hidden md:inline-flex" onClick=${() => PC.go('/owner/book')}>Agendar<//>` : null}
          <${Bell} role=${role} />
          <${AccountMenu} role=${role} user=${user} />
        </div>
      </div>
    </header>`;
  }

  function Sidebar({ role, page, user }) {
    const items = NAV[role];
    return html`<aside class="sticky top-[69px] hidden h-[calc(100vh-69px)] w-64 shrink-0 flex-col justify-between border-r border-white/10 px-4 py-6 lg:flex" aria-label="Navegación principal">
      <nav class="space-y-1">
        <p class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">${ROLE_LABEL[role]}</p>
        ${items.map(it => html`<button key=${it.id} type="button" onClick=${() => PC.go(`/${role}/${it.id}`)} aria-current=${page === it.id ? 'page' : undefined}
          class=${cn('group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            page === it.id ? 'bg-sage-400/30 text-gold-200 shadow-[inset_3px_0_0_0_#D9B98F]' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white')}>
          <${Icon} name=${it.icon} size=${19} className=${page === it.id ? 'text-gold-400' : 'text-slate-400 group-hover:text-gold-300'} />${it.label}
        </button>`)}
      </nav>
      <div class="glass rounded-2xl p-4">
        <p class="text-xs font-semibold text-gold-300">Sesión demo</p>
        <p class="mt-1 text-sm font-medium text-white">${user.name}</p>
        <p class="text-xs text-slate-300">Cambia de rol arriba para recorrer el flujo completo: agenda como propietario, atiende como veterinario y gestiona como administrador.</p>
      </div>
    </aside>`;
  }

  function BottomNav({ role, page }) {
    const items = NAV[role].filter(i => !i.desktopOnly);
    return html`<nav class="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-900/90 backdrop-blur-xl lg:hidden" aria-label="Navegación principal">
      <ul class="mx-auto flex max-w-xl items-end justify-around px-2 pb-1.5 pt-1.5">
        ${items.map(it => html`<li key=${it.id} class="flex-1">
          <button type="button" onClick=${() => PC.go(`/${role}/${it.id}`)} aria-current=${page === it.id ? 'page' : undefined}
            class=${cn('flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors', it.primary ? '' : page === it.id ? 'text-gold-300' : 'text-slate-300')}>
            ${it.primary
              ? html`<span class="-mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-gold-500 text-navy-900 shadow-[0_10px_24px_-8px_rgba(53,94,75,.38)]"><${Icon} name=${it.icon} size=${22} /></span>`
              : html`<${Icon} name=${it.icon} size=${21} />`}
            <span class=${it.primary ? 'text-gold-300' : ''}>${it.short || it.label}</span>
          </button>
        </li>`)}
      </ul>
    </nav>`;
  }

  function App() {
    const state = PC.useStore();
    const route = PC.useRoute();
    const mainRef = useRef(null);
    const first = useRef(true);
    const authed = state.session.authed;
    const role = ROLES.some(r => r.id === route.role) ? route.role : state.session.role;
    const pages = PAGES[role];
    const pageOk = pages && pages[route.page];

    // Normaliza rutas inválidas y sincroniza el rol de la sesión con la URL
    useEffect(() => {
      if (!authed) { if (route.role !== 'auth') PC.go('/auth'); return; }
      if (route.role === 'auth' || !ROLES.some(r => r.id === route.role) || !pageOk) {
        const r = ROLES.find(x => x.id === role) || ROLES[0];
        PC.go(`/${r.id}/${r.home}`);
        return;
      }
      if (state.session.role !== route.role) PC.act.setRole(route.role);
    }, [authed, route.role, route.page, pageOk]);

    // Accesibilidad: título + foco al cambiar de vista
    useEffect(() => {
      const nav = (NAV[role] || []).find(n => n.id === route.page);
      document.title = (authed && nav ? nav.label + ' · ' : '') + 'PetCare Domicilio';
      if (first.current) { first.current = false; return; }
      window.scrollTo({ top: 0 });
      if (mainRef.current) mainRef.current.focus({ preventScroll: true });
    }, [route.path]);

    if (!authed) return html`<${R.Fragment}><${PC.AuthScreen} /><${ToastHost} /><//>`;
    if (!pageOk) return html`<div class="app-bg min-h-screen"></div>`;

    const user = userFor(state, role);
    const Page = pages[route.page];
    const switchRole = r => {
      if (r === role) return;
      const target = ROLES.find(x => x.id === r);
      PC.go(`/${r}/${target.home}`);
      const u = userFor(PC.store.getState(), r);
      PC.toast.push({ title: `Vista de ${target.label}`, text: `Ahora ves la plataforma como ${u.name}.`, tone: 'info', icon: target.icon, duration: 3000 });
    };

    return html`<div class="app-bg min-h-screen">
      <button type="button" class="skip-link" onClick=${() => mainRef.current && mainRef.current.focus()}>Saltar al contenido</button>
      <${Header} role=${role} onRole=${switchRole} user=${user} />
      <div class="mx-auto flex max-w-[1500px]">
        <${Sidebar} role=${role} page=${route.page} user=${user} />
        <main id="main" ref=${mainRef} tabIndex="-1" class="min-w-0 flex-1 px-4 pb-32 pt-6 outline-none sm:px-6 lg:pb-12 lg:pt-8 xl:px-10">
          <div key=${route.path} class="anim-fade mx-auto max-w-6xl"><${Page} /></div>
        </main>
      </div>
      <${BottomNav} role=${role} page=${route.page} />
      <${ToastHost} />
    </div>`;
  }

  // Si hay una ruta de otro rol en la URL inicial, respétala; si no, entra al rol de la sesión
  if (!window.location.hash) {
    const s = PC.store.getState();
    const r = ROLES.find(x => x.id === s.session.role) || ROLES[0];
    window.location.hash = s.session.authed ? `#/${r.id}/${r.home}` : '#/auth';
  }

  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
})(window.PC);
