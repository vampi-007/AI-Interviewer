# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth ,resume ,user ,admin ,prompt ,techstack_prompt
from backend.database import init_db


app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",  # React app running on this port
    # Add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(auth.router , tags=["Auth"])
app.include_router(resume.router, tags=["Resume"])
app.include_router(user.router, tags=["User"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(prompt.router, tags=["Prompt"])
app.include_router(
    techstack_prompt.router,
    tags=["Techstack Prompt"]
)
