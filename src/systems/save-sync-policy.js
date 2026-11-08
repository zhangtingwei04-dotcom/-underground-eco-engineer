// 《鱗片與種子》跨裝置同步決策（純函式，不會寫入任何存檔）
// cloud revision is authoritative for cloud history; local dirty work is never silently discarded.
export function decideSaveSync({ localSave, localBaseRevision, localDirty, remote }) {
  if (!remote?.success) return {action:'pause',reason:'cloud_unavailable'};
  const cloud=remote.data;
  if (typeof cloud?.found!=='boolean') return {action:'pause',reason:'invalid_cloud_response'};
  const revision=cloud.found?cloud.revision:0;
  if(!Number.isSafeInteger(revision)||revision<0) return {action:'pause',reason:'invalid_revision'};
  if(localBaseRevision!==null && localBaseRevision!==undefined &&
     (!Number.isSafeInteger(localBaseRevision)||localBaseRevision<0))
    return {action:'pause',reason:'invalid_local_base'};
  const localExists=!!localSave && typeof localSave==='object' && !Array.isArray(localSave);
  // An untracked local save might be from an older installation. Never overwrite it.
  if(localExists && (localBaseRevision===null || localBaseRevision===undefined))
    return {action:'needs_choice',reason:'untracked_local_save',remoteRevision:revision};
  if(!localExists) return cloud.found
    ? {action:'download',remoteRevision:revision}
    : {action:'new_game',remoteRevision:0};
  if(localDirty && localBaseRevision!==revision)
    return {action:'needs_choice',reason:'diverged_versions',remoteRevision:revision};
  if(localDirty) return {action:'upload_with_revision_check',expectedRevision:revision};
  if(localBaseRevision!==revision)
    return {action:'download',remoteRevision:revision};
  return {action:'unchanged',remoteRevision:revision};
}
