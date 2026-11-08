// 《鱗片與種子》生態箱觀察互動：只陳述實際存檔可確認的資料。
// Pure data reader (except writing observation log through caller); no invented animal behaviours.
export function getObservationSummary(gameState, activeId) {
  const boxes = Array.isArray(gameState?.terrariums) ? gameState.terrariums : [];
  const box = boxes.find(t => t?.id === activeId) || boxes[0];
  if (!box) return {ok:false,message:'目前沒有可觀察的生態箱。'};
  const env = box.environment || {};
  const creatures = Array.isArray(box.creatures) ? box.creatures : [];
  const clean = typeof env.cleanliness==='number' && Number.isFinite(env.cleanliness) ? env.cleanliness : null;
  const temperature = typeof env.temperature==='number' && Number.isFinite(env.temperature) ? env.temperature : null;
  const humidity = typeof env.humidity==='number' && Number.isFinite(env.humidity) ? env.humidity : null;
  const lines = [];
  if(temperature!==null) lines.push('溫度 '+temperature+'°C');
  if(humidity!==null) lines.push('濕度 '+humidity+'%');
  if(clean!==null) lines.push('潔淨度 '+clean+'%');
  const name = typeof box.name==='string' && box.name.trim() ? box.name.trim() : '未命名生態箱';
  const count = creatures.length;
  const message = '觀察「'+name+'」：目前記錄 '+count+' 隻生物'+(lines.length?'；'+lines.join('、'):'；環境數值尚未記錄')+'。';
  return {ok:true,message,terrariumId:box.id||null,creatureCount:count,temperature,humidity,cleanliness:clean};
}
