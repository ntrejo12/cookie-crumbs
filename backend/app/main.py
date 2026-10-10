from fastapi import FastAPI
from app.routes import health

app = FastAPI(
    title="Cookie Crumbs API",
    description="Backend API for Cookie Crumbs, a web privacy analysis extension.",
    version="0.1.0",
)

# Register API routes
app.include_router(health.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to the Cookie Crumbs API!",
        "version": "0.1.0",
    }
