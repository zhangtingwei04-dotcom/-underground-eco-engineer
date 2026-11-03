export class ReleaseHistory {
    static RECORD_TYPES = {
        WILD_RELEASE: '原生棲地復歸',
        CONSERVATION_FACILITY: '保育安置',
        RESEARCH_STATION: '合作研究站',
        PERMANENT_CARE: '永久照護'
    };

    static recordPlacement(saveJson, creature, destinationType, notes) {
        saveJson.placement_records = saveJson.placement_records || [];

        const record = {
            id: 'placement_' + Date.now(),
            creatureId: creature.id,
            speciesId: creature.speciesId,
            morphId: creature.morphId,
            creatureName: creature.name || '無名小生命',
            destination: destinationType,
            timestamp: new Date().toISOString(),
            dateString: new Date().toLocaleDateString(),
            notes: notes,
            morphVisualTags: creature.visualTags || []
        };

        saveJson.placement_records.unshift(record);
        console.log(`【生態手札】已記錄生命去向 [${destinationType}]：`, record);
        return record;
    }
}