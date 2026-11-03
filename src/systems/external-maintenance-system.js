// 鱗片與種子：地下生態物語 | 生態箱外部維護與外觀警示系統
// Scales & Seeds: Underground Ecosystem Tales - External Maintenance System

export class ExternalMaintenanceSystem {
    constructor() {
        // 外部髒汙與維護預設值
        this.GLASS_DIRT_RATE = 0.3; // 玻璃外框自然積灰率（每小時）
        this.VENT_CLOG_RATE = 0.25;  // 風扇外網積塵率（每小時）
    }

    /**
     * 更新生態箱外部狀態
     */
    updateExternalState(terrarium, elapsedHours) {
        terrarium.external = terrarium.external || {
            glassCleanliness: 100, // 玻璃乾淨度 (100 = 完全清澈)
            ventEfficiency: 100,   // 外部通風濾網效率 (100 = 完全通暢)
            warningTag: null       // 外部懸掛的警示吊牌
        };

        // 1. 隨時間降低玻璃外觀清晰度
        terrarium.external.glassCleanliness = Math.max(
            0, 
            terrarium.external.glassCleanliness - (this.GLASS_DIRT_RATE * elapsedHours)
        );

        // 2. 風扇濾網積灰（受內部髒汙影響，內部越髒積灰越快）
        const internalWasteFactor = (terrarium.wasteLevel || 0) / 100 + 1.0;
        terrarium.external.ventEfficiency = Math.max(
            0, 
            terrarium.external.ventEfficiency - (this.VENT_CLOG_RATE * internalWasteFactor * elapsedHours)
        );

        // 3. 根據內部異常狀態掛上外部警示吊牌
        terrarium.external.warningTag = this.determineWarningTag(terrarium);

        return terrarium.external;
    }

    /**
     * 計算外部渲染數值 (如霧氣透明度、外框霉斑 Alpha)
     */
    getExternalRenderData(terrarium) {
        const ext = terrarium.external || {};
        return {
            // 玻璃霧氣透明度 (0.0 ~ 0.8)
            fogOpacity: ((100 - ext.glassCleanliness) / 100) * 0.8,
            // 風扇運轉音效音量 (濾網越堵塞，發出越大的咔咔雜音)
            ventNoiseVolume: ext.ventEfficiency < 50 ? (100 - ext.ventEfficiency) / 100 : 0,
            // 警示標籤類型
            activeTag: ext.warningTag
        };
    }

    /**
     * 判定外部掛上的警示標籤
     */
    determineWarningTag(terrarium) {
        if (terrarium.wasteLevel >= 90) return "critical_waste";
        if (terrarium.hasMites) return "mites_alert";
        if (terrarium.humidity > 70 && terrarium.wasteLevel > 60) return "high_bacteria_alert";
        return null;
    }

    /**
     * 執行外部擦拭與清理動作
     */
    performExternalClean(terrarium, actionType) {
        terrarium.external = terrarium.external || {};

        if (actionType === "wipe_glass") {
            terrarium.external.glassCleanliness = 100;
            console.log("[ExternalSystem] 擦拭外側玻璃完成，視野恢復清澈！");
            return { success: true, message: "玻璃擦拭乾淨了，生態箱視野大幅提升！" };
        }

        if (actionType === "clean_vent") {
            terrarium.external.ventEfficiency = 100;
            console.log("[ExternalSystem] 清理外部風扇濾網完成！");
            return { success: true, message: "通風孔濾網灰塵已清除，空氣流動恢復正常！" };
        }

        return { success: false, message: "未知的外部清理動作。" };
    }
}

window.ExternalMaintenanceSystem = ExternalMaintenanceSystem;