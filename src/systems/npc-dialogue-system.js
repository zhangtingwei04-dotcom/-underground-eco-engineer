// 鱗片與種子：地下生態物語 | Scales & Seeds: Underground Ecosystem Tales
// 核心系統：NPC 動態記憶與對話系統 (NPC Dialogue System)

window.NPCDialogueSystem = {
    /**
     * 取得老馬克的動態對話
     */
    getMacDialogue: function(userSaveData) {
        if (!userSaveData.npc_memory) {
            userSaveData.npc_memory = {};
        }
        if (!userSaveData.npc_memory.old_mac) {
            userSaveData.npc_memory.old_mac = {
                has_met: false,
                celebrated_first_adult: false,
                noticed_speckles: false
            };
        }

        const memory = userSaveData.npc_memory.old_mac;
        const playerCreatures = userSaveData.owned_creatures || [];

        // 1. 初次見面
        if (!memory.has_met) {
            memory.has_met = true;
            return {
                speaker: "老馬克",
                text_zh: "喔！新面孔？歡迎來到《鱗片與種子》！我是老馬克。在這裡，我們對待每一個生命都像對待家人一樣小心翼翼。"
            };
        }

        // 2. 動態記憶：養出第一隻成年寵物
        const hasAdult = playerCreatures.some(c => c.life && c.life.life_stage === "adult");
        if (hasAdult && !memory.celebrated_first_adult) {
            memory.celebrated_first_adult = true;
            return {
                speaker: "老馬克",
                text_zh: "我注意到你照顧的小傢伙已經順利長大成體了！這需要極大的耐心與環境控制，你做得很棒，孩子！"
            };
        }

        // 3. 動態記憶：寵物顯現出特殊斑紋或白點
        const hasSpeckled = playerCreatures.some(c => c.phenotype && c.phenotype.has_speckles);
        if (hasSpeckled && !memory.noticed_speckles) {
            memory.noticed_speckles = true;
            return {
                speaker: "老馬克",
                text_zh: "天哪！你棲息箱裡那隻個體身上竟然長出了美麗的突變白點？這可真是不可思議的基因表現，圖鑑必須好好記錄下來！"
            };
        }

        // 4. 常規日常問候
        const dailyGreetings = [
            "今天底材的濕度剛剛好，新進的幾隻蛇類活力都很不錯呢！",
            "記得定期幫水盆換水，乾淨的水質是爬蟲健康的根本。",
            "如果有想找但架上沒有的品系，隨時來找我辦理【預購】，我會幫你聯繫熟識的繁殖者！"
        ];
        
        return {
            speaker: "老馬克",
            text_zh: dailyGreetings[Math.floor(Math.random() * dailyGreetings.length)]
        };
    }
};