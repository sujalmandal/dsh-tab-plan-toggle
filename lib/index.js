const name = 'dsh-tab-plan-toggle';

const CHANNEL = '/dsh-tab-plan-toggle';

function resolvePlanMode(ctx, agent) {
  const agentPresets = ctx.get('agentPresets');
  if (!agentPresets || typeof agentPresets.serviceFor !== 'function') return undefined;
  return agentPresets.serviceFor(agent, 'planMode');
}

function effectiveActive(planMode, agent) {
  const state = planMode.get(agent);
  if (state.pending === undefined) return state.active;
  return state.pending;
}

function loggedActive(session) {
  let active = false;
  for (const event of session.snapshotEvents()) {
    if (event.type === 'plan/mode') active = event.data.active;
  }
  return active;
}

function toggle(ctx, sessionId) {
  if (typeof sessionId !== 'string' || sessionId === '') return { ok: false, error: 'missing sessionId' };
  const agent = ctx.get('agents')?.get(sessionId);
  if (agent === undefined) return { ok: false, error: 'unknown session' };

  const planMode = resolvePlanMode(ctx, agent);
  if (planMode !== undefined) {
    const target = !effectiveActive(planMode, agent);
    planMode.set(agent, target);
    return { ok: true, active: target };
  }

  const target = !loggedActive(agent.session);
  agent.session.append('plan/mode', { active: target });
  return { ok: true, active: target };
}

function apply(ctx) {
  ctx.inject(['connection'], (svc) => {
    ctx.effect(() => svc.connection.rpc.handle(CHANNEL, (endpoint, payload) => {
      if (endpoint !== 'toggle') return { ok: false, error: `unknown endpoint: ${endpoint}` };
      try {
        return toggle(ctx, payload?.sessionId);
      } catch (error) {
        return { ok: false, error: error?.message ?? String(error) };
      }
    }, { authority: 'loopback' }), 'dsh-tab-plan-toggle: rpc channel');
  });
}

export { apply, name };
