// 《鱗片與種子》Cloudflare 離線待同步存檔（獨立模組，正式遊戲預設不啟用）
// IndexedDB keeps local drafts by authenticated Supabase user ID.
// No passwords, access tokens or service keys are stored here.
import { decideSaveSync } from './save-sync-policy.js';

const DB_NAME = 'scales_seeds_offline_sync_v1';
const STORE = 'pending';
const MAX_BYTES = 512 * 1024;
function validSave(value) { return !!value && typeof value==='object' && !Array.isArray(value); }
function validRevision(n) { return Number.isSafeInteger(n) && n >= 0; }

export class OfflineSaveSync {
  constructor({ api, supabaseClient, indexedDBFactory = globalThis.indexedDB } = {}) {
    if (!api?.load || !api?.save || !supabaseClient?.auth?.getUser)
      throw new Error('需要雲端存檔 API 與 Supabase Auth');
    if (!indexedDBFactory) throw new Error('此瀏覽器不支援 IndexedDB');
    this.api = api;
    this.auth = supabaseClient.auth;
    this.factory = indexedDBFactory;
  }

  async open() {
    return new Promise((resolve,reject) => {
      const r=this.factory.open(DB_NAME,1);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE);};
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error||new Error('無法開啟本機備份資料庫'));
      r.onblocked=()=>reject(new Error('本機備份資料庫正在被其他分頁使用'));
    });
  }

  async getUserId() {
    const {data,error}=await this.auth.getUser();
    if(error || !data?.user?.id || data.user.is_anonymous===true) throw new Error('必須登入已驗證的玩家帳號');
    return data.user.id;
  }

  async transact(kind, key, value) {
    const db=await this.open();
    try {
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE, kind==='read'?'readonly':'readwrite');
        const store=tx.objectStore(STORE);
        const req=kind==='read'?store.get(key):kind==='delete'?store.delete(key):store.put(value,key);
        let result;
        req.onsuccess=()=>{result=req.result;};
        req.onerror=()=>reject(req.error||new Error('本機備份讀寫失敗'));
        tx.oncomplete=()=>resolve(result); // Only report success once the transaction commits.
        tx.onerror=()=>reject(tx.error||new Error('本機備份交易失敗'));
        tx.onabort=()=>reject(tx.error||new Error('本機備份交易已取消'));
      });
    } finally { db.close(); }
  }

  async stage(save, baseRevision, schemaVersion=2) {
    if(!validSave(save) || !validRevision(baseRevision) || !Number.isSafeInteger(schemaVersion) || schemaVersion<1)
      return {success:false,reason:'invalid_save'};
    const serialized=JSON.stringify(save);
    if(new TextEncoder().encode(serialized).byteLength>MAX_BYTES)
      return {success:false,reason:'payload_too_large'};
    const userId=await this.getUserId();
    const prior=await this.transact('read',userId);
    if(prior) return {success:false,reason:'pending_exists',pendingId:prior.id};
    const pending={id:crypto.randomUUID(),userId,baseRevision,schemaVersion,save:JSON.parse(serialized),createdAt:Date.now()};
    await this.transact('put',userId,pending);
    return {success:true,pendingId:pending.id};
  }

  async inspect() {
    const userId=await this.getUserId();
    const pending=await this.transact('read',userId);
    return pending?{pending:true,id:pending.id,baseRevision:pending.baseRevision,createdAt:pending.createdAt}:{pending:false};
  }

  async checkSync() {
    const userId=await this.getUserId();
    const pending=await this.transact('read',userId);
    const remote=await this.api.load();
    const decision=decideSaveSync({
      localSave:pending?.save||null,
      localBaseRevision:pending?pending.baseRevision:null,
      localDirty:!!pending,
      remote
    });
    return {decision,hasPending:!!pending,remoteRevision:remote.success?(remote.data?.found?remote.data.revision:0):null};
  }

  // Explicitly invoked by an action. Never sync on network reconnect automatically.
  async syncPending() {
    const userId=await this.getUserId();
    const pending=await this.transact('read',userId);
    if(!pending) return {success:false,reason:'no_pending_save'};
    const remote=await this.api.load();
    const decision=decideSaveSync({localSave:pending.save,localBaseRevision:pending.baseRevision,localDirty:true,remote});
    if(decision.action!=='upload_with_revision_check')
      return {success:false,reason:decision.reason||decision.action,decision};
    // Confirm this authenticated account is unchanged before sending the draft.
    if(await this.getUserId()!==pending.userId) return {success:false,reason:'account_changed'};
    const result=await this.api.save(pending.save,pending.baseRevision,pending.schemaVersion);
    if(!result.success) return {success:false,reason:result.mode||'upload_failed',status:result.status};
    // If another draft replaced this one, never erase it. Atomic check-and-delete in one IDB transaction.
    const db=await this.open();
    let cleared=false;
    try {
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        const store=tx.objectStore(STORE);
        const req=store.get(userId);
        req.onsuccess=()=>{
          if(req.result?.id===pending.id){store.delete(userId);cleared=true;}
        };
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      });
    } finally {db.close();}
    return {success:true,revision:result.data?.revision,localCleared:cleared};
  }
}
