/**
 * LangGraph sample agent (TypeScript).
 *
 * Python 版(python/src/agent/graph.py)と同一構造のグラフ。
 * LangSmith 上で Trace を比較するため、ノード名・ツール名・モデルを揃えている。
 *
 * 構造: agent(LLM)→ tool 呼び出しがあれば tools → agent に戻る → なければ終了
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { isAIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

const getWeather = tool(
  async ({ city }) => `${city} の天気は晴れ、気温は 25°C です。`,
  {
    name: "get_weather",
    description: "指定した都市の現在の天気を返す。",
    schema: z.object({
      city: z.string().describe("都市名"),
    }),
  },
);

const tools = [getWeather];

async function agent(state: typeof MessagesAnnotation.State) {
  // ANTHROPIC_API_KEY なしでもサーバー起動できるよう、モデルはノード内で生成する
  const model = new ChatAnthropic({
    model: "claude-haiku-4-5-20251001",
    temperature: 0,
  }).bindTools(tools);
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

function shouldContinue(
  state: typeof MessagesAnnotation.State,
): "tools" | typeof END {
  const last = state.messages.at(-1);
  // langgraph-api サーバー内では invoke がストリーミングに変換され AIMessageChunk が
  // state に入る。AIMessageChunk は AIMessage のサブクラスではないため
  // instanceof ではなく型ガード isAIMessage() で判定する
  if (last && isAIMessage(last) && (last.tool_calls?.length ?? 0) > 0) {
    return "tools";
  }
  return END;
}

export const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", agent)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent")
  .compile();
