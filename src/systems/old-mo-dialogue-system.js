// 鱗片與種子：地下生態物語 | Scales & Seeds: Underground Ecosystem Tales
// 核心系統：探險家老莫的動態記憶與深層事件系統 (Old Mo Dialogue System)

window.OldMoDialogueSystem = {
    getMoDialogue: function(userSaveData) {
        if (!userSaveData.npc_memory) userSaveData.npc_memory = {};
        if (!userSaveData.npc_memory.old_mo) {
            userSaveData.npc_memory.old_mo = {
                has_met_mo: false,
                unlocked_deep_layer: false,
                sent_mystery_box: false
            };
        }

        const memory = userSaveData.npc_memory.old_mo;

        // 1. 初次在地下深處或透過神祕信件相遇
        if (!memory.has_met_mo) {
            memory.has_met_mo = true;
            return {
                speaker: "老莫",
                text_zh: "……（擦拭著手中的古老琥珀）地上的人總是只看得到表面。真正珍貴的鱗片與生命，藏在連陽光也照不到的岩脈深處。你好啊，年輕的生態工程師。"
            };
        }

        // 2. 當玩家培育出高級稀有品系或解鎖深層區域時
        const ownedCreatures = userSaveData.owned_creatures || [];
        const hasRareOrSenior = ownedCreatures.some(c => c.life && c.life.age >= 10);
        
        if (hasRareOrSenior && !memory.sent_mystery_box) {
            memory.sent_mystery_box = true;
            return {
                speaker: "老莫",
                text_zh: "我聽老馬克提過你的表現。看來你對遺傳學有些天分……這塊從深層岩脈帶回來的『遠古神祕蛋包裹』就寄給你吧，去看看能孵出什麼好東西。"
            };
        }

        // 3. 常規神祕問候
        const dailyGreetings = [
            "岩石會說話，只要你懂得聆聽牠們的紋理。",
            "深層的溫度比你想得要穩定得多……前提是你知道如何控制它。",
            "……（老莫隻字未提，只是默默交給你一張泛黃的古老基因圖譜線索）"
        ];

        return {
            speaker: "老莫",
            text_zh: dailyGreetings[Math.floor(Math.random() * dailyGreetings.length)]
        };
    }
};