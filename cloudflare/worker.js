// Scales & Seeds cloud-save API (Cloudflare Workers + D1).
// Supabase Auth is the identity authority. Do not authorize with a client-supplied player ID.
const PROJECT_URL = 'https://dauqzheclsakpvnpwfma.supabase.co';
const MAX_SAVE_BYTES = 512 * 1024;
const ORIGINS = new Set(['https://zhangtingwei04-dotcom.github.io']);
const json = (value, status = 200, extra = {}) => Response.json(value, {status, headers: {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
function headersFor(origin) {
  return origin && ORIGINS.has(origin) ? {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET,PUT,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'} : {};
}
async function identity(request, env) {
  const auth = request.headers.get('authorization') || '';
  if (!/^Bearer [A-Za-z0-9._~+/-]+=*$/i.test(auth) || !env.SUPABASE_PUBLISHABLE_KEY) return null;
  const result = await fetch(PROJECT_URL+'/auth/v1/user', {
    headers: { authorization:auth, apikey:env.SUPABASE_PUBLISHABLE_KEY },
    redirect:'manual'
  });
  if (!result.ok) return null;
  const user = await result.json();
  if (!user || typeof user.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(user.id) || user.is_anonymous === true) return null;
  return user.id;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const cors = headersFor(origin);
    if (origin && !ORIGINS.has(origin)) return json({error:'origin_not_allowed'},403);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if (url.pathname === '/health' && request.method === 'GET')
      return json({service:'scales-seeds-save-api',status:'ready',databaseConnected:!!env.DB},200,cors);
    if (!url.pathname.startsWith('/v1/')) return json({error:'not_found'},404,cors);
    if (!env.DB) return json({error:'database_unavailable'},503,cors);
    let uid;
    try { uid = await identity(request,env); }
    catch { return json({error:'auth_unavailable'},503,cors); }
    if (!uid) return json({error:'unauthorized'},401,cors);
    const slot = 'main'; // Future multi-slot migration can explicitly introduce more slots.
    try {
      if (url.pathname === '/v1/save' && request.method === 'GET') {
        const s=await env.DB.prepare('SELECT revision,schema_version,save_data,updated_at FROM player_saves WHERE player_id=? AND slot_name=?').bind(uid,slot).first();
        return json(s?{found:true,revision:s.revision,schemaVersion:s.schema_version,save:JSON.parse(s.save_data),updatedAt:s.updated_at}:{found:false},200,cors);
      }
      if (url.pathname === '/v1/revisions' && request.method === 'GET') {
        const items=await env.DB.prepare('SELECT revision, schema_version, created_at FROM save_revisions WHERE player_id=? AND save_id=? ORDER BY revision DESC LIMIT 20').bind(uid,uid+':'+slot).all();
        return json({revisions:items.results||[]},200,cors);
      }
      // Restoring is a new revision, never a destructive rollback.
      // Caller must state the latest revision to prevent stale-device overwrites.
      if (url.pathname === '/v1/restore' && request.method === 'POST') {
        const raw = await request.text();
        if (new TextEncoder().encode(raw).byteLength > 2048)
          return json({error:'invalid_restore_request'},400,cors);
        let body;
        try { body=JSON.parse(raw); } catch { return json({error:'invalid_json'},400,cors); }
        if (!body || !Number.isSafeInteger(body.targetRevision) || body.targetRevision<1 ||
            !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision<1)
          return json({error:'invalid_restore_request'},400,cors);
        const saveId=uid+':'+slot;
        const current=await env.DB.prepare('SELECT revision FROM player_saves WHERE player_id=? AND slot_name=?').bind(uid,slot).first();
        if (!current) return json({error:'save_not_found'},404,cors);
        if (current.revision!==body.expectedRevision)
          return json({error:'revision_conflict',currentRevision:current.revision},409,cors);
        const target=await env.DB.prepare('SELECT revision FROM save_revisions WHERE save_id=? AND player_id=? AND revision=?').bind(saveId,uid,body.targetRevision).first();
        if(!target) return json({error:'revision_not_found'},404,cors);
        const next=body.expectedRevision+1, revisionId=crypto.randomUUID();
        const q=[
          env.DB.prepare(`UPDATE player_saves SET revision=?,schema_version=(SELECT schema_version FROM save_revisions WHERE save_id=? AND player_id=? AND revision=?),save_data=(SELECT save_data FROM save_revisions WHERE save_id=? AND player_id=? AND revision=?),checksum=NULL,updated_at=CURRENT_TIMESTAMP WHERE save_id=? AND player_id=? AND revision=?`)
            .bind(next,saveId,uid,body.targetRevision,saveId,uid,body.targetRevision,saveId,uid,body.expectedRevision),
          env.DB.prepare('INSERT INTO save_revisions(revision_id,save_id,player_id,revision,schema_version,save_data) SELECT ?,save_id,player_id,revision,schema_version,save_data FROM player_saves WHERE save_id=? AND player_id=? AND revision=?')
            .bind(revisionId,saveId,uid,next)
        ];
        const results=await env.DB.batch(q);
        if (results[0]?.meta?.changes!==1 || results[1]?.meta?.changes!==1) {
          const latest=await env.DB.prepare('SELECT revision FROM player_saves WHERE player_id=? AND slot_name=?').bind(uid,slot).first();
          return json({error:'revision_conflict',currentRevision:latest?.revision||0},409,cors);
        }
        return json({restored:true,revision:next,restoredFrom:body.targetRevision},200,cors);
      }
      if (url.pathname === '/v1/save' && request.method === 'PUT') {
        const len=Number(request.headers.get('content-length')||0);
        if(len>MAX_SAVE_BYTES) return json({error:'payload_too_large'},413,cors);
        const raw=await request.text();
        if(new TextEncoder().encode(raw).byteLength>MAX_SAVE_BYTES) return json({error:'payload_too_large'},413,cors);
        let body;
        try {body=JSON.parse(raw);}catch {return json({error:'invalid_json'},400,cors);}
        if(!body || typeof body!=='object' || Array.isArray(body) || !body.save || typeof body.save!=='object' || Array.isArray(body.save) || !Number.isInteger(body.expectedRevision) || body.expectedRevision<0 || !Number.isInteger(body.schemaVersion) || body.schemaVersion<1)
          return json({error:'invalid_save_request'},400,cors);
        const saveId=uid+':'+slot;
        const payload=JSON.stringify(body.save);
        const existing=await env.DB.prepare('SELECT revision FROM player_saves WHERE player_id=? AND slot_name=?').bind(uid,slot).first();
        if ((existing?.revision||0)!==body.expectedRevision) return json({error:'revision_conflict',currentRevision:existing?.revision||0},409,cors);
        const rev=body.expectedRevision+1, revisionId=crypto.randomUUID();
        const queries=[
          env.DB.prepare('INSERT OR IGNORE INTO player_accounts(player_id,auth_subject) VALUES(?,?)').bind(uid,uid)
        ];
        if(existing) {
          queries.push(env.DB.prepare('UPDATE player_saves SET revision=?,schema_version=?,save_data=?,checksum=NULL,updated_at=CURRENT_TIMESTAMP WHERE player_id=? AND slot_name=? AND revision=?').bind(rev,body.schemaVersion,payload,uid,slot,body.expectedRevision));
        } else {
          queries.push(env.DB.prepare('INSERT OR IGNORE INTO player_saves(save_id,player_id,slot_name,revision,schema_version,save_data) VALUES(?,?,?,?,?,?)').bind(saveId,uid,slot,rev,body.schemaVersion,payload));
        }
        // Only add history if the matching save revision was actually written.
        queries.push(env.DB.prepare('INSERT INTO save_revisions(revision_id,save_id,player_id,revision,schema_version,save_data) SELECT ?,save_id,player_id,revision,schema_version,save_data FROM player_saves WHERE player_id=? AND slot_name=? AND revision=? AND save_data=?').bind(revisionId,uid,slot,rev,payload));
        const result=await env.DB.batch(queries);
        if (result[1]?.meta?.changes!==1 || result[2]?.meta?.changes!==1) {
          const fresh=await env.DB.prepare('SELECT revision FROM player_saves WHERE player_id=? AND slot_name=?').bind(uid,slot).first();
          return json({error:'revision_conflict',currentRevision:fresh?.revision||0},409,cors);
        }
        return json({saved:true,revision:rev},200,cors);
      }
      return json({error:'not_found'},404,cors);
    } catch(error) {
      console.error('Cloud-save operation failed',String(error?.message||error));
      return json({error:'storage_unavailable'},503,cors);
    }
  }
};
