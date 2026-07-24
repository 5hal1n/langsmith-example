# langsmith-example

Python 版 LangGraph プロジェクトを TypeScript へ移行するにあたり、LangSmith 上での Trace / Deployment の移行を検証するための実験用リポジトリ。

両言語で **同一構造のグラフ**(`agent`)を実装している:

```
START → agent(LLM: claude-haiku-4-5) ─┬─ tool_calls あり → tools(get_weather)→ agent
                                      └─ なし → END
```

## セットアップ

各プロジェクトで `.env.example` を `.env` にコピーし、キーを設定する。

```
LANGSMITH_API_KEY=lsv2_pt_...
LANGSMITH_TRACING=true
ANTHROPIC_API_KEY=sk-ant-...
```

### Python(uv 管理)

```sh
cd python
uv sync
uv run langgraph dev          # http://127.0.0.1:2024
```

### TypeScript(npm 管理)

```sh
cd typescript
npm install
npx @langchain/langgraph-cli dev   # http://localhost:2024
```

どちらも起動後、LangGraph Studio(https://smith.langchain.com/studio?baseUrl=http://localhost:2024)から操作できる。

### 動作確認(API 直叩き)

```sh
curl -s -X POST http://localhost:2024/runs/wait \
  -H 'Content-Type: application/json' \
  -d '{"assistant_id":"agent","input":{"messages":[{"role":"user","content":"東京の天気を教えて"}]}}'
```

## LangGraph Platform への Deployment 手順

1. このリポジトリを GitHub に push する
2. [LangSmith](https://smith.langchain.com) → 左メニュー **Deployments(LangGraph Platform)** → **+ New Deployment**
3. GitHub アカウントを連携し、このリポジトリを選択
4. **Config file path** に `python/langgraph.json` または `typescript/langgraph.json` を指定
   (1 リポジトリから Python / TypeScript の 2 つの Deployment を作成できる)
5. 環境変数 `ANTHROPIC_API_KEY` を Deployment の Secrets に設定
   (`LANGSMITH_API_KEY` / トレーシングは Platform 側で自動注入される)
6. **Submit** でビルド・デプロイが開始される

## 移行時に判明した言語間の差異

- **`AIMessageChunk` の instanceof 判定**: langgraph-api サーバー内では LLM の
  `invoke` がストリーミングに変換され、node の戻り値が `AIMessageChunk` になる。
  Python では `AIMessageChunk` が `AIMessage` のサブクラスのため
  `isinstance(msg, AIMessage)` が通るが、TypeScript では **サブクラスではない**ため
  `msg instanceof AIMessage` は false になる。条件エッジの判定には
  `isAIMessage(msg)` 型ガード(`@langchain/core/messages`)を使うこと
  (`typescript/src/agent/graph.ts` の `shouldContinue` を参照)。
- **dev サーバーのバインド先**: Python 版は `127.0.0.1`、TypeScript 版は `::1`(IPv6)に
  バインドされる。`localhost` でアクセスすれば両方とも届く。
