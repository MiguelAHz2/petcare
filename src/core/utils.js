/* Utilidades base: plantillas html (htm sobre React), fechas, formato y PRNG */
window.PC = window.PC || {};
(function (PC) {
  'use strict';
  const R = window.React;

  // htm → React. Acepta `class` y `for` además de className / htmlFor.
  function h(type, props, ...children) {
    if (props) {
      if (props.class !== undefined) { props.className = props.class; delete props.class; }
      if (props.for !== undefined) { props.htmlFor = props.for; delete props.for; }
    }
    return R.createElement(type, props, ...children);
  }
  PC.html = window.htm.bind(h);

  PC.cn = (...a) => a.flat(Infinity).filter(Boolean).join(' ');
  PC.uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  PC.clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  PC.cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  PC.initials = name => (name || '?').replace(/^(Dr\.|Dra\.)\s*/i, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  PC.plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  // Moneda COP
  const MONEY = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  PC.money = n => MONEY.format(Math.round(n || 0));
  PC.moneyShort = n => {
    n = n || 0;
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1).replace('.', ',').replace(/,0$/, '') + ' M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + ' mil';
    return '$' + n;
  };

  // Fechas (cadenas ISO 'YYYY-MM-DD' en hora local)
  const pad = n => String(n).padStart(2, '0');
  const dt = {
    pad,
    iso: d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()),
    parse: s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
    today: () => dt.iso(new Date()),
    add: (s, n) => { const d = dt.parse(s); d.setDate(d.getDate() + n); return dt.iso(d); },
    diff: (a, b) => Math.round((dt.parse(a) - dt.parse(b)) / 864e5),
    dow: s => dt.parse(s).getDay(),
    fmt: (s, o) => dt.parse(s).toLocaleDateString('es-CO', o || { weekday: 'short', day: 'numeric', month: 'short' }),
    long: s => dt.parse(s).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }),
    short: s => dt.parse(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
    rel: s => {
      const d = dt.diff(s, dt.today());
      if (d === 0) return 'Hoy';
      if (d === 1) return 'Mañana';
      if (d === -1) return 'Ayer';
      return PC.cap(dt.fmt(s));
    },
    time: ts => new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
    stamp: ts => {
      const d = new Date(ts);
      return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) + ' · ' + dt.time(ts);
    },
    mins: m => pad(Math.floor(m / 60) % 24) + ':' + pad(Math.round(m) % 60),
    at: (iso, minutes) => { const d = dt.parse(iso); d.setMinutes(minutes); return d.toISOString(); },
  };
  PC.dt = dt;

  PC.formatAge = months => {
    months = Math.max(0, Math.round(months || 0));
    if (months < 1) return 'Recién nacido';
    if (months < 12) return months + (months === 1 ? ' mes' : ' meses');
    const y = Math.floor(months / 12), m = months % 12;
    return y + (y === 1 ? ' año' : ' años') + (m ? ' y ' + m + (m === 1 ? ' mes' : ' m') : '');
  };

  PC.greeting = () => {
    const h24 = new Date().getHours();
    return h24 < 12 ? 'Buenos días' : h24 < 19 ? 'Buenas tardes' : 'Buenas noches';
  };

  // PRNG determinista (mulberry32) para datos de demostración
  PC.rng = seed => {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Hook: reloj que se refresca cada `ms`
  PC.useNow = (ms = 30000) => {
    const [now, setNow] = R.useState(Date.now());
    R.useEffect(() => {
      const t = setInterval(() => setNow(Date.now()), ms);
      return () => clearInterval(t);
    }, [ms]);
    return now;
  };
})(window.PC);
