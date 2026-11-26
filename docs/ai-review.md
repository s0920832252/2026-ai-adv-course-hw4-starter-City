# AI Review 修正記錄：訂單、付款、運費與購物車

更新日期：2026-11-26

本文件根據 security-reviewer 與 code-reviewer 的檢查結果修正程式，並記錄 test-runner 要求的 unit 與 integration 測試結果。

## 問題與修正

### 1. 訂單詳情未驗證訂單所有權

- **類別：** 資安／測試缺口（原嚴重度：高）
- **問題描述：** 已登入會員只要取得別人的訂單 ID，就可讀取收件資料和品項。
- **使用者重現方式：** 會員 A 建立訂單；會員 B 使用自己的 JWT 呼叫 `GET /api/orders/{A 的訂單 ID}`。
- **問題點：** 原本 `src/routes/orderRoutes.js` 以 `findOrderById` 只依訂單 ID 查詢。
- **建議解決方式與修正：** 已改為 `findOrderForUser(id, req.user.userId)`，非本人訂單回 404；`tests/orders.test.js` 新增跨會員存取測試。
- **狀態：** 已修正並驗證。

### 2. 購物車數量更新未驗證正整數

- **類別：** 輸入驗證／邏輯／測試缺口（原嚴重度：中）
- **問題描述：** PATCH 路由原本只拒絕 `NaN`，小數會被存入購物車，零或負數可能觸發資料庫錯誤並回 500。
- **使用者重現方式：** 對自己的購物車項目呼叫 `PATCH /api/cart/{itemId}`，傳入 `{"quantity":1.5}`、`{"quantity":0}` 或負數。
- **問題點：** 原本 `src/routes/cartRoutes.js` 的 PATCH 數量驗證沒有使用共用正整數驗證器。
- **建議解決方式與修正：** 已使用 `parsePositiveInteger`，無效數量回 400；新增小數、零、負數、非法字串和超庫存測試至 `tests/cart.test.js`。
- **狀態：** 已修正並驗證。

### 3. 免運門檻剛好 1,500 元時仍收基本運費

- **類別：** 邏輯／測試缺口（原嚴重度：中）
- **問題描述：** 原本以 `subtotal > 1500` 判斷免基本運費，剛好 1,500 元仍收費；前端規則和測試預期是滿 1,500 元免基本運費。
- **使用者重現方式：** 建立小計恰為 1,500 元的宅配或超商取貨訂單，原本仍會收基本運費。
- **問題點：** `src/utils/shipping.js` 的免運判斷使用嚴格大於；`tests/shipping.test.js` 的 1,500 元邊界測試原本被略過。
- **建議解決方式與修正：** 已改用 `>=`，並恢復邊界測試。
- **狀態：** 已修正並驗證。

### 4. 付款查詢回應未強制要求簽章

- **類別：** 資安／付款完整性／測試缺口（原嚴重度：低，縱深防禦）
- **問題描述：** 已付款狀態的綠界查詢回應若缺少 `CheckMacValue`，原本仍可能在交易編號與金額相符時被接受。
- **使用者重現方式：** QueryTradeInfo 回傳 `TradeStatus=1`、正確交易編號和金額，但不帶 `CheckMacValue`。
- **問題點：** 原本 `src/services/paymentService.js` 只在簽章欄位存在時才驗簽。
- **建議解決方式與修正：** 已要求簽章存在且驗證成功；`tests/integration/order-checkout.integration.test.js` 新增缺少簽章案例，確認訂單維持 pending。
- **狀態：** 已修正並驗證。

### 5. 付款表單頁未檢查登入或訂單所有權

- **類別：** 資安／權限（原嚴重度：低至中）
- **問題描述：** 知道 pending 訂單 ID 的訪客原本可取得該訂單的綠界付款表單。
- **使用者重現方式：** 未登入時開啟 `/ecpay/payment/{pending 訂單 ID}`。
- **問題點：** 原本 `src/routes/pageRoutes.js` 只依訂單 ID 和狀態回傳付款表單，未驗證存取憑證。
- **建議解決方式與修正：** 訂單建立 API 現在回傳 15 分鐘有效的付款憑證。憑證以 JWT 簽署並綁定訂單 ID、訂單所有者、用途和 audience；付款頁缺少或提供無效／過期憑證時回 403。結帳頁改帶憑證導向付款頁，並設定 `Cache-Control: no-store` 與 `Referrer-Policy: no-referrer`。新增有效、無效、跨訂單、跨使用者及過期憑證測試。
- **狀態：** 已修正並驗證。

## 測試結果

- `npm run test:unit`：8 個測試檔通過，58 項通過，0 失敗。
- `npm run test:integration`：1 個測試檔通過，10 項通過，0 失敗。
- Vitest 顯示 Vite CJS Node API deprecated 警告，未影響測試結果。
