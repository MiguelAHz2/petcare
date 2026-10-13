/* Propietario · Catálogo de planes y servicios (RF-03) */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon } = PC;
  const { useState, useMemo } = R;
  const { Button, Card, Badge, PageHeader, Chip, Segmented, Input, Disclosure, Empty } = PC.ui;
  const D = PC.data;
  PC.owner = PC.owner || {};

  function ServiceCard({ s, i }) {
    const c = PC.logic.category(s.cat);
    return html`<${Card} hover className="anim-up flex flex-col p-5" style=${{ '--i': i % 9 }}>
      <div class="flex items-start justify-between gap-3">
        <span class=${cn('grid h-12 w-12 place-items-center rounded-2xl', PC.BUBBLE[c.tone])}><${Icon} name=${c.icon} size=${22} /></span>
        <div class="flex flex-wrap justify-end gap-1.5">
          ${s.kind === 'plan' ? html`<${Badge} tone="gold" icon="layers">Plan<//>` : null}
          ${s.popular ? html`<${Badge} tone="violet" icon="star">Popular<//>` : null}
        </div>
      </div>
      <p class="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">${c.name}</p>
      <h3 class="mt-1 text-lg font-semibold leading-snug text-white">${s.name}</h3>
      <p class="mt-1.5 text-sm text-slate-300">${s.summary}</p>

      <div class="mt-4 flex items-end justify-between gap-3">
        <p class="text-2xl font-semibold tracking-tight text-gold-300">${PC.money(s.price)}</p>
        <p class="flex items-center gap-1.5 text-xs text-slate-300"><${Icon} name="clock" size=${14} />${s.duration} min${s.kind === 'plan' ? ' / visita' : ''}</p>
      </div>
      <div class="mt-3 flex flex-wrap gap-1.5">
        ${s.species.map(sp => html`<${Badge} key=${sp} tone="slate">${sp === 'Canino' ? '🐶 Caninos' : '🐱 Felinos'}<//>`)}
      </div>

      <ul class="mt-4 space-y-1.5">
        ${s.includes.slice(0, 3).map(x => html`<li key=${x} class="flex items-start gap-2 text-[13px] text-slate-200">
          <${Icon} name="check" size=${15} className="mt-0.5 text-sage-700" strokeWidth=${2.4} />${x}</li>`)}
      </ul>

      <div class="mt-3">
        <${Disclosure} title="Qué incluye y condiciones" icon="info" className="!border-t !border-white/10">
          <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Incluye</p>
          <ul class="mb-3 list-disc space-y-1 pl-5">${s.includes.map(x => html`<li key=${x}>${x}</li>`)}</ul>
          <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Condiciones</p>
          <ul class="list-disc space-y-1 pl-5">${s.conditions.map(x => html`<li key=${x}>${x}</li>`)}</ul>
        <//>
      </div>

      <div class="mt-auto pt-3">
        <${Button} variant="gold" className="w-full" icon="calendar-plus" onClick=${() => PC.go('/owner/book?service=' + s.id)}>Agendar este servicio<//>
      </div>
    <//>`;
  }

  function Catalog() {
    const [cat, setCat] = useState('all');
    const [kind, setKind] = useState('all');
    const [q, setQ] = useState('');

    const list = useMemo(() => D.SERVICES.filter(s =>
      (cat === 'all' || s.cat === cat) &&
      (kind === 'all' || s.kind === kind) &&
      (!q.trim() || (s.name + ' ' + s.summary).toLowerCase().includes(q.trim().toLowerCase()))
    ), [cat, kind, q]);

    const featured = D.SERVICES.find(s => s.id === 'plan-salud-anual');

    return html`<div>
      <${PageHeader} eyebrow="Catálogo" title="Planes y servicios a domicilio"
        subtitle="Tarifas claras, sin sorpresas. El profesional llega con todo lo necesario a tu hogar." />

      <section class="anim-up relative mb-8 overflow-hidden rounded-3xl border border-sage-500/45 p-6 sm:p-8"
        style=${{ background: 'linear-gradient(120deg, rgba(168,191,163,.55), rgba(246,241,231,.9) 55%, rgba(217,185,143,.38))' }}>
        <div class="max-w-xl">
          <${Badge} tone="gold" icon="star">Plan recomendado<//>
          <h2 class="mt-3 text-2xl font-semibold text-white">${featured.name}</h2>
          <p class="mt-1.5 text-sm text-slate-200">${featured.summary}</p>
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <span class="text-3xl font-semibold text-gold-300">${PC.money(featured.price)}</span>
            <${Button} variant="gold" iconRight="arrow-right" onClick=${() => PC.go('/owner/book?service=' + featured.id)}>Contratar plan<//>
          </div>
        </div>
        <${Icon} name="heart-pulse" size=${190} strokeWidth=${1} className="pointer-events-none absolute -right-6 -top-6 hidden text-gold-400/15 sm:block" />
      </section>

      <div class="mb-6 flex flex-wrap items-center gap-3">
        <${Input} icon="search" aria-label="Buscar servicio" placeholder="Buscar servicio…" value=${q} onChange=${e => setQ(e.target.value)} className="w-full sm:w-72" />
        <${Segmented} size="sm" label="Tipo" value=${kind} onChange=${setKind}
          options=${[{ value: 'all', label: 'Todos' }, { value: 'servicio', label: 'Servicios' }, { value: 'plan', label: 'Planes' }]} />
      </div>
      <div class="mb-6 flex flex-wrap gap-2" role="group" aria-label="Categorías">
        <${Chip} active=${cat === 'all'} onClick=${() => setCat('all')}>Todas<//>
        ${D.CATEGORIES.map(c => html`<${Chip} key=${c.id} icon=${c.icon} tone=${c.tone} active=${cat === c.id} onClick=${() => setCat(c.id)}>${c.name}<//>`)}
      </div>

      ${cat !== 'all' ? html`<p class="mb-5 text-sm text-slate-300">${PC.logic.category(cat).tagline}</p>` : null}

      ${list.length ? html`<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">${list.map((s, i) => html`<${ServiceCard} key=${s.id} s=${s} i=${i} />`)}</div>`
        : html`<${Empty} icon="search" title="Sin resultados" text="Prueba con otra categoría o palabra clave." />`}
    </div>`;
  }

  PC.owner.Catalog = Catalog;
})(window.PC);
