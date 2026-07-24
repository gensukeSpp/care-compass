# Implementation Plan: Dashboard and Board Selection

## TL;DR
ログイン後に「どのボードを表示するか」を選択できるダッシュボード画面を実装します。また、ヘッダーにダッシュボードへ戻るリンクを追加し、ボードの切り替えを容易にします。

---

## 現状の課題
1.  **即時表示:** ログイン後、最初のボードが自動選択されるか、なければ作成画面に直行するため、複数のボードを持つユーザーが選択する余地がない。
2.  **切り替え不可:** 一度ボードに入ると、他のボードに切り替える手段（UI）がない。

---

## 修正案

### 1. ダッシュボード画面の新規作成 (`src/pages/DashboardPage.tsx`)
-   **機能:**
    -   ユーザーがアクセス可能なプロファイル (`currentProfiles`) を一覧表示。
    -   各プロファイルをカード形式で表示し、クリックで選択（`currentProfileId` を設定してボード画面へ遷移）。
    -   「新しいボードを作成」ボタンを設置（既存の `CreateProfileModal` を呼び出すか、専用のカードを表示）。
-   **UI:** Tailwind CSS を使用した清潔感のあるグリッドレイアウト。

### 2. ルーティングと遷移ロジックの変更 (`src/App.tsx`)
-   **ルート追加:** `/dashboard` を追加。
-   **自動遷移:**
    -   ログイン済みで `currentProfileId` が `null` の場合、自動的に `/dashboard` へリダイレクト。
    -   未ログイン時はログイン画面（現在の `BoardPage` の未ログイン状態）を表示。

### 3. ヘッダーの更新 (`src/App.tsx`)
-   **ナビゲーション:**
    -   ログイン済みの場合、「ボード一覧」または「🏠」アイコンのリンクをヘッダーに追加。
    -   クリック時に `deselectProfile()` を実行し `/dashboard` へ遷移。

### 4. 認証ストアの調整 (`src/store/useAuthStore.ts`)
-   **自動選択の廃止:** `checkAuth` 内での「最初のプロファイルを自動選択」するロジックを削除（またはオプション化）。
-   **アクション追加:** `deselectProfile` ( `currentProfileId` を `null` に戻す) を追加。

### 5. ボード画面の簡略化 (`src/components/board/BoardPage.tsx`)
-   **役割の整理:** ボード画面は「選択されたプロファイルがあること」を前提とし、なければダッシュボードへ誘導するガードを配置。

---

## ステップ

### Step 1: Auth Store の修正
-   `deselectProfile` アクションの追加。
-   `checkAuth` 時の自動選択を解除。

### Step 2: DashboardPage コンポーネントの作成
-   `currentProfiles` を表示する UI 実装。
-   選択・作成のハンドリング。

### Step 3: ルーティングとヘッダーの統合
-   `App.tsx` で `/dashboard` を定義。
-   ヘッダーにリンクを追加。
-   `/` アクセス時の振り分けロジック実装。

---

## 対象ファイル
-   `src/store/useAuthStore.ts`
-   `src/pages/DashboardPage.tsx` (新規)
-   `src/App.tsx`
-   `src/components/board/BoardPage.tsx`
-   `src/components/common/CreateProfileModal.tsx` (再利用)

---

## 検証ステップ
1.  **ログイン:** ログイン後、ボード一覧が表示されること。
2.  **選択:** ボードを選択すると、そのボードの内容が表示されること。
3.  **切り替え:** ヘッダーのリンクからダッシュボードに戻り、別のボードを選択できること。
4.  **新規作成:** ダッシュボードから新しいボードを作成し、作成後にそのボードが表示されること。
