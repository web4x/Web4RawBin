/**
 * AgentMessage (S30, R30.1-4) — inter-agent messages as FIRST-CLASS scenario units.
 *
 * ASYNC MAILBOX, not keystroke injection. Tron caught that the old transport
 * (`otmux send <pane> "..." Enter` / `tmux send-keys`) injects text+Enter into a recipient
 * agent's LIVE prompt and INTERRUPTS its turn (the `[Request interrupted by user]` events).
 * So here: `send` WRITES + COMMITS the message unit (that IS the delivery); recipients PULL via
 * `inbox` at THEIR own turn boundary. `assertNoLiveInjection` (R30.3) guards the invariant that the
 * delivery path never submits input to a live prompt. tmux is retired for task-comms.
 *
 * Each message is owned by the Task it is about (ownerIor = task) and forward-linked from
 * Task.messages[], so the traceability walk reaches Task -> AgentMessage.
 */
import { execSync } from 'node:child_process';
import { ScenarioIndex } from './index-store.js';
import { type ScenarioUnit } from './types.js';

export type MessageKind = 'report' | 'question' | 'directive' | 'ack' | 'verdict';

export interface AgentMessageModel {
  uuid: string;
  from: string;          // sending agent (role)
  to: string;            // recipient agent (role)
  task: string;          // ior:instance:<taskUuid> — the task this message is about
  kind: MessageKind;
  body: string;
  sentAt: string;        // ISO timestamp, passed in by the caller (no Date.now in the class)
  read: boolean;
  inReplyTo?: string;    // ior:instance:<msgUuid> — optional thread link
}

/** R30.1 default template for the AgentMessage scenario type (registered in classes.ts). */
export const AGENT_MESSAGE_DEFAULTS: Record<string, unknown> = {
  from: '', to: '', task: '', kind: 'report', body: '', sentAt: '', read: false,
};

export class AgentMessage {
  constructor(private idx: ScenarioIndex, private repoRoot: string, private self: string) {}

  // [impl:uuid:dfd834eb-c6ae-4ae7-a799-859de6fc0aae] R30.1 AgentMessage.defineUnitType
  /** Register ior:class:AgentMessage as a first-class scenario type (peer to Task/Requirement). */
  defineUnitType(): { ior: string; defaults: Record<string, unknown> } {
    // classes.ts: export const AgentMessageLoader = loader('AgentMessage', AGENT_MESSAGE_DEFAULTS);
    // This method is the single source of truth for the type's ior + default shape.
    return { ior: 'ior:class:AgentMessage', defaults: { ...AGENT_MESSAGE_DEFAULTS } };
  }

  // [impl:uuid:d001799a-8664-450b-9d8c-0af138988fbf] R30.3 AgentMessage.assertNoLiveInjection
  /** Hard invariant: the delivery path must NOT inject text+Enter into a recipient's live prompt.
   *  Throws if the given send-path source contains a tmux/otmux keystroke-submit — the interrupt bug. */
  assertNoLiveInjection(sendSource: string): void {
    if (/(?:tmux\s+send-keys|otmux\s+send)[^\n]*\bEnter\b/i.test(sendSource)) {
      throw new Error(
        'AgentMessage R30.3 violation: delivery injects into a live prompt (tmux/otmux ... Enter). ' +
        'Delivery MUST be write+commit only; recipients pull via inbox.',
      );
    }
  }

  // [impl:uuid:09fc9f11-deef-4ff1-a61f-a3200e1eb15f] R30.2 AgentMessage.send
  /** Mint the AgentMessage unit, link it from Task.messages[], and COMMIT it. That is the whole
   *  delivery — NO keystroke injection into the recipient's live prompt (async mailbox). */
  send(taskUuid: string, to: string, kind: MessageKind, body: string, sentAt: string, inReplyTo?: string): string {
    const uuid = freshUuid();
    const model: AgentMessageModel = { uuid, from: this.self, to, task: `ior:instance:${taskUuid}`, kind, body, sentAt, read: false };
    if (inReplyTo) model.inReplyTo = inReplyTo;
    const unit = { ior: 'ior:class:AgentMessage', model: model as unknown as Record<string, unknown>, ownerIor: `ior:instance:${taskUuid}` } as unknown as ScenarioUnit;
    this.idx.put(uuid, unit);

    // forward-link from the task (mirrors Task.useCases[]); tolerate a missing task.
    const paths = [this.idx.filePath(uuid)];
    const task = this.idx.get(taskUuid);
    if (task) {
      const tm = task.model as Record<string, unknown>;
      const msgs = ((tm.messages as string[]) || []).slice();
      const ref = `ior:instance:${uuid}`;
      if (!msgs.includes(ref)) { msgs.push(ref); tm.messages = msgs; this.idx.put(taskUuid, task); paths.push(this.idx.filePath(taskUuid)); }
    }

    this.commit(paths, `msg(${kind}): ${this.self} -> ${to} on task ${taskUuid.slice(0, 8)}`);
    return uuid; // delivered = committed on disk. Recipient pulls via inbox().
  }

  // [impl:uuid:d431820d-d4dd-4e40-ae7f-83cfaa86224e] R30.4 AgentMessage.inbox
  /** PULL: all UNREAD messages addressed to an agent, across every task, oldest-first. The recipient
   *  calls this at its own turn boundary — no one pushes into its prompt. */
  inbox(agent: string): AgentMessageModel[] {
    const out: AgentMessageModel[] = [];
    for (const uuid of this.idx.list()) {
      const u = this.idx.get(uuid);
      if (!u || u.ior !== 'ior:class:AgentMessage') continue;
      const m = u.model as unknown as AgentMessageModel;
      if (m.to === agent && !m.read) out.push(m);
    }
    return out.sort((a, b) => (a.sentAt < b.sentAt ? -1 : a.sentAt > b.sentAt ? 1 : 0));
  }

  /** Mark a message read once consumed (so it leaves the inbox). */
  read(msgUuid: string): boolean {
    const u = this.idx.get(msgUuid);
    if (!u || u.ior !== 'ior:class:AgentMessage') return false;
    (u.model as Record<string, unknown>).read = true;
    this.idx.put(msgUuid, u);
    this.commit([this.idx.filePath(msgUuid)], `msg-read: ${msgUuid.slice(0, 8)} by ${this.self}`);
    return true;
  }

  private commit(paths: string[], message: string): void {
    // best-effort: the unit is already durable on disk via put(); commit adds rewind-survival.
    try {
      execSync(`git add ${paths.map(p => JSON.stringify(p)).join(' ')}`, { cwd: this.repoRoot, stdio: 'ignore' });
      execSync(`git commit -q -m ${JSON.stringify(message)}`, { cwd: this.repoRoot, stdio: 'ignore' });
    } catch { /* nothing staged / no git — the on-disk unit still stands */ }
  }
}

/** uuidgen-fresh (HARD RULE: fresh or verbatim copy). send() is a live action, so randomUUID is fine. */
function freshUuid(): string {
  return (globalThis.crypto as { randomUUID(): string }).randomUUID();
}
