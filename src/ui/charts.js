/* Gráficos ligeros (HTML/SVG) siguiendo marcas finas, rejilla recesiva y vista de tabla equivalente */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon } = PC;
  const { useState } = R;

  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * p;
  }

  // Columnas con tooltip por barra (hover + foco de teclado) y alternativa en tabla
  function BarChart({ data, height = 200, format = n => String(n), axisFormat, ariaLabel, valueLabel = 'Valor', labelEvery = 1 }) {
    const [hover, setHover] = useState(null);
    const [asTable, setAsTable] = useState(false);
    const max = niceMax(Math.max(...data.map(d => d.value), 1));
    const ticks = [1, 0.75, 0.5, 0.25, 0].map(f => max * f);
    const fmtAxis = axisFormat || format;
    const n = data.length;

    const total = data.reduce((s, d) => s + d.value, 0);

    if (asTable) {
      return html`<div>
        <div class="mb-2 flex justify-end">
          <button type="button" onClick=${() => setAsTable(false)} class="text-xs font-medium text-gold-300 hover:text-gold-200">Ver gráfico</button>
        </div>
        <div class="overflow-auto rounded-xl border border-white/10" style=${{ maxHeight: height + 40 }}>
          <table class="w-full text-left text-sm">
            <caption class="sr-only">${ariaLabel}</caption>
            <thead class="bg-white/[0.04] text-xs text-slate-300"><tr><th scope="col" class="px-3 py-2 font-medium">Periodo</th><th scope="col" class="px-3 py-2 text-right font-medium">${valueLabel}</th></tr></thead>
            <tbody class="divide-y divide-white/5">
              ${data.map(d => html`<tr key=${d.label + (d.title || '')}><th scope="row" class="px-3 py-1.5 font-normal text-slate-200">${d.title || d.label}</th><td class="px-3 py-1.5 text-right tabular text-slate-100">${format(d.value)}</td></tr>`)}
              <tr class="bg-white/[0.04] font-medium"><th scope="row" class="px-3 py-2 text-slate-100">Total</th><td class="px-3 py-2 text-right tabular text-white">${format(total)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    }

    return html`<div>
      <div class="mb-1 flex justify-end">
        <button type="button" onClick=${() => setAsTable(true)} class="text-xs font-medium text-slate-300 hover:text-gold-300">Ver como tabla</button>
      </div>
      <div class="flex gap-2" role="group" aria-label=${ariaLabel}>
        <div class="flex shrink-0 flex-col justify-between pb-6 text-right text-[11px] leading-none text-slate-400 tabular" style=${{ height: height + 24 + 'px' }} aria-hidden="true">
          ${ticks.map((t, i) => html`<span key=${i}>${fmtAxis(t)}</span>`)}
        </div>
        <div class="relative min-w-0 flex-1">
          <div class="relative" style=${{ height: height + 'px' }}>
            ${[0, 0.25, 0.5, 0.75, 1].map(f => html`<div key=${f} class="absolute inset-x-0 border-t border-white/[0.07]" style=${{ bottom: f * 100 + '%' }}></div>`)}
            <div class="absolute inset-0 flex items-end gap-[3px]">
              ${data.map((d, i) => {
                const pct = (d.value / max) * 100;
                const dim = hover !== null && hover !== i;
                return html`<button key=${i} type="button" class="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-md focus-visible:bg-white/[0.06]"
                  aria-label=${(d.title || d.label) + ': ' + format(d.value) + (d.sub ? ', ' + d.sub : '')}
                  onMouseEnter=${() => setHover(i)} onMouseLeave=${() => setHover(null)} onFocus=${() => setHover(i)} onBlur=${() => setHover(null)}>
                  <span class=${cn('bar-grow block w-full max-w-[24px] rounded-t-[4px] transition-all duration-150', hover === i ? 'bg-gold-300' : 'bg-gold-500', dim && 'opacity-50')}
                    style=${{ height: Math.max(pct, d.value > 0 ? 1.5 : 0) + '%', '--i': i }}></span>
                </button>`;
              })}
            </div>
            ${hover !== null ? html`<div class="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/15 bg-navy-950/95 px-3 py-2 text-xs shadow-xl anim-fade"
              style=${{ left: ((hover + 0.5) / n) * 100 + '%', bottom: `calc(${(data[hover].value / max) * 100}% + 10px)` }}>
              <p class="font-semibold text-white">${data[hover].title || data[hover].label}</p>
              <p class="tabular text-gold-300">${format(data[hover].value)}</p>
              ${data[hover].sub ? html`<p class="text-slate-300">${data[hover].sub}</p>` : null}
            </div>` : null}
          </div>
          <div class="mt-2 flex gap-[3px]" aria-hidden="true">
            ${data.map((d, i) => html`<span key=${i} class=${cn('min-w-0 flex-1 truncate text-center text-[10px] text-slate-400', i % labelEvery !== 0 && 'invisible', i === n - 1 && 'font-semibold text-slate-200')}>${d.label}</span>`)}
          </div>
        </div>
      </div>
    </div>`;
  }

  // Barras horizontales ordenadas (una sola serie → un solo color, valor en la punta)
  function HBars({ data, format = n => String(n), max, className }) {
    const m = max || Math.max(...data.map(d => d.value), 1);
    return html`<ul class=${cn('space-y-3', className)}>
      ${data.map((d, i) => html`<li key=${d.label}>
        <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
          <span class="flex min-w-0 items-center gap-2 text-slate-100">
            ${d.icon ? html`<${Icon} name=${d.icon} size=${15} className="shrink-0 text-gold-400" />` : null}
            <span class="truncate">${d.label}</span>
          </span>
          <span class="shrink-0 tabular font-medium text-white">${format(d.value)}${d.sub ? html`<span class="ml-2 text-xs font-normal text-slate-400">${d.sub}</span>` : null}</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-white/[0.07]">
          <div class="hbar-grow h-full rounded-r-[4px] rounded-l-full bg-gold-500" style=${{ width: (d.value / m) * 100 + '%', '--i': i }}></div>
        </div>
      </li>`)}
    </ul>`;
  }

  function Sparkline({ values, width = 96, height = 28, className }) {
    if (!values.length) return null;
    const max = Math.max(...values), min = Math.min(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1 || 1)) * (width - 8) + 4, height - 4 - ((v - min) / span) * (height - 8)]);
    const last = pts[pts.length - 1];
    return html`<svg width=${width} height=${height} viewBox=${`0 0 ${width} ${height}`} class=${className} role="img" aria-label="Tendencia">
      <polyline points=${pts.map(p => p.join(',')).join(' ')} fill="none" stroke="rgba(212,176,106,.55)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx=${last[0]} cy=${last[1]} r="4" fill="#D4B06A" stroke="#0D223F" stroke-width="2" />
    </svg>`;
  }

  PC.charts = { BarChart, HBars, Sparkline };
})(window.PC);
