// 鱗片與種子｜正式主畫面版面設定 (V4)
// 直式／橫式各自獨立；正式遊戲與編輯器共用。
// X 是相對原始水平位置的「螢幕寬度比例偏移」：0 = 不偏移。
// scale = 1 表示原始圖片／按鈕尺寸。
export const PORTRAIT_MENU_LAYOUT = Object.freeze({
    titleY: 0.14,
    firstButtonY: 0.375,
    titleX: 0,
    buttonX: 0,
    titleScale: 1,
    buttonScale: 1,
    languageX: 0,
    languageY: 0,
    languageScale: 1,
    settingsX: 0,
    settingsY: 0,
    settingsScale: 1
});
export const LANDSCAPE_MENU_LAYOUT = Object.freeze({
    titleY: 0.19,
    firstButtonY: 0.40,
    titleX: 0,
    buttonX: 0,
    titleScale: 1,
    buttonScale: 1,
    languageX: 0,
    languageY: 0,
    languageScale: 1,
    settingsX: 0,
    settingsY: 0,
    settingsScale: 1
});
