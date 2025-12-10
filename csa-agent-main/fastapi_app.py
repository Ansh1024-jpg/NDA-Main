#fastapi_app.py
import uuid
from threading import RLock
from typing import Dict, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from main import app as langgraph_app
from create_boq import create_boq as generate_boq_content

app = FastAPI(title="CSA Backend API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage with timestamps
sessions: Dict[str, Dict[str, Any]] = {}
session_lock = RLock()
SESSION_TIMEOUT = timedelta(hours=1)

# Models
class UserMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    session_id: str
    agent_message: str
    status: str
    progress: int = 0

class SessionInfo(BaseModel):
    session_id: str
    status: str
    history: list
    next_response: str
    created_at: str

# Helper Functions
def cleanup_old_sessions():
    """Remove sessions older than timeout"""
    cutoff = datetime.now() - SESSION_TIMEOUT
    with session_lock:
        expired = [sid for sid, data in sessions.items() 
                   if data.get("created_at", datetime.now()) < cutoff]
        for sid in expired:
            del sessions[sid]

def validate_session(session_id: str) -> Dict[str, Any]:
    """Validate session exists and is not expired"""
    cleanup_old_sessions()
    
    with session_lock:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        
        return sessions[session_id]

# API Endpoints
@app.post("/start", response_model=ChatResponse)
def start_conversation():
    """Start a new conversation and get the first question"""
    cleanup_old_sessions()
    
    session_id = str(uuid.uuid4())
    
    initial_state = {
        "history": [],
        "status": "not done",
        "next_response": None,
        "mode": "api",
        "progress": 0
    }
    
    result = langgraph_app.invoke(initial_state, {"recursion_limit": 400})
    
    # Add metadata
    result["created_at"] = datetime.now()
    result["updated_at"] = datetime.now()
    with session_lock:
        sessions[session_id] = result
    
    agent_message = str(result.get("next_response", "")).strip()
    
    return ChatResponse(
        session_id=session_id,
        agent_message=agent_message,
        status=result.get("status", "not done"),
        progress=result.get("progress", 0)
    )

@app.post("/chat/{session_id}", response_model=ChatResponse)
def send_message(session_id: str, user_msg: UserMessage):
    """Send user response and get next question"""
    previous_state = validate_session(session_id)
    
    if previous_state.get("status") == "done":
        raise HTTPException(
            status_code=400, 
            detail="Conversation already completed."
        )
    
    # Build updated state
    current_history = previous_state.get("history", [])
    state_update = {
        "history": current_history + [HumanMessage(content=user_msg.message)],
        "mode": "api",
        "status": "not done",
        "progress": previous_state.get("progress", 0)
    }
    
    # Invoke graph
    result = langgraph_app.invoke(state_update, {"recursion_limit": 400})
    
    # Update session with metadata
    result["created_at"] = previous_state.get("created_at", datetime.now())
    result["updated_at"] = datetime.now()
    with session_lock:
        sessions[session_id] = result
    
    agent_message = str(result.get("next_response", "")).strip()
    
    return ChatResponse(
        session_id=session_id,
        agent_message=agent_message,
        status=result.get("status", "not done"),
        progress=result.get("progress", 0)
    )

@app.post("/create_boq/{session_id}", response_model=ChatResponse)
def create_boq(session_id: str):
    """Create BOQ for the project based on the information received from the user"""
    # This acts as a creation endpoint for the BOQ document.
    
    # Validate session
    current_state = validate_session(session_id)
    
    # Retrieve status and summary
    status = current_state.get("status", "not done")
    
    # Ideally we expect status to be done to generate final BOQ
    if status != "done":
         raise HTTPException(
            status_code=400, 
            detail="Conversation not completed. Please finish the questions first."
        )

    # The summary is stored in 'next_response' of the completed session
    # The summary is stored in 'next_response' of the completed session
    info_summary = str(current_state.get("next_response", "")).strip()
    
    if not info_summary:
        raise HTTPException(
            status_code=400, 
            detail="No information summary available. Please complete conversation first."
        )

    # Generate BOQ
    try:
        boq_output = generate_boq_content(info_summary)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate BOQ: {str(e)}"
        )
    
    return ChatResponse(
        session_id=session_id,
        agent_message=boq_output,
        status=status,
        progress=100
    )
    

@app.get("/session/{session_id}", response_model=SessionInfo)
def get_session_info(session_id: str):
    """Get current session information - useful for debugging and recovery"""
    state = validate_session(session_id)
    
    return SessionInfo(
        session_id=session_id,
        status=state.get("status", "not done"),
        history=[msg.content if hasattr(msg, 'content') else str(msg) 
                 for msg in state.get("history", [])],
        next_response=state.get("next_response", ""),
        created_at=state.get("created_at", datetime.now()).isoformat()
    )

@app.delete("/session/{session_id}")
def delete_session(session_id: str):
    """Manually delete a session"""
    with session_lock:
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        del sessions[session_id]
    return {"message": "Session deleted successfully"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_sessions": len(sessions)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=True)