# V0.9U｜真正依體型移動的骨架，直接驅動同尺寸透明頭身網格

日期：2026-11-13（Asia/Taipei）。狀態：**公開中立工程原型，已通過 GitHub Actions 來源測試；未導入正式私人遊戲。**

## 核心問題與這一版確實完成的改進

V0.9T 已首次讓四種合成大小的 24 節骨架以**各自真正的 23 段骨長、局部半徑與上一幀來源狀態**獨立移動，不再逐幀放大／縮小同一段成體來源影格；但它先前只檢查膠囊代理、場景和高度場，**沒有直接驅動 V0.9Q/R/S 的可見透明網格**。以前 V0.9Q/R/S 的頭身網格測試依然以固定成人 V0.9C 來源為每幀起點，不能代表真正不同大小的蛇自己行走。

**V0.9U 已建立真正的接合：V0.9T 當前體型的 24 節 pose → V0.9Q 共同頭身半徑／透明身體 93 圈 → V0.9R 共用 16 個頸部頂點的八圈中立頭部 → V0.9S 完整 3,216 三角面的靜態與跨幀檢查**。每幀的網格生成不再呼叫 V0.9P 或原成人 V0.9C 重新放大來源，V0.9T 只在初始化時使用 V0.9P 取得合格的獨立體型起始姿態。

## 實際變更

- [V0.9U 真體型網格動態橋接程式 `snake-sized-mesh-motion-v09u.mjs`](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-sized-mesh-motion-v09u.mjs)
  - `buildSnakeSizedMeshCandidateV09u` 對目前真 V0.9T 姿勢建立可見 head/body 中立透明 mesh，驗證 V0.9S 靜態三角面，不含認證來源的權力。
  - `inspectSnakeSizedMeshStepV09u` 不信任外傳的 `frame+1`：它從原上一幀 V0.9T 狀態重新呼叫既有獨立尺寸骨架控制器，核對來源下一幀姿勢、23 段真骨長、24 局部半徑、場景 ID/revision/內容簽章、動作相位、速度、移動朝向、幀號；只有重播一致、頭轉幅度合理且首尾整個頭身網格靜態合格，才執行 V0.9S 全身三角面跨幀診斷。**只回報判定、0 個正式 source frames 被提交**。
  - `previewSnakeSizedMeshMotionV09u` 對同一個真 V0.9T 來源連續提出每個實際尺寸的移動，逐幀做來源重播及全網格檢查；如果有任何尺寸／表面／頭／地形問題，就停止並回報**第一個失敗幀**，不假裝成功、不改動原始姿勢。
- [V0.9Q 中立網格模組](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-shared-body-geometry-v09q.mjs)：額外新增 `buildSnakeSharedBodyFromActualSizedPoseV09u`，**直接以 V0.9T 來源姿態和局部粗細**建立 1,488 頂點／93 截面 body/collider 代理，23 段骨長誤差超限、網格半徑錯位或網格頂點穿地直接拒絕。舊 V0.9Q 原函式保留。
- [V0.9R 頭頸模組](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-head-neck-seam-v09r.mjs)：額外新增 `buildSnakeHeadNeckFromSizedSharedV09u`，從**同一個 V0.9T body 來源**重用 V0.9R 八圈中立頭部、原第一圈 16 頂點的 indexed 頸部接口和頭部對玻璃／石頭／非鄰近自己身體的安全檢查。
- [V0.9S 全三角面模組](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/src/ohm-core/snake-swept-mesh-contact-v09s.mjs)：保留舊固定尺寸 V0.9R 原驗證入口，額外允許**正規完整 V0.9U 頭身網格候選**進行既有的七點／三角面高度場、非鄰近 3D 表面、全部三角面保守 swept AABB 和 3 時間切片的接觸檢查。**不是新增完整連續 3D triangle-vs-triangle 求解器**。
- [V0.9U 真尺寸網格回歸測試](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/blob/main/qa/snake-motion/tests/snake-sized-mesh-motion-v09u.test.mjs)：四合成階段的獨立 V0.9T start、真正 0→1 source 步，及各自 12 個 V0.9T 真尺寸 shadow source steps；檢查不同體長和半徑對網格的影響、V0.9Q 共用資料引用、V0.9R 頸部接口、V0.9S 頭身完整三角面；刻意偽造下一個 24 節姿勢、偷偷改第 6 節粗細、瞬間轉頭、使用不同場景、身體不碰但中立頭部超前碰石塊，全部必須安全拒絕。

