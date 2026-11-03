export class ReunionEventSystem {
    /**
     * 當玩家在野外探索或採集時，低機率觸發重逢彩蛋
     */
    static checkReunion(saveJson, currentRegionId) {
        if (!saveJson.placement_records || saveJson.placement_records.length === 0) return null;

        // 篩選出曾經在「原生棲地復歸」且地區符合的個體
        const eligibleRecords = saveJson.placement_records.filter(
            r => r.destination === '原生棲地復歸' && r.regionId === currentRegionId && !r.hasReunited
        );

        if (eligibleRecords.length === 0) return null;

        // 設定較低的觸發機率（例如每次探索有 5% 機率）
        if (Math.random() > 0.05) return null;

        // 隨機挑選一隻老朋友
        const oldFriend = eligibleRecords[Math.floor(Math.random() * eligibleRecords.length)];
        
        // 標記已經重逢過，避免頻繁重複觸發
        oldFriend.hasReunited = true;

        return {
            triggered: true,
            flavorText: `「等等……剛才那片蕨葉後方，是不是閃過一道熟悉的斑紋？」\n遠遠望去，那獨特的花紋與身形，真的很像以前陪伴過的那位老朋友。\n「或許只是巧合，但牠看起來在野外過得很好。」`
        };
    }
}