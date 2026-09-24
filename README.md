# dsh-tab-plan-toggle

Toggle [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plan mode with **Tab** while the composer textarea has focus.

| Press | Result |
| --- | --- |
| `Tab` (composer focused, plan mode off) | plan mode on |
| `Tab` (composer focused, plan mode on) | plan mode off |

## Install

```bash
dsh plugin --profile web add dsh-tab-plan-toggle
dsh web
```

Straight from the repository, before (or instead of) a registry release:

```bash
dsh plugin --profile web add git+https://github.com/sujalmandal/dsh-tab-plan-toggle.git
```

Verify the row is composed before restarting:

```bash
dsh --profile web --dump-config   # look for "# == dsh-tab-plan-toggle"
```

## How it works

```
composer Tab keydown ──rpc /dsh-tab-plan-toggle──▶ host half
                                                    │
      ctx.get('agentPresets').serviceFor(agent,'planMode')
                                                    │
      target = !(pending ?? active)  ─────────────────┘
      planMode.set(agent, target)
```

- The host half calls the plan-mode service, so entering and leaving produce the same narration notice as `/plan` — with no `command/run` row added to the conversation.
- Plan mode lives inside an agent preset's `isolate` realm on `dsh web`, so a host row can only reach it through `agentPresets.serviceFor(agent, 'planMode')`. When that service is unavailable the plugin falls back to appending `plan/mode` to the session log.
- `pending` from `planMode.get()` is the service's queued *target*, so it counts as the effective state: a second press reverses a queued change instead of becoming a no-op.
- Each entry acts only for the composer it is mounted in: the guard resolves the composer holding this entry's marker and requires the focused editor to sit inside it.
- The 0.1.0 guard asked only whether the focused element sat in *some* `[data-input-scroll]`, so with another conversation's entry still mounted, one press toggled both conversations.

## Guards

Tab is only intercepted when all of these hold:

- no `⌘`/`Ctrl`/`Alt`/`Shift`, and no IME composition in flight;
- the focused element is the composer's editor — its Lexical contenteditable host, or a `TEXTAREA` — and it sits inside `[data-input-scroll]`;
- that editor belongs to the same composer as this entry's marker, so other conversations' composers cannot match;
- no suggestion menu is open (`[data-trigger-menu]` absent): inside the `/` or `@` menu, Tab means **Browse folder**.

Everywhere else Tab keeps its normal behaviour.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Tab does nothing | The composer's editor is Lexical's contenteditable host, **not** a `TEXTAREA` — a guard that requires `TEXTAREA` can never match. Verify the editor reports `isContentEditable`. Also confirm the entry's marker sits inside the same composer card as the editor. |
| Tab toggles another conversation | Fixed in 0.1.1. On 0.1.0 each mounted composer added its own `document` keydown listener and any focused composer satisfied every one of them, so one press toggled every open conversation. |
| Tab still dead after an upgrade | Only one `dsh-tab-plan-toggle` row in `--dump-config`. Two mounts means two handlers, and Tab toggles twice — a net no-op. |
| `… is not iterable` in the browser console | An older build read `session.events`; the Session API exposes `snapshotEvents()`. Upgrade. |
| Tab hijacks other editors | The guard requires the editor to sit inside `[data-input-scroll]`; report the app surface if it does not. |

## License

MIT
