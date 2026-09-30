/**
 * Host half of dsh-tab-plan-toggle.
 *
 * This is a pure UI plugin: every behavior lives in the browser bundle
 * (`exports["./client"]`), which the Client discovers through the
 * `dsh.client` declaration in package.json. The empty `apply` exists only so
 * the bundle patch has a row to compose — the same shape the harness's own
 * `@deepseek-ai/dsh-client-ui-plan` uses.
 *
 * There is deliberately no host-side RPC channel here. Toggling goes through
 * the harness's public Plan command and the `plan` session projection, so this
 * plugin depends on no private host API and cannot be broken by host-internal
 * refactors.
 */
/** Host plugin body — no host-side behavior for this surface plugin. */
export function apply() {}
