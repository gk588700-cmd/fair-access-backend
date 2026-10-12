from collections import defaultdict, deque
from datetime import datetime, timezone
from threading import Lock
from time import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Fair Access to Academic Web Forms",
    description="Session-aware fairness and rate-limiting API",
    version="1.0.0",
)

# Allow local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate-limiting settings
WINDOW_SECONDS = 10
THRESHOLD = 5
SLOWDOWN_SECONDS = 10

# Temporary storage for this demo
requests_by_session = defaultdict(deque)
request_history = deque(maxlen=1000)
lock = Lock()


class Submission(BaseModel):
    session_id: str = Field(min_length=1, max_length=100)
    request_id: str = Field(min_length=1, max_length=100)
    form_data: dict = Field(default_factory=dict)


class RuleConfig(BaseModel):
    window_seconds: int = Field(default=10, ge=1, le=300)
    threshold: int = Field(default=5, ge=1, le=100)
    slowdown_seconds: int = Field(default=10, ge=1, le=300)


@app.get("/")
def home():
    return {
        "project": "Fair Access to Academic Web Forms",
        "status": "running",
        "documentation": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/config")
def get_config():
    return {
        "window_seconds": WINDOW_SECONDS,
        "threshold": THRESHOLD,
        "slowdown_seconds": SLOWDOWN_SECONDS,
    }


@app.put("/config")
def update_config(config: RuleConfig):
    global WINDOW_SECONDS, THRESHOLD, SLOWDOWN_SECONDS

    with lock:
        WINDOW_SECONDS = config.window_seconds
        THRESHOLD = config.threshold
        SLOWDOWN_SECONDS = config.slowdown_seconds

    return {
        "message": "Rules updated",
        "window_seconds": WINDOW_SECONDS,
        "threshold": THRESHOLD,
        "slowdown_seconds": SLOWDOWN_SECONDS,
    }


@app.post("/submit")
def submit_form(submission: Submission):
    now = time()
    session_id = submission.session_id

    with lock:
        events = requests_by_session[session_id]

        # Keep only requests inside the time window
        while events and now - events[0]["time"] >= WINDOW_SECONDS:
            events.popleft()

        events.append({
            "time": now,
            "request_id": submission.request_id,
        })

        count = len(events)

        if count <= THRESHOLD:
            decision = "allow"
            accepted = True
            message = "Submission accepted."
            retry_after = 0

        elif count == THRESHOLD + 1:
            decision = "warn"
            accepted = False
            message = "Rapid repeated submissions detected."
            retry_after = 0

        else:
            decision = "slow"
            accepted = False
            message = "Too many requests. Please wait before retrying."
            retry_after = SLOWDOWN_SECONDS

        result = {
            "session_id": session_id,
            "request_id": submission.request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "requests_in_window": count,
            "decision": decision,
            "accepted": accepted,
            "message": message,
            "retry_after_seconds": retry_after,
        }

        request_history.append(result.copy())

        return result


@app.get("/sessions")
def get_sessions():
    now = time()
    sessions = []

    with lock:
        for session_id, events in requests_by_session.items():
            count = sum(
                1 for event in events
                if now - event["time"] < WINDOW_SECONDS
            )

            if count > 0:
                sessions.append({
                    "session_id": session_id,
                    "requests_in_window": count,
                    "status": (
                        "normal" if count <= THRESHOLD else "flagged"
                    ),
                })

    return {
        "total_sessions": len(sessions),
        "sessions": sessions,
    }


@app.get("/history")
def get_history(limit: int = 50):
    if limit < 1 or limit > 200:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 200",
        )

    with lock:
        history = list(request_history)[-limit:]

    history.reverse()

    return {
        "total_returned": len(history),
        "history": history,
    }


@app.post("/sessions/{session_id}/clear")
def clear_session(session_id: str):
    with lock:
        if session_id not in requests_by_session:
            raise HTTPException(
                status_code=404,
                detail="Session not found",
            )

        requests_by_session[session_id].clear()

        return {
            "session_id": session_id,
            "status": "normal",
            "message": "Session counter cleared.",
        }