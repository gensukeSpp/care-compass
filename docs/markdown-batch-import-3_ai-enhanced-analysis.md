## Plan: Markdown Batch Import (3) - AI Enhanced Analysis

TL;DR: ルールベースのマッチングでは不可能な、文脈やニュアンスに基づいた高度な分類を AI（LLM）を用いて実現します。これにより、多義的な記述（例：「食事は一人でできますが、調理は危険です」）の正確な分析と付箋への反映が可能になります。

**Steps**
1. **AI サービス連携の基盤構築**
   - 外部 AI API（OpenAI / Gemini / Anthropic など）またはローカル LLM のエンドポイントを `src/services/aiService.ts` に実装。
   - 介護・看護コンテキストに適したシステムプロンプトの設計。
2. **構造化されたレスポンスの抽出**
   - AI からのレスポンスを JSON 形式（`title`, `content`, `category`, `status`）で取得。
   - 既存の構造分割（Batch Import (1)）と組み合わせ、AI による要約と分割を同時に実行。
3. **セキュリティとプライバシーへの配慮**
   - PII（個人情報）を送信前にマスクする機能の検討（将来的な拡張）。

**Relevant files**
- `src/services/aiService.ts` (新規: AI 連携ロジック)
- `src/hooks/useAiImport.ts` (AI 処理呼び出しのフック)

**Verification**
1. 「食事は自立しているが、買い物が困難」という一文が、適切に2つの付箋（`can` と `cannot`）に分割されること。
2. 単純なキーワードマッチングでは誤判定されるような複雑なニュアンス（例：「見守りがあれば安全」→ `risk`）が正しく分析されること。
3. API エラー時のリトライやフォールバックが機能すること。
