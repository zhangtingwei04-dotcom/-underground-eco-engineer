// 鱗片與種子：地下生態物語 | Scales & Seeds: Underground Ecosystem Tales
// 核心系統：快遞員艾米的動態記憶與郵寄系統 (Amy Dialogue System)

window.AmyDialogueSystem = {
    /**
     * 取得艾米的動態對話
     */
    getAmyDialogue: function(userSaveData) {
        if (!userSaveData.npc_memory) userSaveData.npc_memory = {};
        if (!userSaveData.npc_memory.amy) {
            userSaveData.npc_memory.amy = {
                total_packages_delivered: 0,
                first_delivery_completed: false,
                warned_deep_zone: false
            };
        }

        const memory = userSaveData.npc_memory.amy;

        // 1. 第一次成功簽收包裹時
        if (memory.total_packages_delivered > 0 && !memory.first_delivery_completed) {
            memory.first_delivery_completed = true;
            return {
                speaker: "艾米",
                text_zh: "嘿！簽收愉快！這可是我用專用恆溫背包一路從地面下保溫送來的活體包裹。有我在，你的小爬蟲絕對安全舒適！"
            };
        }

        // 2. 當玩家累積收到的包裹數量較多時
        if (memory.total_packages_delivered >= 5 && !memory.warned_deep_zone) {
            memory.warned_deep_zone = true;
            return {
                speaker: "艾米",
                text_zh: "我看你最近常常收包裹嘛！偷偷跟你說，最近深層岩脈那邊的氣壓有點不穩，如果你打算往那邊探索，箱子的加熱設備可得盯緊點喔！"
            };
        }

        // 3. 常規日常問候與情報
        const dailyGreetings = [
            "黃色夾克就是我的招牌！只要有溫控包裹，找我就對了！",
            "今天地下通道的風有點大，不過我的配送速度絕對準時！",
            "有新訂單或預購嗎？交給老娘，馬上幫你穩穩送到『新生物接收區』！"
        ];

        return {
            speaker: "艾米",
            text_zh: dailyGreetings[Math.floor(Math.random() * dailyGreetings.length)]
        };
    }
};