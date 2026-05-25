from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.websocket.handlers import websocket_session_handler

app = FastAPI(title="AI Music Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    """Basic liveness endpoint for local/dev health checks."""
    return {"status": "ok", "service": "ai-music-backend"}


@app.websocket("/ws/session/{session_id}")
async def websocket_session(websocket: WebSocket, session_id: str) -> None:
    """Delegates each session WebSocket lifecycle to the dedicated handler module."""
    await websocket_session_handler(websocket, session_id)
