# Local agent setup

Robot Workshop talks to coding agents through stable ACP v1 using
`@agentclientprotocol/sdk` 1.9.x. Agent runs are optional: projects, files, the
catalog, and exports remain usable when no adapter is installed.

## Supported adapter commands

Only these server-side adapter IDs and commands are accepted. A browser request
cannot provide an executable or arguments.

| Agent ID | Command | Installation | Authentication |
| --- | --- | --- | --- |
| `codex` | `codex-acp` | `npm install -g @agentclientprotocol/codex-acp` | Use the adapter/Codex supported login flow. |
| `claude` | `claude-agent-acp` | `npm install -g @agentclientprotocol/claude-agent-acp` | Use the Claude Code supported login flow. |
| `opencode` | `opencode acp` | Follow the OpenCode install guide at <https://opencode.ai/docs>. | Run `opencode auth login` and choose a provider. |

Executables are detected with filesystem access checks in the application's
`node_modules/.bin` and `PATH`. Robot Workshop never invokes `npx`, downloads an
adapter automatically, runs a shell, reads provider token files, extracts OAuth
tokens, or sends credentials to the browser. A missing adapter is reported as
unavailable with the relevant instruction above.

The SDK transport and protocol lifecycle are exercised by automated tests against
a real stdio fake peer. `@agentclientprotocol/codex-acp` 2.2.2 is installed in
this checkout and its version command succeeds. No live paid inference was run;
Claude/OpenCode are not installed, and real authentication/model behavior remains
a separate smoke-test item. An attempted Codex initialization in this restricted
development environment stopped before inference because its child app-server
could not create required local state, so that is not evidence of a live handshake.

## Candidate workspaces and safety boundary

Every run starts from a new candidate project directory. ACP `session/new` receives
that directory as its `cwd`; the original registered project is never passed to the
agent and a result is never merged back automatically. Completed, failed, and
cancelled runs retain their candidate directories. “Open result copy” registers
the candidate under its new project ID, leaving the original intact.

This is a data-preservation boundary, not a universal operating-system sandbox.
Setting a working directory does not itself confine tools launched by an adapter.
The current Codex ACP adapter documents `INITIAL_AGENT_MODE=workspace-write`, so
Robot Workshop sets that mode for `codex-acp`; it limits Codex-managed writes to
the candidate workspace while retaining provider permission prompts. Equivalent
enforcement has not been verified for the Claude and OpenCode adapters, so their
provider permissions must be configured using their supported controls. Do not
enable unrestricted or automatic approval merely to use this integration.

The ACP client advertises only bounded text-file read/write support; it does not
advertise terminal support. Client file operations reject paths outside the
candidate's real path, symbolic-link traversal, wrong session IDs, and files over
the configured size bound. That protects the client-provided filesystem methods.
It cannot constrain filesystem or terminal tools implemented and executed inside
the agent process itself.

## Runtime behavior

- One run may be active per source project. The reservation happens before the
  asynchronous snapshot starts, so concurrent requests cannot race through it.
- Permission requests are shown with the adapter-provided options and remain
  pending until the user chooses one or cancels the run. Nothing is silently
  approved.
- Cancellation sends ACP `session/cancel`, resolves pending permission requests as
  cancelled, stops the adapter process, and retains partial candidate files.
- Output, tool activity, notices, and errors are bounded in memory. Common token
  shapes in adapter diagnostics are redacted; credentials are not intentionally
  surfaced.
- A terminal result is adoptable only after the adapter process has actually
  stopped and the candidate real path has been revalidated. Repeated adoption of
  the same run is idempotent within the server process.
- Agent text is generated output. It is never presented as evidence that hardware
  was assembled, tested, safe, or functional.

Run state is held in a bounded `globalThis` singleton so Next.js development module
reloads do not orphan the in-memory registry. A full server restart loses transcript
state, but candidate directories remain on disk for explicit recovery or cleanup.

## Remaining live-integration checks

Before claiming a provider adapter as tested, install it explicitly, complete its
own authentication flow, and perform a bounded smoke run in a disposable project.
Confirm initialization, `session/new`, streamed updates, a denied and an accepted
permission, cancellation, process exit, and result-copy registration. Also confirm
the adapter's documented provider sandbox settings; `cwd` alone is not evidence of
workspace-only access.

## Local verification — 2026-10-18

Root ran `scripts/smoke-agent.ts` with Codex ACP 2.2.2 and the existing supported
local authentication. Initialization, streaming tool/message events, actual creation
of `notes/agent-check.md`, process exit, result registration, and preservation of the
original were verified. That run did not require a permission prompt. Permission
accept/reject and cancellation are covered by the subprocess protocol tests; those
paths have not been claimed as live-provider tests. Claude and OpenCode remain
untested. The smoke script is explicit/manual because it consumes provider credits.
