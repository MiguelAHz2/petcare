/* Primitivas de UI (estilo shadcn/ui sobre Tailwind): botones, tarjetas, campos, tabs, etc. */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon } = PC;
  const { useState, useId, useRef, useEffect } = R;

  // ——— Tonos semánticos (nunca solo color: siempre acompañados de texto/icono)
  // Paleta terrosa: gold→bosque, emerald→salvia, sky→lago, violet→ciruela, rose→arcilla, amber→arena
  const TONES = {
    gold: 'bg-forest-500/10 text-forest-600 border-forest-500/25',
    sky: 'bg-lake-400/15 text-lake-700 border-lake-400/40',
    emerald: 'bg-sage-400/30 text-forest-600 border-sage-500/50',
    violet: 'bg-plum-400/15 text-plum-700 border-plum-400/40',
    rose: 'bg-clay-400/15 text-clay-700 border-clay-400/40',
    amber: 'bg-sand-400/30 text-sand-700 border-sand-500/45',
    slate: 'bg-white/[0.05] text-slate-300 border-white/10',
  };
  const BUBBLE = {
    gold: 'bg-forest-500/10 text-forest-600', sky: 'bg-lake-400/20 text-lake-700', emerald: 'bg-sage-400/35 text-forest-600',
    violet: 'bg-plum-400/20 text-plum-700', rose: 'bg-clay-400/20 text-clay-700', amber: 'bg-sand-400/35 text-sand-700',
    slate: 'bg-white/[0.07] text-slate-300',
  };
  PC.TONES = TONES;
  PC.BUBBLE = BUBBLE;

  // ——— Botón
  const BTN = {
    gold: 'bg-gold-500 text-navy-900 font-semibold hover:bg-gold-400 active:bg-gold-600 shadow-[0_8px_24px_-10px_rgba(53,94,75,.38)]',
    soft: 'bg-cream-50 text-slate-100 border border-forest-500/20 shadow-sm hover:bg-sage-100 hover:border-forest-500/40',
    outline: 'border border-gold-500/50 text-gold-300 hover:bg-gold-500/10 hover:border-gold-400',
    ghost: 'text-slate-300 hover:bg-white/[0.07] hover:text-white',
    danger: 'bg-clay-500/10 text-clay-700 border border-clay-400/30 hover:bg-clay-500/20',
    success: 'bg-sage-400/15 text-sage-700 border border-sage-400/30 hover:bg-sage-400/25',
    violet: 'bg-plum-400/15 text-plum-700 border border-plum-400/30 hover:bg-plum-400/25',
  };
  const SIZES = {
    xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
    sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-lg',
    md: 'h-10 px-4 text-sm gap-2 rounded-xl',
    lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  };

  function Button({ variant = 'soft', size = 'md', icon, iconRight, loading, className, children, type = 'button', ...rest }) {
    const sz = size === 'lg' ? 18 : size === 'md' ? 16 : 14;
    return html`<button ...${rest} type=${type} disabled=${rest.disabled || loading}
      class=${cn('inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]', BTN[variant], SIZES[size], className)}>
      ${loading ? html`<span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"></span>` : icon ? html`<${Icon} name=${icon} size=${sz} />` : null}
      ${children}
      ${iconRight ? html`<${Icon} name=${iconRight} size=${sz} />` : null}
    </button>`;
  }

  function IconButton({ icon, label, variant = 'ghost', size = 'md', className, badge, ...rest }) {
    const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-10 w-10';
    return html`<button type="button" ...${rest} aria-label=${label} title=${label}
      class=${cn('relative inline-grid place-items-center rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed', dim, BTN[variant], className)}>
      <${Icon} name=${icon} size=${size === 'sm' ? 15 : 18} />
      ${badge ? html`<span class="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-navy-900">${badge}</span>` : null}
    </button>`;
  }

  // ——— Tarjeta
  function Card({ className, hover, strong, as = 'div', children, ...rest }) {
    return R.createElement(as, { ...rest, className: cn(strong ? 'glass-strong' : 'glass', 'rounded-2xl', hover && 'glass-hover', className) }, children);
  }

  // ——— Badge
  function Badge({ tone = 'slate', icon, className, children, dot }) {
    return html`<span class=${cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap', TONES[tone], className)}>
      ${dot ? html`<span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>` : null}
      ${icon ? html`<${Icon} name=${icon} size=${12} />` : null}${children}
    </span>`;
  }

  function StatusBadge({ status, className }) {
    const s = PC.data.STATUS[status] || PC.data.STATUS.pendiente;
    return html`<${Badge} tone=${s.tone} icon=${s.icon} className=${className}>${s.label}<//>`;
  }

  // ——— Avatares
  function Avatar({ name, color = '#355E4B', size = 40, className }) {
    return html`<span aria-hidden="true" class=${cn('inline-grid shrink-0 select-none place-items-center rounded-full font-semibold', className)}
      style=${{ width: size, height: size, fontSize: Math.round(size * 0.37), color: `color-mix(in srgb, ${color} 62%, #1B3328)`,
        background: `linear-gradient(135deg, ${color}40, ${color}18)`, border: `1px solid ${color}66` }}>
      ${PC.initials(name)}
    </span>`;
  }

  function PetAvatar({ pet, size = 48, className }) {
    return html`<span aria-hidden="true" class=${cn('inline-grid shrink-0 place-items-center rounded-2xl', className)}
      style=${{ width: size, height: size, fontSize: Math.round(size * 0.52), background: 'linear-gradient(140deg, #F4E7D0, #DDE8D9)', border: '1px solid rgba(53,94,75,.18)' }}>
      ${pet ? pet.emoji : '🐾'}
    </span>`;
  }

  // ——— Campos
  function FieldShell({ id, label, hint, error, required, className, children }) {
    return html`<div class=${className}>
      ${label ? html`<label for=${id} class="mb-1.5 block text-xs font-medium text-slate-300">${label}${required ? html`<span class="text-gold-400" aria-hidden="true"> *</span>` : null}</label>` : null}
      ${children}
      ${error
        ? html`<p id=${id + '-msg'} role="alert" class="mt-1.5 flex items-center gap-1 text-xs text-clay-700"><${Icon} name="alert" size=${13} />${error}</p>`
        : hint ? html`<p id=${id + '-msg'} class="mt-1.5 text-xs text-slate-400">${hint}</p>` : null}
    </div>`;
  }

  function Input({ label, hint, error, required, className, icon, ...rest }) {
    const id = useId();
    return html`<${FieldShell} id=${id} label=${label} hint=${hint} error=${error} required=${required} className=${className}>
      <div class="relative">
        ${icon ? html`<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><${Icon} name=${icon} size=${16} /></span>` : null}
        <input ...${rest} id=${id} aria-required=${required || undefined} aria-invalid=${error ? true : undefined}
          aria-describedby=${error || hint ? id + '-msg' : undefined} class=${cn('pc-input', icon && 'pl-10', error && '!border-clay-400/70')} />
      </div>
    <//>`;
  }

  function Textarea({ label, hint, error, required, className, ...rest }) {
    const id = useId();
    return html`<${FieldShell} id=${id} label=${label} hint=${hint} error=${error} required=${required} className=${className}>
      <textarea ...${rest} id=${id} aria-required=${required || undefined} aria-invalid=${error ? true : undefined}
        aria-describedby=${error || hint ? id + '-msg' : undefined} class=${cn('pc-input', error && '!border-clay-400/70')}></textarea>
    <//>`;
  }

  function Select({ label, hint, error, required, className, options, placeholder, children, ...rest }) {
    const id = useId();
    return html`<${FieldShell} id=${id} label=${label} hint=${hint} error=${error} required=${required} className=${className}>
      <select ...${rest} id=${id} aria-required=${required || undefined} aria-invalid=${error ? true : undefined}
        aria-describedby=${error || hint ? id + '-msg' : undefined} class=${cn('pc-input', error && '!border-clay-400/70')}>
        ${placeholder ? html`<option value="">${placeholder}</option>` : null}
        ${options ? options.map(o => html`<option key=${o.value} value=${o.value}>${o.label}</option>`) : children}
      </select>
    <//>`;
  }

  function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '', hint, className }) {
    const id = useId();
    const pct = ((value - min) / (max - min)) * 100;
    return html`<div class=${className}>
      <div class="mb-2 flex items-center justify-between">
        <label for=${id} class="text-xs font-medium text-slate-300">${label}</label>
        <output for=${id} class="rounded-lg bg-gold-500/15 px-2 py-0.5 text-sm font-semibold text-gold-300 tabular">${value} ${unit}</output>
      </div>
      <input id=${id} type="range" class="pc-range" min=${min} max=${max} step=${step} value=${value}
        style=${{ '--p': pct + '%' }} onInput=${e => onChange(Number(e.target.value))} onChange=${e => onChange(Number(e.target.value))} />
      ${hint ? html`<p class="mt-1.5 text-xs text-slate-400">${hint}</p>` : null}
    </div>`;
  }

  function Toggle({ checked, onChange, label, description, className, disabled }) {
    const id = useId();
    return html`<div class=${cn('flex items-center justify-between gap-4', className)}>
      <div class="min-w-0">
        <p id=${id} class="text-sm font-medium text-slate-100">${label}</p>
        ${description ? html`<p class="text-xs text-slate-400">${description}</p>` : null}
      </div>
      <button type="button" role="switch" aria-checked=${!!checked} aria-labelledby=${id} disabled=${disabled} onClick=${() => onChange(!checked)}
        class=${cn('relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-50', checked ? 'border-gold-400 bg-gold-500' : 'border-white/20 bg-white/10')}>
        <span class=${cn('absolute top-0.5 h-5 w-5 rounded-full shadow transition-all duration-200', checked ? 'left-[22px] bg-navy-900' : 'left-0.5 bg-slate-300')}></span>
      </button>
    </div>`;
  }

  function Chip({ active, onClick, icon, children, tone = 'gold', className, disabled, title }) {
    return html`<button type="button" onClick=${onClick} aria-pressed=${!!active} disabled=${disabled} title=${title}
      class=${cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
        active ? TONES[tone] + ' shadow-sm' : 'border-forest-500/20 bg-cream-50 text-slate-300 hover:border-forest-500/40 hover:text-white', className)}>
      ${icon ? html`<${Icon} name=${icon} size=${13} />` : null}${active && !icon ? html`<${Icon} name="check" size=${12} />` : null}${children}
    </button>`;
  }

  // ——— Control segmentado (filtros / modos)
  function Segmented({ value, onChange, options, label, size = 'md', className, full }) {
    return html`<div role="group" aria-label=${label} class=${cn('inline-flex rounded-xl border border-forest-500/15 bg-cream-50/80 p-1', full && 'flex w-full', className)}>
      ${options.map(o => html`<button key=${o.value} type="button" aria-pressed=${value === o.value} onClick=${() => onChange(o.value)}
        class=${cn('flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 font-medium transition-all duration-200', size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm',
          value === o.value ? 'bg-gold-500 text-navy-900 shadow-[0_4px_14px_-6px_rgba(53,94,75,.38)]' : 'text-slate-300 hover:bg-white/[0.07] hover:text-white')}>
        ${o.icon ? html`<${Icon} name=${o.icon} size=${15} />` : null}${o.label}
        ${o.count != null ? html`<span class=${cn('rounded-full px-1.5 text-[10px] font-bold', value === o.value ? 'bg-navy-900/20' : 'bg-white/10')}>${o.count}</span>` : null}
      </button>`)}
    </div>`;
  }

  // ——— Tabs con semántica ARIA y navegación con flechas
  function Tabs({ value, onChange, tabs, label, className }) {
    const uid = useId();
    const onKey = (e, i) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      let n = i;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      onChange(tabs[n].value);
      const el = document.getElementById(uid + '-' + tabs[n].value);
      if (el) el.focus();
    };
    return html`<div role="tablist" aria-label=${label} class=${cn('flex gap-1 overflow-x-auto border-b border-white/10 no-scrollbar', className)}>
      ${tabs.map((t, i) => html`<button key=${t.value} id=${uid + '-' + t.value} role="tab" type="button" aria-selected=${value === t.value}
        tabIndex=${value === t.value ? 0 : -1} onKeyDown=${e => onKey(e, i)} onClick=${() => onChange(t.value)}
        class=${cn('relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
          value === t.value ? 'text-gold-300' : 'text-slate-400 hover:text-white')}>
        ${t.icon ? html`<${Icon} name=${t.icon} size=${16} />` : null}${t.label}
        ${t.count != null ? html`<span class="rounded-full bg-white/10 px-1.5 text-[10px] font-bold text-slate-200">${t.count}</span>` : null}
        ${value === t.value ? html`<span class="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold-500"></span>` : null}
      </button>`)}
    </div>`;
  }

  // ——— Acordeón / divulgación
  function Disclosure({ title, icon, children, defaultOpen = false, className, right }) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();
    return html`<div class=${cn('border-t border-white/10 first:border-t-0', className)}>
      <button type="button" aria-expanded=${open} aria-controls=${id} onClick=${() => setOpen(o => !o)}
        class="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium text-slate-100 transition-colors hover:text-gold-300">
        <span class="flex items-center gap-2">${icon ? html`<${Icon} name=${icon} size=${16} className="text-gold-400" />` : null}${title}</span>
        <span class="flex items-center gap-2">${right}<${Icon} name="chevron-down" size=${16} className=${cn('transition-transform duration-200', open && 'rotate-180')} /></span>
      </button>
      <div id=${id} hidden=${!open} class="anim-fade pb-3 text-sm text-slate-300">${children}</div>
    </div>`;
  }

  // ——— Métricas
  function Stat({ label, value, icon, tone = 'gold', hint, delta, className, children }) {
    return html`<div class=${cn('glass rounded-2xl p-4 sm:p-5', className)}>
      <div class="flex items-start justify-between gap-3">
        <p class="text-[13px] font-medium text-slate-300">${label}</p>
        ${icon ? html`<span class=${cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', BUBBLE[tone])}><${Icon} name=${icon} size=${18} /></span>` : null}
      </div>
      <p class="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-white sm:text-3xl">${value}</p>
      ${delta ? html`<p class=${cn('mt-1 flex items-center gap-1 text-xs font-medium', delta.up === false ? 'text-clay-700' : 'text-sage-700')}>
        <${Icon} name=${delta.up === false ? 'arrow-down' : 'arrow-up'} size=${12} />${delta.text}</p>` : null}
      ${hint ? html`<p class="mt-1 text-xs text-slate-400">${hint}</p>` : null}
      ${children}
    </div>`;
  }

  function Meter({ value, max = 100, tone = 'gold', className, label }) {
    const pct = PC.clamp((value / (max || 1)) * 100, 0, 100);
    const FILL = { gold: 'bg-gold-500', emerald: 'bg-sage-500', sky: 'bg-lake-500', rose: 'bg-clay-500', amber: 'bg-sand-500', violet: 'bg-plum-500' };
    return html`<div class=${cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)} role="meter" aria-label=${label} aria-valuenow=${Math.round(pct)} aria-valuemin="0" aria-valuemax="100">
      <div class=${cn('h-full rounded-full transition-all duration-700', FILL[tone])} style=${{ width: pct + '%' }}></div>
    </div>`;
  }

  function Stars({ value = 0, onChange, size = 16, label }) {
    const items = [1, 2, 3, 4, 5];
    if (!onChange) {
      return html`<span class="inline-flex items-center gap-0.5 text-sand-600" role="img" aria-label=${(label || 'Calificación') + ': ' + value + ' de 5'}>
        ${items.map(i => html`<${Icon} key=${i} name="star" size=${size} className=${i <= Math.round(value) ? 'fill-current' : 'text-forest-500/25'} />`)}
      </span>`;
    }
    return html`<div class="inline-flex items-center gap-1" role="radiogroup" aria-label=${label || 'Calificar atención'}>
      ${items.map(i => html`<button key=${i} type="button" role="radio" aria-checked=${value === i} aria-label=${i + (i === 1 ? ' estrella' : ' estrellas')}
        onClick=${() => onChange(i)} class="rounded p-0.5 text-sand-600 transition-transform hover:scale-125">
        <${Icon} name="star" size=${size} className=${i <= value ? 'fill-current' : 'text-forest-500/30'} />
      </button>`)}
    </div>`;
  }

  // ——— Estructura de página
  function PageHeader({ eyebrow, title, subtitle, actions, className }) {
    return html`<header class=${cn('mb-6 flex flex-wrap items-end justify-between gap-4 anim-up', className)}>
      <div class="min-w-0">
        ${eyebrow ? html`<p class="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-sand-700">${eyebrow}</p>` : null}
        <h1 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl text-balance">${title}</h1>
        ${subtitle ? html`<p class="mt-1.5 max-w-2xl text-sm text-slate-300">${subtitle}</p>` : null}
      </div>
      ${actions ? html`<div class="flex flex-wrap items-center gap-2">${actions}</div>` : null}
    </header>`;
  }

  function SectionTitle({ title, icon, right, className }) {
    return html`<div class=${cn('mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2', className)}>
      <h2 class="flex items-center gap-2 text-base font-semibold text-white">${icon ? html`<${Icon} name=${icon} size=${18} className="text-gold-400" />` : null}${title}</h2>
      ${right}
    </div>`;
  }

  function Empty({ icon = 'paw', title, text, action, className }) {
    return html`<div class=${cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center', className)}>
      <span class="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold-500/10 text-gold-300"><${Icon} name=${icon} size=${26} /></span>
      <h3 class="text-base font-semibold text-white">${title}</h3>
      ${text ? html`<p class="mt-1.5 max-w-sm text-sm text-slate-300">${text}</p>` : null}
      ${action ? html`<div class="mt-5">${action}</div>` : null}
    </div>`;
  }

  // Dato etiquetado (par clave/valor compacto)
  function Fact({ icon, label, children, className }) {
    return html`<div class=${cn('flex items-start gap-2.5', className)}>
      ${icon ? html`<span class="mt-0.5 text-gold-400"><${Icon} name=${icon} size=${16} /></span>` : null}
      <div class="min-w-0"><p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">${label}</p><div class="text-sm text-slate-100">${children}</div></div>
    </div>`;
  }

  PC.ui = { Button, IconButton, Card, Badge, StatusBadge, Avatar, PetAvatar, Input, Textarea, Select, Slider, Toggle, Chip, Segmented, Tabs, Disclosure, Stat, Meter, Stars, PageHeader, SectionTitle, Empty, Fact, FieldShell };
})(window.PC);
