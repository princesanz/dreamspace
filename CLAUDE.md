# Claude — dreamspace + sanz-brain

Cinematic 3D portfolio. Vite + Three.js + GSAP/ScrollTrigger + Lenis, vanilla ES
modules, hand-written CSS. Output: static `dist/` (Vercel). See `README.md` for the
concept and run commands; project spec / station design lives in the repo.

This project connects to Sanz's Obsidian second brain via MCP server `sanz-brain`.
Vault path: `C:\Users\SANZ\OneDrive\Dokumen\sanz-brain`

## Session startup (mandatory)

1. Read `memory/INDEX.md` from sanz-brain first — every session, no exceptions.
2. Read the project hub note `projects/dreamspace.md` for current status and open items.
3. Check `inbox/claude-inbox.md` for pending tasks / handoffs from other agents.
4. Run the daily brief: `cd "C:\Users\SANZ\OneDrive\Dokumen\sanz-brain" && bash scripts/daily-brief.sh`,
   then read `generated/LATEST.md` and report it (project pulse + vault state matter here;
   market section is fine to skim). Skip only if Sanz says "no brief".

## Session end (mandatory)

Append a brief summary to sanz-brain `inbox/claude-inbox.md` (tag `[claude]`):
- what was done this session
- decisions made
- what failed / is blocked, and why
- handoffs to cursor/hermes/openclaw/antigravity if any

Also append significant work to `memory/YYYY-MM-DD.md` (today's date), and update
`projects/dreamspace.md` if status or open items changed.

## When to write to vault

- Sanz says "save", "remember", or "add to Obsidian"
- An important architectural/design decision is made
- A meaningful chunk of work finishes, or a real attempt fails (log the failure —
  it's as valuable as the success)
- An insight worth reusing in a future session

## Writing rules

- Write all vault content in English
- Tag entries `[claude]`; always date `YYYY-MM-DD`
- Never store API keys, tokens, or passwords
- Follow `protocols/Agent Memory Protocol.md` in the vault
- Project hub note in vault: [[projects/dreamspace]]

## Full agent instructions

See vault file: `C:\Users\SANZ\OneDrive\Dokumen\sanz-brain\CLAUDE.md`
