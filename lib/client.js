window.__ModuleLoader__.load({
  id: 'dsh-tab-plan-toggle',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    const react = require('react');

    const inject = ['slots', 'connection'];

    const CHANNEL = '/dsh-tab-plan-toggle';

    function isComposerTab(event) {
      if (event.key !== 'Tab') return false;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
      if (event.isComposing) return false;
      if (document.querySelector('[data-trigger-menu]') !== null) return false;
      const element = document.activeElement;
      if (!element) return false;
      if (element.tagName !== 'TEXTAREA' && element.isContentEditable !== true) return false;
      return element.closest('[data-input-scroll]') !== null;
    }

    function composerScope(marker) {
      let element = marker;
      while (element !== null && element !== document.body) {
        if (element.querySelector('[data-input-scroll]') !== null) return element;
        element = element.parentElement;
      }
      return null;
    }

    function ownsFocusedComposer(marker) {
      if (marker === null) return false;
      const scope = composerScope(marker);
      if (scope === null) return false;
      const element = document.activeElement;
      if (element === null) return false;
      return scope.contains(element);
    }

    function apply(ctx) {
      const slots = ctx.get('slots');
      if (slots === undefined) return;

      slots.inject('conversation.input.left', () => slots.register(
        {
          name: 'conversation.input.left',
          id: 'tab-plan-toggle',
          order: 0,
          inject: (sessionId) => ({
            toggle: async () => {
              const connection = ctx.get('connection');
              if (connection === undefined) throw new Error('connection service unavailable');
              return connection.rpc.call(CHANNEL, 'toggle', { sessionId });
            },
          }),
        },
        ({ toggle }) => {
          const markerRef = react.useRef(null);

          react.useEffect(() => {
            const onKeyDown = (event) => {
              if (!isComposerTab(event)) return;
              if (!ownsFocusedComposer(markerRef.current)) return;
              event.preventDefault();
              toggle().then((result) => {
                if (result && result.ok === false) console.error('[dsh-tab-plan-toggle]', result.error);
              }, (error) => {
                console.error('[dsh-tab-plan-toggle]', error);
              });
            };
            document.addEventListener('keydown', onKeyDown, true);
            return () => document.removeEventListener('keydown', onKeyDown, true);
          }, [toggle]);

          return react.createElement('span', { ref: markerRef, hidden: true });
        }
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
