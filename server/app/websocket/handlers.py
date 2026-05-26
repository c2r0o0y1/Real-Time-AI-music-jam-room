import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.input.input_router import route_input_message

logger = logging.getLogger(__name__)


async def websocket_session_handler(websocket: WebSocket, session_id: str) -> None:
    """Owns WebSocket lifecycle: accept, read JSON, route, respond, and handle disconnect."""
    # Client Input -> WebSocket -> Input Router -> Input Handler
    logger.info("WebSocket connection attempt for session: %s", session_id)
    await websocket.accept()
    logger.info("WebSocket accepted for session: %s", session_id)
    await websocket.send_json(
        {
            "type": "session_ready",
            "session_id": session_id,
            "message": "AI Engine Connected",
        }
    )

    try:
        while True:
            try:
                raw_message = await websocket.receive_json()
            except Exception:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Invalid JSON payload",
                    }
                )
                continue

            if not isinstance(raw_message, dict):
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Invalid message format: expected JSON object",
                    }
                )
                continue

            logger.info("Raw message received for session %s: %s", session_id, raw_message)
            response = route_input_message(session_id, raw_message)
            logger.info("Router response for session %s: %s", session_id, response)
            await websocket.send_json(response)
    except WebSocketDisconnect:
        logger.info("Client disconnected for session: %s", session_id)
