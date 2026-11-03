// 鱗片與種子：地下生態物語 | 生態箱系統實體管理器 (含防呆保護)
// Scales & Seeds: Underground Ecosystem Tales - Terrarium System

export class TerrariumSystem {
    constructor(terrariumData) {
        this.data = terrariumData || this.createDefaultTerrariumData();
    }

    createDefaultTerrariumData() {
        return {
            id: `terrarium_${Date.now()}`,
            name: "標準沙漠生態箱",
            type: "standard_desert",
            environment: {
                temperature: 28.0,
                humidity: 50.0,
                ventilation: 3,
                cleanliness: 100
            },
            creatures: [],
            plants: [],
            decorations: []
        };
    }

    updateEnvironment(deltaTime) {
        const env = this.data.environment;
        const creatureCount = this.data.creatures.length;
        const decayRate = 0.0001 * (1 + creatureCount * 0.5);
        
        env.cleanliness = Math.max(0, env.cleanliness - (decayRate * deltaTime));

        if (env.humidity > 40) {
            env.humidity = Math.max(40, env.humidity - (0.00005 * env.ventilation * deltaTime));
        }
    }

    addCreature(creature) {
        if (!creature || !creature.id) return false;
        this.data.creatures.push(creature);
        console.log(`[TerrariumSystem] 已將 ${creature.nickname || creature.species} 入住至 ${this.data.name}`);
        return true;
    }

    removeCreature(creatureId) {
        const index = this.data.creatures.findIndex(c => c.id === creatureId);
        if (index !== -1) {
            const removed = this.data.creatures.splice(index, 1)[0];
            console.log(`[TerrariumSystem] 已將 ${removed.nickname || removed.species} 安全移出 ${this.data.name}`);
            return removed;
        }
        return null;
    }

    cleanTerrarium() {
        this.data.environment.cleanliness = 100;
        console.log(`[TerrariumSystem] ${this.data.name} 已完成清理，潔淨度恢復至 100%`);
        return this.data.environment;
    }

    /**
     * 【防呆保護機制】檢查是否可以拆除或改建該生態箱
     * 確保箱內有生物或植物時，絕對無法直接拆除
     */
    canDismantle() {
        if (this.data.creatures && this.data.creatures.length > 0) {
            const creatureNames = this.data.creatures.map(c => c.nickname || c.species).join('、');
            return {
                success: false,
                reason: `無法拆除！此生態箱內仍有活體生物 [${creatureNames}]。請先安全轉移牠們！`
            };
        }

        if (this.data.plants && this.data.plants.length > 0) {
            return {
                success: false,
                reason: '無法拆除！生態箱內仍有活體植物，請先清理或回收。'
            };
        }

        return { success: true, reason: '環境安全，可以進行改建或拆除。' };
    }

    toJSON() {
        return this.data;
    }
}

window.TerrariumSystem = TerrariumSystem;