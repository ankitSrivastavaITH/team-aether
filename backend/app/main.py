"""
RVA Contract Lens — FastAPI backend entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import contracts, extract, nl_query, insights, analytics

app = FastAPI(
    title="RVA Contract Lens API",
    description="Richmond, VA procurement transparency API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(contracts.router)
app.include_router(extract.router)
app.include_router(nl_query.router)
app.include_router(insights.router)
app.include_router(analytics.router)


@app.get("/api/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "rva-contract-lens"}
