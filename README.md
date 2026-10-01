# Tab Plan Toggle

**Press Tab to turn Plan mode on and off, right from the message box.**

No typing `/plan`. No hunting through menus. Just tap Tab while you're typing.

---

## What it does

| You do this | What happens |
| --- | --- |
| Press `Tab` in the message box | Plan mode turns **on** |
| Press `Tab` again | Plan mode turns **off** |

A blue **Plan** badge appears in the message box whenever Plan mode is on, and the hint text changes to *"describe your task to generate plan"* — so you always know where you stand.

Tab behaves normally everywhere else. It only toggles Plan mode when your cursor is in the message box, so it never gets in your way while you're writing code, reading, or moving around the app.

---

## Install

Open a terminal and run:

```bash
dsh plugin --profile web add github:sujalmandal/dsh-tab-plan-toggle
```

Then restart DeepSeek Harness:

```bash
dsh web
```

That's it. Open the app and try pressing `Tab` while typing a message.

---

## Everyday questions

**I pressed Tab and nothing happened.**
Make sure your cursor is actually *in the message box* — click into it first. Tab does nothing if you're focused somewhere else, which is on purpose.

**The `/` command menu is open and Tab isn't toggling.**
That's intended. Inside the `/` and `@` menus, Tab moves between menu items, exactly as it always has.

**Does it work in every conversation?**
Yes. It works in new chats and in conversations you already have open.

**Will it survive DeepSeek Harness updates?**
Yes — and this is the main thing the current version fixes. Earlier versions reached into the app's internals, so a Harness update could quietly break them. This version only uses the same public, supported controls the app itself uses to toggle Plan mode. It has nothing private left to break.

---

## Updating

```bash
dsh plugin --profile web add github:sujalmandal/dsh-tab-plan-toggle
```

Run the same command as installing. It fetches the newest version and replaces the old one.

---

## Uninstalling

```bash
dsh plugin --profile web remove dsh-tab-plan-toggle
```

Then restart `dsh web`. Tab goes straight back to its normal behaviour.

---

## Requirements

- DeepSeek Harness `0.2.0-rc.2` or newer
- The web UI (`dsh web`)

---

## For the curious

<details>
<summary>How it works under the hood</summary>

This is a small client-side plugin. It watches for Tab inside the composer, then runs DeepSeek Harness's own `/plan` and `/plan off` commands — the exact same ones you'd type by hand.

It installs straight from the GitHub repository rather than the npm registry, since it isn't published there — the install command above already points at the right place.

Because it goes through the app's public command interface and its public plan-mode state, it reads the real value the app uses to decide whether Plan mode is on. That means the badge, the button, and this plugin always agree — there's no separate copy of the state that can drift.

It uses **no host-side code and no private APIs**, which is what makes it durable across updates.

</details>

---

## License

MIT
