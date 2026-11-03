export class HealthScreening {
    static screenHealth(creature) {
        // 檢查健康值與是否處於染病/虛弱狀態
        if (creature.health < 80 || creature.stress > 40) {
            return {
                approved: false,
                message: '艾咪（獸醫 NPC）檢查後搖了搖頭：「這孩子目前的身體狀況或壓力指數還不夠穩定，貿然送往野外或安置點會有風險，需要再調養一段時間。」'
            };
        }

        if (creature.isShedding) {
            return {
                approved: false,
                message: '老莫看了一眼說道：「正準備要脫皮呢，等這段脆弱期過去、狀態完全恢復後再來考慮吧。」'
            };
        }

        return {
            approved: true,
            message: '經過詳細的健康與寄生蟲篩檢，各項生理指標皆顯示健康良好，符合進一步處置標準。'
        };
    }
}