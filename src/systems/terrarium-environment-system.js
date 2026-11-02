// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：生態箱獨立微氣候與環境模擬系統 (Terrarium Microclimate & Environment System)

export class TerrariumEnvironmentSystem {
  constructor() {
    // 預設基準環境數值
    this.baseEnvironment = {
      temperature: 24.0, // 攝氏度
      humidity: 50.0,    // 百分比 (%)
      lighting: 40.0,    // 光照度 (%)
      airQuality: 100.0  // 空氣品質 (%)
    };
  }

  /**
   * 計算並更新指定生態箱當前的微氣候環境
   * 根據箱內的植物、裝飾物及設備所帶來的環境加成進行總合運算
   */
  updateTerrariumEnvironment(terrarium, materialsCatalog) {
    if (!terrarium) return;

    // 重置為基礎環境值
    let temp = this.baseEnvironment.temperature;
    let humidity = this.baseEnvironment.humidity;
    let lighting = this.baseEnvironment.lighting;
    let airQuality = this.baseEnvironment.airQuality;

    // 結合所有植物的影響
    if (terrarium.plants && Array.isArray(terrarium.plants)) {
      terrarium.plants.forEach(plant => {
        const matData = materialsCatalog ? materialsCatalog.get(plant.materialId) : null;
        if (matData && matData.effects) {
          if (matData.effects.humidity_modifier) humidity += matData.effects.humidity_modifier;
          if (matData.effects.oxygen_production) airQuality += matData.effects.oxygen_production;
        }
      });
    }

    // 結合所有裝飾物與設備的影響 (如水盆、加溫洞穴等)
    if (terrarium.decorations && Array.isArray(terrarium.decorations)) {
      terrarium.decorations.forEach(dec => {
        const matData = materialsCatalog ? materialsCatalog.get(dec.materialId) : null;
        if (matData && matData.effects) {
          if (matData.effects.humidity_modifier) humidity += matData.effects.humidity_modifier;
          if (matData.effects.temperature_modifier) temp += matData.effects.temperature_modifier;
        }
      });
    }

    // 確保數值在合理的物理範圍內 (例如溫度 10~45°C，濕度 10~100%)
    terrarium.environment.temperature = Number(Math.max(10, Math.min(45, temp)).toFixed(1));
    terrarium.environment.humidity = Number(Math.max(10, Math.min(100, humidity)).toFixed(1));
    terrarium.environment.lighting = Number(Math.max(0, Math.min(100, lighting)).toFixed(1));
    terrarium.environment.airQuality = Number(Math.max(0, Math.min(100, airQuality)).toFixed(1));

    return terrarium.environment;
  }

  /**
   * 檢查當前生態箱的環境是否符合特定寵物的棲息需求
   */
  checkHabitatSuitability(terrarium, speciesRequirements) {
    if (!terrarium || !speciesRequirements) return { suitable: true, warnings: [] };

    const env = terrarium.environment;
    const warnings = [];
    let isSuitable = true;

    // 檢查溫度範圍
    if (speciesRequirements.ideal_temperature) {
      const { min, max } = speciesRequirements.ideal_temperature;
      if (env.temperature < min) {
        warnings.push(`溫度過低 (${env.temperature}°C)，建議低於理想值 (${min}°C)。`);
        isSuitable = false;
      } else if (env.temperature > max) {
        warnings.push(`溫度過高 (${env.temperature}°C)，高於理想值 (${max}°C)。`);
        isSuitable = false;
      }
    }

    // 檢查濕度範圍
    if (speciesRequirements.ideal_humidity) {
      const { min, max } = speciesRequirements.ideal_humidity;
      if (env.humidity < min) {
        warnings.push(`濕度過低 (${env.humidity}%)，可能導致脫皮異常。`);
        isSuitable = false;
      } else if (env.humidity > max) {
        warnings.push(`濕度過高 (${env.humidity}%)，增加皮膚感染風險。`);
        isSuitable = false;
      }
    }

    return { suitable: isSuitable, warnings: warnings };
  }
}

// 支援廣域掛載
if (typeof window !== 'undefined') {
  window.TerrariumEnvironmentSystem = TerrariumEnvironmentSystem;
}