## 已驗證結果

**[GitHub Actions #43337340272](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43337340272)：8/8 個工作成功**。在新 V0.9U 測試中，四種體型的原移動來源／頭身網格／全三角面結果皆成功；其他 Chrome 工作屬 V0.9F/V0.9D 等既有版本的畫面回歸，**不是 V0.9U 新網格的獨立雙橫式或 iPhone Safari 視覺驗收**。

| 合成尺寸階段 | 實際 V0.9T 體長（world units） | 各自來源連續透明網格 | 期間最大網格頂點步距 | 最低取樣三角面對地間隙 |
|---|---:|---:|---:|---:|
| 幼體 | 1.140 | 12/12 | 0.003176 | 0.003500015 |
| 成長中 | 1.710 | 12/12 | 0.003205 | 0.003500022 |
| 成體 | 2.280 | 12/12 | 0.003241 | 0.003500010 |
| 大型成體 | 2.964 | 12/12 | 0.003283 | 0.003500076 |

每一尺寸候選皆有 **1,617 頂點、3,216 三角面**。每一相鄰影格測試要求完整 V0.9S `checkedSweptFaces=3216`、`surfaceHeightfieldSamples=3216×4×3`、V0.9T 真來源重播對得上。其頭頸為中立網格接合代理，**未**視作真蛇物種完成的頭型或皮膚。

## 必須保留的限制

1. **這次才第一次讓真正尺寸化的 24 節骨架直接驅動完整透明網格。** 測試通過的是小型平坦中立場景、12 個連續來源步、有限角度，而不是已通過長期複雜石塊／森林／洞穴、盤繞疊身的全 3D 運動，更不是確定已經能完成 V0.9J/M 的「整條蛇返家」。
2. **V0.9U 舊版 Q/R 的內部新增幾何入口仍是候選，不代表可讓任何傳入的 JS 物件自動成為真實授權來源。** 唯有 `inspectSnakeSizedMeshStepV09u` 對上一幀 V0.9T 做重播及新完整網格檢查，才能作為候選驗收；沒有密碼學身分驗證／正式玩家存檔權限。
3. V0.9S 以**有限時間切片、有限三角面內點取樣**與保守場景 swept AABB 檢查；不等於完整連續時間三角面掃掠、精確細縫碰撞與真實地面牽引力／肌肉受力，還需深化擠壓、接觸、過密頭頸與身體層疊。
4. 目前不同體型**分別啟動並運動**，還未讓同一蛇在運動途中逐步加長或增粗並保持骨架及網格連續性。現在已用的 1.14/1.71/2.28/2.964 僅為工程測試倍率，**不是任一真實或虛構物種已完成審定的生物成長曲線**。
5. 沒有進入原私人遊戲的 Phaser render scene、UI、離線存檔、Supabase、NPC、外皮與生態系統；`gameplayMotionAuthorized=false`、`skinApplied=false`、`saveModified=false`。私人原創資產和世界觀不得移到公開中立 QA。

**下階段**：提升各種尺寸 V0.9T→V0.9U 真來源長時彎曲／尾隨與多障礙壓測，對每次頭頸過彎與表面碰撞做動態觀察；再處理同一個個體移動中慢慢長大、進出躲藏洞的有限接觸和專屬橫式 Chrome/iPhone Safari 畫面驗收。仍然不加外皮、不把未審核的中立代理說成正式成品。
