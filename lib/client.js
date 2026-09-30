/**
 * Browser half of dsh-tab-plan-toggle.
 *
 * Durability note: this plugin reaches DeepSeek Harness only through public,
 * versioned surfaces — the `slots` registration API, the typed `remote` client
 * API, and the `plan` session projection. It opens no host RPC channel and
 * reads no host internals, so a harness refactor cannot silently kill it. This
 * is the same shape the harness's own plan control uses.
 */
window.__ModuleLoader__.load({
  id: 'dsh-tab-plan-toggle',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;

    // `remote.commands` is the public command channel the harness's own plan
    // control uses. Declaring it parks this plugin until that namespace mounts.
    const inject = ['slots', 'remote', 'remote.commands'];

    const PLAN_ON = '/plan';
    const PLAN_OFF = '/plan off';

    // A composer's editable surface. The harness composer uses a Lexical
    // contenteditable host; textarea is kept for older surfaces.
    const EDITOR_SELECTOR = 'textarea, [contenteditable="true"], [contenteditable=""]';
    // Any element that marks a composer subtree. Several signals are matched so
    // renaming one private attribute cannot silently disable the plugin.
    const COMPOSER_SELECTOR = `[data-input-scroll], ${EDITOR_SELECTOR}`;

    const warned = new Set();
    function warnOnce(key, message) {
      if (warned.has(key)) return;
      warned.add(key);
      console.warn(`[dsh-tab-plan-toggle] ${message}`);
    }

    /** True when `el` is a real text surface, not some unrelated input. */
    function isEditor(el) {
      if (el === null || el === undefined) return false;
      if (el.isContentEditable === true) return true;
      return el.tagName === 'TEXTAREA';
    }

    /**
     * The composer that owns `marker`, found structurally: the nearest ancestor
     * that also contains an editing surface. This is what keeps one press from
     * toggling a different conversation's composer.
     */
    function composerRoot(marker) {
      let el = marker === null || marker === undefined ? null : marker.parentElement;
      while (el !== null && el !== undefined && el !== document.body) {
        if (el.querySelector(COMPOSER_SELECTOR) !== null) return el;
        el = el.parentElement;
      }
      return null;
    }

    /** True when the focused editor sits inside this entry's own composer. */
    function ownsFocusedEditor(marker) {
      const root = composerRoot(marker);
      if (root === null) return false;
      const active = document.activeElement;
      return isEditor(active) && root.contains(active);
    }

    function isVisible(el) {
      return el.getClientRects().length > 0;
    }

    /**
     * While a suggestion menu is open, Tab means "next item" and must reach it.
     * The harness's own marker is checked first; a visible option listbox is a
     * public ARIA fallback, so a renamed attribute alone cannot break this.
     */
    function menuIsOpen() {
      if (document.querySelector('[data-trigger-menu]') !== null) return true;
      for (const list of document.querySelectorAll('[role="listbox"]')) {
        if (list.querySelector('[role="option"]') !== null && isVisible(list)) return true;
      }
      return false;
    }

    /** A keydown that should toggle plan mode rather than reach the editor. */
    function isToggleKey(event) {
      if (event.key !== 'Tab') return false;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
      if (event.isComposing) return false;
      if (menuIsOpen()) return false;
      return isEditor(document.activeElement);
    }

    /**
     * The projection's client view is `{ active, pending }`, where `pending` is
     * the queued target — so it is the effective state, and a second press
     * reverses a queued change instead of becoming a no-op. An absent
     * projection reads as inactive, so the first press still enters plan mode.
     */
    function effectiveActive(plan) {
      if (plan === null || plan === undefined) return false;
      return plan.pending === true ? plan.active !== true : plan.active === true;
    }

    /** Resolve the command channel, with a diagnosable error if it is absent. */
    function commandsOf(ctx) {
      const remote = ctx.remote;
      const commands = remote === undefined ? undefined : remote.commands;
      if (commands === undefined || typeof commands.execute !== 'function') {
        throw new Error('the Plan command is unavailable in this build — update DeepSeek Harness');
      }
      return commands;
    }

    /**
     * Run one plan command through the public command API. The envelope is
     * `{ ok, value }` on success and `{ ok: false, error }` on failure; an
     * unknown command yields `value === undefined`.
     */
    async function runPlan(ctx, sessionId, line) {
      const result = await commandsOf(ctx).execute(sessionId, line, []);
      if (result === undefined) throw new Error(`unknown command: ${line}`);
      if (result.ok !== true) {
        const error = result.error;
        const detail = error === undefined ? 'command failed' : `${error.message} (${error.code})`;
        throw new Error(detail);
      }
      const payload = result.value;
      if (payload === undefined) throw new Error(`unknown command: ${line}`);
      if (payload.result !== undefined && payload.result.kind === 'error') {
        throw new Error(payload.result.text);
      }
      return payload;
    }

    /**
     * Invisible composer seat. Its only job is to mark which composer this
     * entry belongs to; plan state comes from the harness's own `plan`
     * projection, so the state shown and the state toggled never disagree.
     */
    function TabPlanToggle({ useProjection, toggle }) {
      const markerRef = React.useRef(null);
      const plan = typeof useProjection === 'function' ? useProjection('plan') : undefined;
      const planRef = React.useRef(plan);

      React.useEffect(() => {
        planRef.current = plan;
      }, [plan]);

      React.useEffect(() => {
        if (typeof useProjection !== 'function') {
          warnOnce('projection', 'plan state is unavailable — update DeepSeek Harness');
        }
        const onKeyDown = (event) => {
          if (!isToggleKey(event)) return;
          if (!ownsFocusedEditor(markerRef.current)) return;
          event.preventDefault();
          toggle(effectiveActive(planRef.current)).catch((error) => {
            warnOnce('toggle', error instanceof Error ? error.message : String(error));
          });
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
      }, [toggle, useProjection]);

      return h('span', { ref: markerRef, hidden: true });
    }

    function apply(ctx) {
      ctx.slots.inject('conversation.input.left', () => ctx.slots.register(
        {
          name: 'conversation.input.left',
          id: 'tab-plan-toggle',
          order: 0,
          inject: (sessionId) => ({
            /** `wasActive` is the state to leave, so being on means `/plan off`. */
            toggle: (wasActive) => runPlan(ctx, sessionId, wasActive === true ? PLAN_OFF : PLAN_ON),
          }),
        },
        TabPlanToggle,
      ));
    }

    return { apply, inject };
  },
});
