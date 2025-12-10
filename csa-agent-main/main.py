# main.py
import os
from typing import TypedDict, Optional, List, Annotated, Literal
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage
from langchain.chat_models import init_chat_model
from prompts import nda_llm_prompt
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Initialize the LLM
llm = init_chat_model("gpt-4o", model_provider="azure_openai", api_version="2025-01-01-preview")

# Structured output model
class LLM_Response(BaseModel):
    """Structured response from the LLM"""
    status: Literal["done", "not done"] = Field(
        ..., 
        description="Whether all questions have been sufficiently answered"
    )
    next_response: str = Field(
        ..., 
        description="The next message to send to the user (question, clarification, or final response table)"
    )
    progress: int = Field(
        ..., 
        description="Progress percentage (0-100)"
    )

# Bind structured output to LLM
structured_llm = llm.with_structured_output(LLM_Response)

# Define the Graph State
class GraphState(TypedDict, total=False):
    """State for the conversation graph"""
    history: Annotated[List, add_messages]  # Message history
    next_response: Optional[str]             # Current response to user
    status: Optional[str]                    # "done" or "not done"
    progress: Optional[int]                  # Progress percentage
    user_message: Optional[str]              # Temp holder for API mode
    mode: Optional[str]                      # "cli" or "api"

# Define LLM Node
def llm_node(state: GraphState) -> GraphState:
    """
    LLM node: Processes conversation history and generates next response
    """
    messages_history = state.get("history", [])
    
    # Generate system prompt with current conversation context
    system_prompt = nda_llm_prompt(messages_history)
    messages_for_llm = [HumanMessage(content=system_prompt)]
    
    try:
        # Get structured response from LLM
        response = structured_llm.invoke(messages_for_llm)
        
        # Create AI message for history
        ai_message = AIMessage(content=response.next_response)
        
        # Print in CLI mode
        if state.get("mode") == "cli":
            print(f"\nAgent: {response.next_response}\nAnd Progress is {response.progress}\n")
        
        return {
            'history': [ai_message],
            'status': response.status,
            'next_response': response.next_response,
            'progress': response.progress
        }
    
    except Exception as e:
        error_message = f"Error processing request: {str(e)}"
        print(f"\n[ERROR] {error_message}\n")
        
        return {
            'history': [AIMessage(content=error_message)],
            'status': 'not done',
            'next_response': error_message,
            'progress': 0
        }

# Define Human Node (CLI mode)
def human_node(state: GraphState) -> GraphState:
    """
    Human node: Collects user input in CLI mode or uses pre-provided message
    """
    # Check if message was provided via API
    user_message = state.get("user_message")
    if user_message:
        return {
            'history': [HumanMessage(content=user_message)],
            'user_message': None  # Clear after use
        }
    
    # CLI mode: prompt for user input
    try:
        user_answer = input("You: ").strip()
        
        if not user_answer:
            print("[Warning] Empty input received. Please provide a response.\n")
            user_answer = input("You: ").strip()
        
        print()  # Add spacing
        return {'history': [HumanMessage(content=user_answer)]}
    
    except (EOFError, KeyboardInterrupt):
        print("\n\n[INFO] Conversation aborted by user.")
        return {'status': 'done'}
    
    except Exception as e:
        print(f"\n[ERROR] Input error: {str(e)}\n")
        return {'status': 'done'}

# Routing function
def route_after_llm(state: GraphState) -> Literal["end", "human"]:
    """
    Determines next step after LLM processes:
    - If done: end conversation
    - If API mode: end (wait for next API call)
    - If CLI mode: go to human node for input
    """
    if state.get("status") == "done":
        return "end"
    
    # In API mode, return control to API after each LLM response
    if state.get("mode") == "api":
        return "end"
    
    # In CLI mode, continue to human input
    return "human"

# Build the Graph
def build_graph():
    """Construct the conversation graph"""
    graph = StateGraph(GraphState)
    
    # Add nodes
    graph.add_node("llm", llm_node)
    graph.add_node("human", human_node)
    
    # Define edges
    graph.add_edge(START, "llm")
    graph.add_conditional_edges(
        "llm",
        route_after_llm,
        {
            "end": END,
            "human": "human"
        }
    )
    graph.add_edge("human", "llm")
    
    return graph.compile()

# Compile the app
app = build_graph()

# CLI Interface
def run_conversation():
    """
    Run the conversation in CLI mode.
    This provides an interactive terminal experience.
    """
    # Initialize state for CLI
    state = {
        "history": [],
        "status": "not done",
        "mode": "cli"
    }
    
    print("=" * 70)
    print("  Collaboration Service - Infrastructure Planning Assistant")
    print("=" * 70)
    print("\nWelcome! I'll help you gather infrastructure requirements.")
    print("Type your answers when prompted. Press Ctrl+C to exit anytime.\n")
    print("-" * 70)
    
    try:
        # Run the graph with recursion limit
        final_state = app.invoke(state, {"recursion_limit": 250})
        
        print("\n" + "=" * 70)
        print("  Conversation Completed Successfully")
        print("=" * 70)
        
        # Optionally, print final summary if available
        if final_state.get("status") == "done":
            print("\n✓ All requirements have been gathered.")
            print("✓ Final summary Table has been generated.\n")
        
    except KeyboardInterrupt:
        print("\n\n" + "=" * 70)
        print("  Conversation Interrupted by User")
        print("=" * 70)
        print("\nYour progress has been saved up to this point.\n")
    
    except Exception as e:
        print("\n\n" + "=" * 70)
        print("  An Error Occurred")
        print("=" * 70)
        print(f"\nError Type: {type(e).__name__}")
        print(f"Error Details: {str(e)}\n")
        print("Please check your configuration and try again.\n")

# Entry point
if __name__ == "__main__":
    run_conversation()
