import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import webhooks, whatsapp  # noqa: E402

app = FastAPI(title="Pulseo API", version="0.1.0")

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,  # produção: "https://pulseo.pt,https://*.vercel.app"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(whatsapp.router, prefix="/api/v1/whatsapp", tags=["whatsapp"])
app.include_router(webhooks.router, prefix="/webhook", tags=["webhooks"])


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
