// 《鱗片與種子》Cloudflare D1 雲端存檔客戶端
// 獨立模組、預設不接管舊存檔。所有請求使用 Supabase 既有登入階段取得的 token。
// 不在 URL、localStorage 或日誌另外儲存 access token。
const DEFAULT_API = 'https://scales-seeds-save-api.scales-seeds-game.workers.dev';
const MAX_PAYLOAD_BYTES = 512 * 1024;

export class CloudflareSaveClient {
  constructor({ supabaseClient, endpoint = DEFAULT_API } = {}) {
    if (!supabaseClient?.auth?.getSession) throw new Error('需要現有 Supabase 登入客戶端');
    this.authClient = supabaseClient;
    this.endpoint = endpoint.replace(/\/$/, '');
  }

  async request(path, options = {}) {
    const { data, error } = await this.authClient.auth.getSession();
    if (error || !data?.session?.access_token) {
      return { success: false, mode: 'login_required', status: 401 };
    }
    const headers = {
      authorization: 'Bearer ' + data.session.access_token,
      ...(options.body ? { 'content-type': 'application/json' } : {})
    };
    let response;
    try {
      response = await fetch(this.endpoint + path, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: 'no-store',
        redirect: 'error'
      });
    } catch {
      return { success: false, mode: 'network_unavailable' };
    }
    let payload;
    try { payload = await response.json(); }
    catch { return { success: false, mode: 'invalid_server_response', status: response.status }; }
    return { success: response.ok, status: response.status, data: payload, mode: response.ok ? 'ok' : (payload.error || 'api_error') };
  }

  /** Returns {found, revision, schemaVersion, save} when authenticated. Never creates a default save. */
  async load() {
    return this.request('/v1/save');
  }

  /** expectedRevision=0 means new cloud slot; all subsequent writes require last accepted revision. */
  async save(save, expectedRevision, schemaVersion = 2) {
    if (!save || typeof save !== 'object' || Array.isArray(save) ||
        !Number.isInteger(expectedRevision) || expectedRevision < 0 ||
        !Number.isInteger(schemaVersion) || schemaVersion < 1) {
      return { success: false, mode: 'invalid_save_request' };
    }
    const body = { save, expectedRevision, schemaVersion };
    if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_PAYLOAD_BYTES)
      return { success: false, mode: 'payload_too_large' };
    // Never automatically retry 409 (revision_conflict): player must resolve conflicting saves.
    return this.request('/v1/save', { method: 'PUT', body });
  }

  /** Restores a historical version as a new revision without deleting newer history. */
  async restore(targetRevision, expectedRevision) {
    if (!Number.isSafeInteger(targetRevision) || targetRevision < 1 || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) return {success:false,mode:'invalid_restore_request'};
    return this.request('/v1/restore', {method:'POST',body:{targetRevision,expectedRevision}});
  }

  async listRevisions() {
    return this.request('/v1/revisions');
  }
}
