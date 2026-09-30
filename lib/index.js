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
  if (typeof sessionId !== 'string' || sessionId === '') {
    return { ok: false, code: 'bad-session', message: 'missing sessionId' };
  }
  const agent = ctx.get('agents')?.get(sessionId);
  if (agent === undefined) return { ok: false, code: 'unknown-session', message: 'unknown session' };

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

function failure(code, message) {
  return { ok: false, error: { code, message, details: {} } };
}

function handleToggle(ctx, endpoint, payload) {
  if (endpoint !== 'toggle') return failure('unknown-endpoint', `unknown endpoint: ${endpoint}`);
  try {
    const result = toggle(ctx, payload?.sessionId);
    if (!result.ok) return failure(result.code, result.message);
    return { ok: true, value: { active: result.active } };
  } catch (error) {
    return failure('toggle-failed', error?.message ?? String(error));
  }
}

function apply(ctx) {
  // The channel is registered through the Connection service, whose `register`
  // re-reads `webServer` from the calling fiber's context. That read only
  // resolves when the caller's context owns a `webServer` property, so the
  // service is injected here and materialized onto the extended context.
  ctx.inject(['connection', 'webServer'], (webCtx) => {
    const owner = webCtx.extend({ webServer: webCtx.get('webServer') });
    const connection = owner.connection;
    if (connection === undefined) return;
    const dispose = connection.rpc.handle(CHANNEL, (endpoint, payload) => handleToggle(ctx, endpoint, payload));
    return () => void dispose();
  });
}

export { apply, name };
