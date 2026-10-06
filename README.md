# andru-intel

Andru from your terminal. Buyer intelligence, sales hiring, investor matching, and Andru's catalog of 138 assets — board decks, playbooks, business cases — generated from what Andru knows about your company and saved as markdown.

```bash
npx andru-intel --help
```

## Setup

Most commands need an Andru API key. Create one in your account at
[platform.andru-ai.com/settings/developer](https://platform.andru-ai.com/settings/developer), then:

```bash
export ANDRU_API_KEY=sk_live_...
```

`andru-intel score` and `andru-intel persona` also work without a key.

## Assets

```bash
npx andru-intel assets board                     # search the catalog (free)
npx andru-intel assets --group Strategic --available
npx andru-intel generate "Board Presentation" --out board-deck.md
npx andru-intel generate "Buying Committee Navigation" --no-wait   # prints a job id
npx andru-intel get-asset <job_id> --out map.md
```

`generate` waits for the asset (Decision assets can take a few minutes), saves it as markdown, and also saves it to your Andru library.

## Other commands

| Command | What it does |
|---|---|
| `score "<product>"` | ICP intelligence for a product description |
| `persona <role>` | Buyer persona for a role (CFO, CTO, …) |
| `brief <company>` | Pre-meeting brief |
| `blueprint` | First sales hire blueprint |
| `thesis "<product>"` | VC thesis matches |
| `wellness` | Founder burnout check |
| `roleplay [persona]` | Practise a pitch against a buyer persona |
| `run <tool> [--param value]` | Run any Andru MCP tool directly |
| `list` | All tools and commands |

## Pricing

The same work costs the same as in the Andru platform, paid from your Andru wallet. Answers from your own data are free. Pre-meeting brief $1.50, buyer role-play $5, catalog assets $3 / $12 / $49. See [andru-ai.com/pricing](https://andru-ai.com/pricing).

## Environment

| Variable | Default |
|---|---|
| `ANDRU_API_KEY` | — (required for most commands) |
| `ANDRU_API_URL` | `https://api.andru-ai.com` |

Also available as an MCP server: [`mcp-server-andru-intelligence`](https://www.npmjs.com/package/mcp-server-andru-intelligence).
