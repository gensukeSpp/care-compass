# SRP Review: `src/components/layout/Header.tsx`

## 1. 責務の特定 (Responsibility Identification)

現在の `Header` コンポーネントは、以下の複数の責務を同時に担っています。

1.  **レイアウト定義**: ヘッダーのHTML構造、Tailwind CSSによるスタイル、レスポンシブな配置の制御。
2.  **メニューのUI状態管理**: ドロップダウンメニューの開閉状態（`menuOpen`）、およびクリック/キーボードイベントによるメニュー閉鎖処理。
3.  **条件付きレンダリングロジック**: ログイン状態、ユーザーの所有権、プロファイルの有無に基づいた、ヘッダー内の要素（ボタン、リンク、メニュー全体）の出し分け。
4.  **コンポーネントの構成/統合**: 下位コンポーネント (`DashboardLink`, `InviteAction`, `LoginButton`, `LogoutButton` 等) の組み立て。

## 2. SRP 違反の特定 (SRP Violation)

`Header` コンポーネントは以下の点で「単一責任の原則 (SRP)」に違反しています。

*   **UIロジックと描画の混在**: ドロップダウンメニューの開閉に関するイベントハンドラや `useRef` を使ったDOM制御ロジックがコンポーネント内部に直接記述されており、ヘッダーを描画するという目的から逸脱しています。
*   **肥大化した条件分岐**: ユーザーの権限やログイン状態に応じた表示の切り替えロジックが JSX 内に密結合しており、今後機能が増えるたびに `Header.tsx` を修正する必要があるため、変更箇所が集中する「高結合」な状態になっています。

## 3. 改善案の提示 (Improvement Proposals)

### ① UIロジックの分離（カスタムフック）
メニューの開閉ロジックを `useClickOutside` のような再利用可能なカスタムフックに抽出してください。これにより、コンポーネントは状態の利用に集中できます。

```typescript
// hooks/useMenu.ts (提案)
export function useMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // ... clickoutside/escape key logic ...
  return { isOpen, setIsOpen, ref };
}
```

### ② コンポーネントの細分化
ヘッダーを論理的なパーツに分割してください。

*   `HeaderMenu`: ドロップダウンメニュー部分（内部のアクションボタンを含む）
*   `UserStatusArea`: ログイン/ログアウトボタンやユーザー情報表示部分
*   `Header`: これらを組み合わせる骨組み

```tsx
// 改善後のイメージ
export function Header({ ...props }) {
  return (
    <header className="...">
      <Logo currentProfile={props.currentProfile} />
      <HeaderMenu {...props} /> {/* 閉じるロジック等もここに内包 */}
      <UserStatusArea {...props} />
    </header>
  );
}
```

この分離により、`Header` はヘッダーの構造のみに責任を持ち、個別のコンポーネントは自身の描画とロジックに責任を持つようになり、変更時の影響範囲が明確化されます。
