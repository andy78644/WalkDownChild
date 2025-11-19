# 小朋友下樓梯 (NS-Shaft Web)

這是一個使用 HTML5 Canvas、CSS 和 JavaScript 製作的經典遊戲「小朋友下樓梯」網頁版。

## 遊戲說明

### 操作方式
-   **開始遊戲**：在主畫面點擊難度按鈕（簡單、普通、困難）。
-   **移動**：使用鍵盤 **← 左箭頭** 和 **→ 右箭頭** 控制角色移動。
-   **重新開始**：遊戲結束後，點擊「回到主選單」按鈕。

### 遊戲規則
-   目標是盡可能往下跳，生存越久越好。
-   **生命值 (HP)**：
    -   碰到上方尖刺：扣 5 點 HP。
    -   踩到尖刺踏板：扣 5 點 HP。
    -   踩到普通/輸送帶踏板：緩慢恢復 HP。
    -   掉落到螢幕下方：直接遊戲結束。
-   **踏板種類**：
    -   **普通踏板 (灰色)**：安全。
    -   **尖刺踏板 (深灰帶刺)**：受傷。
    -   **輸送帶 (藍/橘)**：會將你向左或向右推（逆向行走會變慢）。
    -   **彈簧踏板 (綠色)**：會將你彈高。
    -   **翻轉踏板 (淺灰)**：踩到後會消失（陷阱）。

## 部署方式 (Deployment)

你可以將此遊戲免費部署到以下平台：

### 1. GitHub Pages (推薦)
如果你有 GitHub 帳號：
1.  將此專案上傳到一個新的 GitHub Repository。
2.  進入 Repository 的 **Settings** > **Pages**。
3.  在 **Source** 選擇 `main` branch 並儲存。
4.  幾分鐘後，你就會獲得一個網址 (例如 `username.github.io/repo-name`)。

### 2. Vercel
適合快速部署：
1.  註冊 [Vercel](https://vercel.com/)。
2.  安裝 Vercel CLI (`npm i -g vercel`) 或直接在網頁上操作。
3.  將專案資料夾拖曳到 Vercel Dashboard，或是使用 CLI 輸入 `vercel` 指令。
4.  **設定選項**：
    -   **Framework Preset**: 選擇 `Other` 或 `None` (因為這是純靜態網頁，不需要框架設定)。
    -   **Build Command**: 留空。
    -   **Output Directory**: 留空 (或是預設)。
5.  點擊 **Deploy**，它會自動偵測並提供一個 `.vercel.app` 的網址。

### 3. Netlify
類似 Vercel，非常簡單：
1.  註冊 [Netlify](https://www.netlify.com/)。
2.  登入後，直接將整個專案資料夾 **拖曳 (Drag & Drop)** 到 Netlify 的 "Sites" 頁面。
3.  幾秒鐘後就會生成一個網址。

### 4. 直接開啟
由於這是純靜態網頁，你也可以直接雙擊 `index.html` 在瀏覽器中遊玩（僅限本機）。

## 常見問題 (Troubleshooting)

### 部署後出現 404 錯誤？
這通常是因為 Vercel 找不到 `index.html` 檔案。請檢查以下設定：

1.  **Root Directory (根目錄)**：
    -   如果你是將整個專案資料夾上傳，確保 `index.html` 就在最外層。
    -   如果你是透過 Git 部署，且檔案在子資料夾內（例如 `game/下樓梯`），你需要到 Vercel 的 **Settings** > **General** > **Root Directory**，輸入檔案所在的資料夾路徑（例如 `game/下樓梯`）。
2.  **檔案名稱**：確保主檔案名稱是 `index.html`（全小寫）。
