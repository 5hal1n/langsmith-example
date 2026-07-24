# langsmith-example

## リポジトリの目的

Python で構築された既存の LangGraph プロジェクト(別リポジトリ)を TypeScript へ移行するにあたり、**LangSmith 上での Trace / Deployment の移行を検証するための実験用リポジトリ**。

- Python と TypeScript の LangGraph プロジェクトを両方このリポジトリ内に置き、いつでも LangSmith(LangGraph Platform)にデプロイできる状態を維持する
- 両言語で同等のグラフを実装し、Trace / Deployment を比較検証できるようにする
- 実験用リポジトリのため、破壊的な変更・作り直しは自由に行ってよい

## リポジトリ構成

```
.
├── CLAUDE.md
├── python/        # Python 版 LangGraph プロジェクト(uv 管理)
│   ├── pyproject.toml
│   ├── langgraph.json   # LangSmith デプロイ設定
│   ├── .env.example
│   └── src/...
└── typescript/    # TypeScript 版 LangGraph プロジェクト(npm 管理)
    ├── package.json
    ├── langgraph.json   # LangSmith デプロイ設定
    ├── .env.example
    └── src/...
```

## ツール規約

- **Python**: uv を使う(`uv run`, `uv add`, `uv sync`)。pip / poetry は使わない
- **TypeScript**: npm を使う(`npm run`, `npm install`)。yarn / pnpm は使わない
- ローカル開発・デプロイ検証には langgraph-cli を使う
  - Python 側: `uv run langgraph dev`
  - TypeScript 側: `npx @langchain/langgraph-cli dev`

## LangSmith / デプロイ要件

- 両プロジェクトとも `langgraph.json` を持ち、常に LangGraph Platform にデプロイ可能な構成を維持すること
- 環境変数は各プロジェクトの `.env` で管理し、`.env.example` を必ず用意する
  - `LANGSMITH_API_KEY`
  - `LANGSMITH_TRACING=true`
  - LLM プロバイダの API キー(例: `ANTHROPIC_API_KEY`)
- 両言語のグラフは名前・構造を揃え、LangSmith 上で Trace を比較できるようにする

## ロードマップ

- [x] Python 版 LangGraph プロジェクトの scaffold(uv)
- [x] TypeScript 版 LangGraph プロジェクトの scaffold(npm)
- [x] 両者に同等のサンプルグラフを実装
- [x] `langgraph dev` でローカル起動確認(LangGraph Studio)
- [ ] LangSmith への Trace 送信確認
- [ ] LangGraph Platform への Deployment 検証
- [ ] Trace / Deployment の Python ↔ TypeScript 比較・移行手順の記録
