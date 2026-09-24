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
      const element = document.activeElement;
      if (!element || element.tagName !== 'TEXTAREA') return false;
      return element.closest('[data-input-scroll]') !== null;
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
          react.useEffect(() => {
            const onKeyDown = (event) => {
              if (!isComposerTab(event)) return;
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

          return null;
        }
      ));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
