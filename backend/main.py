from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import resume
from config import settings
from routers import prompt , tech_stack_prompt
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define API version
API_VERSION = "v1"

# Include routers with versioning
app.include_router(resume.router, prefix=f"/api/{API_VERSION}/resume", tags=["resume"])
app.include_router(prompt.router, prefix=f"/api/{API_VERSION}/prompt", tags=["Prompt"])
app.include_router(
    tech_stack_prompt.router,
    prefix=f"/api/{API_VERSION}/tech-stack-prompts",
    tags=["Techstack Prompt"]
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)