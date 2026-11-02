// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：獨立生態箱管理系統 (Terrarium Management System)

export class TerrariumSystem {
  constructor(typeConfig) {
    if (typeConfig && typeConfig.terrariumTypes) {
      this.types = new Map(
        typeConfig.terrariumTypes.map(type => [type.id, type])
      );
      this.expansionRules = typeConfig.expansionRules;
    } else {
      this.types = new Map();
      this.expansionRules = null;
    }

    this.terrariums = new Map();
    this.activeTerrariumId = null;
  }

  loadTypesConfig(typeConfig) {
    if (typeConfig && typeConfig.terrariumTypes) {
      this.types = new Map(
        typeConfig.terrariumTypes.map(type => [type.id, type])
      );
      this.expansionRules = typeConfig.expansionRules;
    }
  }

  createTerrarium(id, typeId, customName = null) {
    if (!id || this.terrariums.has(id)) {
      throw new Error("Invalid or duplicate terrarium ID.");
    }

    const type = this.types.get(typeId);
    if (!type) {
      throw new Error(`Unknown terrarium type: ${typeId}`);
    }

    const terrarium = {
      id: id,
      typeId: typeId,
      name: customName || type.name_zh || "未命名生態箱",
      dimensions: { ...type.dimensions },
      gridSize: type.gridSize ? { ...type.gridSize } : { columns: 10, rows: 10 },
      creatures: [],
      plants: [],
      decorations: [],
      terrainGrid: this._initTerrainGrid(type.gridSize || { columns: 10, rows: 10 }),
      environment: {
        temperature: 24.0,
        humidity: 65.0,
        lighting: 50.0,
        airQuality: 100.0
      },
      stats: {
        totalDiggingActivity: 0,
        ecosystemBalanceScore: 100
      },
      createdAt: Date.now()
    };

    this.terrariums.set(id, terrarium);

    if (!this.activeTerrariumId) {
      this.activeTerrariumId = id;
    }

    return terrarium;
  }

  setActiveTerrarium(id) {
    if (!this.terrariums.has(id)) {
      return false;
    }
    this.activeTerrariumId = id;
    return true;
  }

  getActiveTerrarium() {
    return this.getTerrarium(this.activeTerrariumId);
  }

  getTerrarium(id) {
    return this.terrariums.get(id) ?? null;
  }

  getAllTerrariums() {
    return Array.from(this.terrariums.values());
  }

  expandTerrarium(id, newDimensions) {
    const terrarium = this.getTerrarium(id);
    if (!terrarium || !this.expansionRules) {
      return false;
    }

    const { minimumDimensions, maximumDimensions, step } = this.expansionRules;
    const axes = ["width", "depth", "height"];

    for (const axis of axes) {
      const value = newDimensions[axis];
      const current = terrarium.dimensions[axis];

      if (!Number.isFinite(value)) return false;
      if (value < current || value < minimumDimensions[axis]) return false;
      if (value > maximumDimensions[axis]) return false;
      if ((value - current) % step !== 0) return false;
    }

    terrarium.dimensions = { ...newDimensions };
    return true;
  }

  removeTerrarium(id) {
    const terrarium = this.getTerrarium(id);
    if (!terrarium) return false;

    // 防呆機制：若箱內還有寵物，禁止直接刪除
    if (terrarium.creatures && terrarium.creatures.length > 0) {
      console.warn("[TerrariumSystem] 無法刪除：該生態箱內仍有寵物棲息。");
      return { success: false, reason: "creatures_present" };
    }

    this.terrariums.delete(id);

    if (this.activeTerrariumId === id) {
      const keys = Array.from(this.terrariums.keys());
      this.activeTerrariumId = keys.length > 0 ? keys[0] : null;
    }

    return { success: true };
  }

  _initTerrainGrid(gridSize) {
    const cols = gridSize.columns || 10;
    const rows = gridSize.rows || 10;
    const grid = [];
    for (let c = 0; c < cols; c++) {
      grid[c] = [];
      for (let r = 0; r < rows; r++) {
        grid[c][r] = {
          layerType: r > 3 ? "humus_soil" : "air",
          density: 10,
          moisture: 50,
          isDug: false
        };
      }
    }
    return grid;
  }
}

if (typeof window !== 'undefined') {
  window.TerrariumSystem = TerrariumSystem;
}