/* Superposiciones: modal, drawer, diálogo de confirmación, toasts y menú desplegable */
(function (PC) {
  'use strict';
  const R = window.React;
  const { html, cn, Icon } = PC;
  const { useState, useEffect, useRef, useId } = R;
  const { Button } = PC.ui;

  // ——— Pila de overlays: solo el superior responde a Escape y atrapa el foco
  const stack = [];
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function useOverlay(open, onClose, ref) {
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => {
      if (!open) return undefined;
      const token = {};
      stack.push(token);
      const prev = document.activeElement;
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => {
        const root = ref.current;
        if (!root) return;
        const target = root.querySelector('[data-autofocus]') || root.querySelector('input:not([type=hidden]),select,textarea') || root.querySelector('button:not([data-close])') || root;
        target.focus({ preventScroll: true });
      }, 40);
      const onKey = e => {
        if (stack[stack.length - 1] !== token) return;
        if (e.key === 'Escape') { e.preventDefault(); if (closeRef.current) closeRef.current(); return; }
        if (e.key === 'Tab' && ref.current) {
          const f = Array.from(ref.current.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
          if (!f.length) { e.preventDefault(); return; }
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener('keydown', onKey);
      return () => {
        clearTimeout(t);
        document.removeEventListener('keydown', onKey);
        stack.splice(stack.indexOf(token), 1);
        if (!stack.length) document.body.style.overflow = '';
        if (prev && prev.focus) prev.focus({ preventScroll: true });
      };
    }, [open]);
  }

  const WIDTH = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

  function Modal({ open, onClose, title, subtitle, icon, size = 'md', children, footer, className }) {
    const ref = useRef(null);
    const tid = useId();
    useOverlay(open, onClose, ref);
    if (!open) return null;
    return ReactDOM.createPortal(html`
      <div class="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div class="absolute inset-0 bg-navy-950/75 backdrop-blur-sm anim-fade" onClick=${onClose} aria-hidden="true"></div>
        <div ref=${ref} role="dialog" aria-modal="true" aria-labelledby=${tid} tabIndex="-1"
          class=${cn('glass-strong anim-pop relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl', WIDTH[size], className)}>
          <header class="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <div class="flex min-w-0 items-start gap-3">
              ${icon ? html`<span class="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300"><${Icon} name=${icon} size=${20} /></span>` : null}
              <div class="min-w-0">
                <h2 id=${tid} class="text-lg font-semibold leading-tight text-white">${title}</h2>
                ${subtitle ? html`<p class="mt-0.5 text-sm text-slate-300">${subtitle}</p>` : null}
              </div>
            </div>
            <button type="button" data-close aria-label="Cerrar" onClick=${onClose} class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
              <${Icon} name="x" size=${18} />
            </button>
          </header>
          <div class="flex-1 overflow-y-auto px-5 py-5 sm:px-6">${children}</div>
          ${footer ? html`<footer class="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-navy-950/40 px-5 py-4 sm:px-6">${footer}</footer>` : null}
        </div>
      </div>`, document.body);
  }

  function Drawer({ open, onClose, title, subtitle, icon, children, footer, width = 'max-w-xl' }) {
    const ref = useRef(null);
    const tid = useId();
    useOverlay(open, onClose, ref);
    if (!open) return null;
    return ReactDOM.createPortal(html`
      <div class="fixed inset-0 z-[100] flex justify-end">
        <div class="absolute inset-0 bg-navy-950/70 backdrop-blur-sm anim-fade" onClick=${onClose} aria-hidden="true"></div>
        <aside ref=${ref} role="dialog" aria-modal="true" aria-labelledby=${tid} tabIndex="-1"
          class=${cn('glass-strong anim-drawer relative flex h-full w-full flex-col border-l border-white/10', width)}>
          <header class="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
            <div class="flex min-w-0 items-start gap-3">
              ${icon ? html`<span class="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-300"><${Icon} name=${icon} size=${20} /></span>` : null}
              <div class="min-w-0">
                <h2 id=${tid} class="truncate text-lg font-semibold leading-tight text-white">${title}</h2>
                ${subtitle ? html`<p class="mt-0.5 text-sm text-slate-300">${subtitle}</p>` : null}
              </div>
            </div>
            <button type="button" data-close aria-label="Cerrar panel" onClick=${onClose} class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
              <${Icon} name="x" size=${18} />
            </button>
          </header>
          <div class="flex-1 overflow-y-auto px-5 py-5 sm:px-6">${children}</div>
          ${footer ? html`<footer class="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-navy-950/40 px-5 py-4 sm:px-6">${footer}</footer>` : null}
        </aside>
      </div>`, document.body);
  }

  function Confirm({ open, title, text, confirmLabel = 'Confirmar', cancelLabel = 'Volver', tone = 'danger', icon = 'alert', onConfirm, onCancel }) {
    return html`<${Modal} open=${open} onClose=${onCancel} title=${title} icon=${icon} size="sm"
      footer=${html`<${Button} variant="ghost" onClick=${onCancel}>${cancelLabel}<//><${Button} variant=${tone === 'danger' ? 'danger' : 'gold'} onClick=${onConfirm} data-autofocus="true">${confirmLabel}<//>`}>
      <p class="text-sm leading-relaxed text-slate-200">${text}</p>
    <//>`;
  }

  // ——— Toasts (notificaciones efímeras)
  const toastState = { list: [], subs: new Set() };
  const emitToasts = () => toastState.subs.forEach(f => f(toastState.list.slice()));
  PC.toast = {
    push({ title, text, tone = 'success', icon, duration = 4200 }) {
      const id = PC.uid('t');
      toastState.list = [...toastState.list, { id, title, text, tone, icon, duration }].slice(-4);
      emitToasts();
      setTimeout(() => PC.toast.dismiss(id), duration);
      return id;
    },
    dismiss(id) { toastState.list = toastState.list.filter(t => t.id !== id); emitToasts(); },
    success(title, text) { return PC.toast.push({ title, text, tone: 'success' }); },
    info(title, text) { return PC.toast.push({ title, text, tone: 'info' }); },
    error(title, text) { return PC.toast.push({ title, text, tone: 'error', duration: 5600 }); },
  };

  function ToastHost() {
    const [list, setList] = useState([]);
    useEffect(() => {
      toastState.subs.add(setList);
      return () => toastState.subs.delete(setList);
    }, []);
    const TONE = {
      success: { icon: 'check-circle', cls: 'bg-emerald-400/15 text-emerald-300' },
      info: { icon: 'info', cls: 'bg-sky-400/15 text-sky-300' },
      error: { icon: 'alert', cls: 'bg-rose-400/15 text-rose-300' },
      gold: { icon: 'sparkles', cls: 'bg-gold-500/15 text-gold-300' },
    };
    return html`<div aria-live="polite" aria-atomic="false" class="pointer-events-none fixed inset-x-0 bottom-20 z-[150] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6">
      ${list.map(t => {
        const T = TONE[t.tone] || TONE.success;
        return html`<div key=${t.id} role="status" class="glass-strong pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl p-3.5 pr-10" style=${{ animation: 'toastIn .35s cubic-bezier(.2,.8,.2,1) both' }}>
          <div class="flex items-start gap-3">
            <span class=${cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', T.cls)}><${Icon} name=${t.icon || T.icon} size=${18} /></span>
            <div class="min-w-0 pt-0.5">
              <p class="text-sm font-semibold text-white">${t.title}</p>
              ${t.text ? html`<p class="mt-0.5 text-[13px] leading-snug text-slate-300">${t.text}</p>` : null}
            </div>
          </div>
          <button type="button" aria-label="Cerrar notificación" onClick=${() => PC.toast.dismiss(t.id)} class="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">
            <${Icon} name="x" size=${14} />
          </button>
          <span class="absolute bottom-0 left-0 h-0.5 bg-gold-500/70" style=${{ width: '100%', transformOrigin: 'left', animation: `growX ${t.duration}ms linear reverse both` }}></span>
        </div>`;
      })}
    </div>`;
  }

  // ——— Menú desplegable (clic fuera + Escape)
  function Dropdown({ renderButton, children, align = 'right', width = 'w-72', className }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      if (!open) return undefined;
      const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      const onKey = e => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
      return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);
    const close = () => setOpen(false);
    return html`<div class="relative" ref=${ref}>
      ${renderButton({ open, toggle: () => setOpen(o => !o), close })}
      ${open ? html`<div class=${cn('glass-strong anim-pop absolute z-50 mt-2 max-w-[calc(100vw-2rem)] rounded-2xl p-2', align === 'right' ? 'right-0' : 'left-0', width, className)}>
        ${typeof children === 'function' ? children({ close }) : children}
      </div>` : null}
    </div>`;
  }

  // Lleva el foco al primer campo con error (formularios en modal o en página)
  PC.focusError = () => setTimeout(() => {
    const root = document.querySelector('[role=dialog]') || document;
    const el = root.querySelector('[aria-invalid="true"]') || root.querySelector('[role=alert]');
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (el.focus) el.focus({ preventScroll: true });
  }, 40);

  PC.ui.Modal = Modal;
  PC.ui.Drawer = Drawer;
  PC.ui.Confirm = Confirm;
  PC.ui.ToastHost = ToastHost;
  PC.ui.Dropdown = Dropdown;
})(window.PC);
