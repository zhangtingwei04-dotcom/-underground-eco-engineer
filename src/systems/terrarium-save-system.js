// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：生態箱獨立存檔與資料序列化系統 (Terrarium Save & Serialization System)

export class TerrariumSaveSystem {
  constructor(storageKey = "underground_eco_engineer_saves") {
    this.storageKey = storageKey;
  }

  /**
   * 序列化並儲存所有生態箱的狀態
   * 確保每個箱子的寵物、地形、環境與造景資料各自獨立，互不干擾
   */
  saveAllTerrariums(terrariumSystem) {
    if (!terrariumSystem || typeof terrariumSystem.getAllTerrariums !== 'function') {
      console.error("TerrariumSaveSystem: 傳入的 terrariumSystem 無效。");
      return false;
    }

    try {
      const allData = {
        version: 1,
        savedAt: Date.now(),
        activeTerrariumId: terrariumSystem.activeTerrariumId,
        terrariums: terrariumSystem.getAllTerrariums().map(terrarium => ({
          id: terrarium.id,
          typeId: terrarium.typeId,
          name: terrarium.name,
          createdAt: terrarium.createdAt,
          dimensions: { ...terrarium.dimensions },
          gridSize: { ...terrarium.gridSize },
          creatures: [...terrarium.creatures],       // 獨立箱內的寵物個體資料
          plants: [...terrarium.plants],             // 獨立箱內的植物生態
          decorations: [...terrarium.decorations],   // 自由擺放的岩石、洞穴與設備
          terrainGrid: JSON.parse(JSON.stringify(terrarium.terrainGrid)), // 深層地形陣列
          environment: { ...terrarium.environment }, // 獨立箱內的溫濕度與氣候
          stats: { ...terrarium.stats }              // 獨立箱內的生態統計
        }))
      };

      const serializedData = JSON.stringify(allData);
      localStorage.setItem(this.storageKey, serializedData);
      
      console.log(`[SaveSystem] 成功儲存 ${allData.terrariums.length} 個獨立生態箱資料。`);
      return true;
    } catch (error) {
      console.error("TerrariumSaveSystem 儲存失敗:", error);
      return false;
    }
  }

  /**
   * 載入並還原所有生態箱的狀態到 TerrariumSystem 中
   */
  loadTerrariums(terrariumSystem) {
    try {
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) {
        console.log("[SaveSystem] 找不到現有存檔，將使用預設初始狀態。");
        return false;
      }

      const parsedData = JSON.parse(rawData);
      if (!parsedData.terrariums || !Array.isArray(parsedData.terrariums)) {
        console.warn("[SaveSystem] 存檔格式異常，略過載入。");
        return false;
      }

      // 清空目前記憶體中的箱子
      terrariumSystem.terrariums.clear();

      // 逐一還原每個獨立生態箱
      parsedData.terrariums.forEach(savedData => {
        const terrarium = {
          id: savedData.id,
          typeId: savedData.typeId,
          name: savedData.name || "未命名生態箱",
          createdAt: savedData.createdAt || Date.now(),
          dimensions: savedData.dimensions,
          gridSize: savedData.gridSize,
          creatures: savedData.creatures || [],
          plants: savedData.plants || [],
          decorations: savedData.decorations || [],
          terrainGrid: savedData.terrainGrid || [],
          environment: savedData.environment || { temperature: 24, humidity: 65, lighting: 50 },
          stats: savedData.stats || { totalDiggingActivity: 0, ecosystemBalanceScore: 100 }
        };

        terrariumSystem.terrariums.set(terrarium.id, terrarium);
      });

      // 還原當前活躍箱體
      if (parsedData.activeTerrariumId && terrariumSystem.terrariums.has(parsedData.activeTerrariumId)) {
        terrariumSystem.activeTerrariumId = parsedData.activeTerrariumId;
      } else if (terrariumSystem.terrariums.size > 0) {
        terrariumSystem.activeTerrariumId = terrariumSystem.terrariums.keys().next().value;
      }

      console.log(`[SaveSystem] 成功載入 ${terrariumSystem.terrariums.size} 個獨立生態箱。`);
      return true;
    } catch (error) {
      console.error("TerrariumSaveSystem 載入失敗:", error);
      return false;
    }
  }

  /**
   * 清除所有生態箱存檔（用於重置遊戲或測試）
   */
  clearSave() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log("[SaveSystem] 已清除所有生態箱存檔。");
      return true;
    } catch (error) {
      console.error("TerrariumSaveSystem 清除存檔失敗:", error);
      return false;
    }
  }
}

// 支援廣域掛載
if (typeof window !== 'undefined') {
  window.TerrariumSaveSystem = TerrariumSaveSystem;
}