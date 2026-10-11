from fastapi import FastAPI
from app.routes import health, scan, tracker, classify, preferences, history, ai, chat
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Cookie Crumbs API",
    description="Backend API for Cookie Crumbs, a web privacy analysis extension.",
    version="0.1.0",
)

# Register API routes
app.include_router(health.router)
app.include_router(scan.router)
app.include_router(tracker.router)
app.include_router(classify.router, prefix="/api")
app.include_router(preferences.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(chat.router, prefix="/api") 

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to the Cookie Crumbs API!",
        "version": "0.1.0",
    }
