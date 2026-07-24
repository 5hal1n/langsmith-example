"""LangGraph sample agent (Python).

TypeScript 版(typescript/src/agent/graph.ts)と同一構造のグラフ。
LangSmith 上で Trace を比較するため、ノード名・ツール名・モデルを揃えている。

構造: agent(LLM)→ tool 呼び出しがあれば tools → agent に戻る → なければ終了
"""

from typing import Literal

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage
from langchain_core.tools import tool
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode


@tool
def get_weather(city: str) -> str:
    """指定した都市の現在の天気を返す。"""
    return f"{city} の天気は晴れ、気温は 25°C です。"


tools = [get_weather]


def agent(state: MessagesState) -> dict:
    # ANTHROPIC_API_KEY なしでもサーバー起動できるよう、モデルはノード内で生成する
    model = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0).bind_tools(
        tools
    )
    response = model.invoke(state["messages"])
    return {"messages": [response]}


def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return END


builder = StateGraph(MessagesState)
builder.add_node("agent", agent)
builder.add_node("tools", ToolNode(tools))
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue)
builder.add_edge("tools", "agent")

graph = builder.compile()
