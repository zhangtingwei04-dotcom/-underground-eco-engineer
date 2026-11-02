// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：生態箱自由造景與建造系統 (Terrarium Building & Placement System)

export class TerrariumBuildingSystem {
  constructor() {
    // 預先載入或定義可建造的物品清單 (對應 terrarium-materials.json)
    this.materialsCatalog = new Map();
  }

  /**
   * 載入造景材料庫設定
   */
  loadMaterialsCatalog(materialsJson) {
    if (materialsJson && materialsJson.materials) {
      materialsJson.materials.forEach(mat => {
        this.materialsCatalog.set(mat.id, mat);
      });
    }
  }

  /**
   * 在指定生態箱內放置自由佈置物件（岩石、洞穴、植物、設備）
   * @param {Object} terrarium - 目標生態箱實例
   * @param {String} materialId - 材料 ID (例如 "slate_rock_cave", "fern_plant")
   * @param {Number} x - 放置的 X 座標 (cm)
   * @param {Number} y - 放置的 Y 座標 (cm)
   * @param {Object} options -額外屬性 (如旋轉角度、尺度)
   */
  placeItem(terrarium, materialId, x, y, options = {}) {
    if (!terrarium) {
      console.error("[BuildingSystem] 目標生態箱不存在。");
      return { success: false, reason: "terrarium_not_found" };
    }

    // 檢查箱體尺寸邊界
    const dims = terrarium.dimensions;
    if (x < 0 || x > dims.width || y < 0 || y > dims.height) {
      console.warn("[BuildingSystem] 放置位置超出箱體邊界。");
      return { success: false, reason: "out_of_bounds" };
    }

    const uniqueId = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const newItem = {
      instanceId: uniqueId,
      materialId: materialId,
      x: x,
      y: y,
      rotation: options.rotation || 0,   // 旋轉角度 (0, 90, 180, 270)
      scale: options.scale || 1.0,       // 縮放比例
      placedAt: Date.now()
    };

    // 將物件加入該生態箱的裝飾/植物清單
    if (this._isPlant(materialId)) {
      terrarium.plants.push(newItem);
    } else {
      terrarium.decorations.push(newItem);
    }

    console.log(`[BuildingSystem] 成功在箱體 [${terrarium.id}] 放置物件: ${materialId} 於 (${x}, ${y})`);
    return { success: true, item: newItem };
  }

  /**
   * 移除指定生態箱內的造景或植物
   */
  removeItem(terrarium, instanceId) {
    if (!terrarium) return false;

    // 從裝飾中尋找並移除
    const decIndex = terrarium.decorations.findIndex(item => item.instanceId === instanceId);
    if (decIndex !== -1) {
      terrarium.decorations.splice(decIndex, 1);
      return true;
    }

    // 從植物中尋找並移除
    const plantIndex = terrarium.plants.findIndex(item => item.instanceId === instanceId);
    if (plantIndex !== -1) {
      terrarium.plants.splice(plantIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * 內部輔助判斷：是否為植物類材料
   */
  _isPlant(materialId) {
    return materialId.includes("plant") || materialId.includes("moss") || materialId.includes("fern");
  }
}

// 支援廣域掛載
if (typeof window !== 'undefined') {
  window.TerrariumBuildingSystem = TerrariumBuildingSystem;
}