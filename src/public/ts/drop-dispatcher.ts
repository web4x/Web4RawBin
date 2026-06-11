/**
 * DnD Drop Dispatcher — routes dropped files by mimeType.
 * Known files → upload; unknown → chat log + extensible handler registry.
 */

type DropHandler = (file: File, roomId: string, playerToken: string) => Promise<void>;

export class DropDispatcher {
  private handlers = new Map<string, DropHandler>();

  constructor(private baseUrl: string = '') {}

  register(mimePrefix: string, handler: DropHandler): void {
    this.handlers.set(mimePrefix, handler);
  }

  // [impl:uuid:d6ec181b-3e6f-4b95-9b67-196cdb137ad3] DropDispatcher.uploadFile
  async uploadFile(file: File, roomId: string, playerToken: string): Promise<{ uuid: string; name: string; size: number } | null> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('playerToken', playerToken);
    const resp = await fetch(`${this.baseUrl}/api/room/${roomId}/upload`, { method: 'POST', body: fd });
    if (!resp.ok) return null;
    return resp.json();
  }

  // [impl:uuid:971bdde0-004b-4896-bc8c-4570832f6304] DropDispatcher.routeUnknown
  async routeUnknown(file: File, roomId: string, playerToken: string, sendChat: (text: string) => void): Promise<void> {
    for (const [prefix, handler] of this.handlers) {
      if (file.type.startsWith(prefix)) {
        await handler(file, roomId, playerToken);
        return;
      }
    }
    sendChat(`[drop-debug] ${file.name} (${file.type || 'unknown'}) — no handler registered`);
  }

  async dispatch(file: File, roomId: string, playerToken: string, sendChat: (text: string) => void): Promise<{ uuid: string; name: string; size: number } | null> {
    if (file.type.startsWith('image/') || file.type.startsWith('text/') || file.type.startsWith('application/')) {
      return this.uploadFile(file, roomId, playerToken);
    }
    await this.routeUnknown(file, roomId, playerToken, sendChat);
    return null;
  }
}

export const dropDispatcher = new DropDispatcher();
