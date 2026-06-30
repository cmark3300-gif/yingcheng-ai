YC-AI v1.0 Stable 修復版

更新內容：
1. 修復 js/vocabulary.js 語法錯誤造成 vocabulary.html 空白問題。
2. 生字簿注音資料路徑改為 data/knowledge/chinese/zhuyin.json。
3. 保留「📚 使用目前教材」按鈕，可將目前教材的課文與生字帶入生字簿。
4. 保留波波注音生字簿 V10-B 功能：本課生字、套用生字、注音/國字/描紅/空白切換、列印/PDF。
5. 新增 backup/vocabulary_v10b_stable.js 作為穩定備份。

使用方式：
- 將此資料夾內所有檔案覆蓋到你的本機 GitHub 專案資料夾。
- 使用 GitHub Desktop：Commit to main → Push origin。
- 等待 GitHub Pages 更新後測試：
  https://cmark3300-gif.github.io/yingcheng-ai/vocabulary.html

建議測試流程：
1. 開啟 lesson.html 建立並儲存一份教材。
2. 進入 lesson-workspace.html。
3. 點「產生生字簿」。
4. 在 vocabulary.html 按「📚 使用目前教材」。
5. 確認課文與本課生字自動載入。
