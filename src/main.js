// 鱗片與種子：地下生態物語 | 遊戲主入口與初始化
// Scales & Seeds: Underground Ecosystem Tales - Main Entry

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        window.UndergroundScene,
        window.EncyclopediaScene,
        window.TerrariumSelectScene
    ]
};

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);
    window.gameInstance = game;
});