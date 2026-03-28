"""
RVA Contract Lens — FastAPI backend entry point.
"""

import os
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.rate_limit import limiter
from app.routers import contracts, extract, nl_query, insights, analytics, services, mbe, parser, decision, health_scan

app = FastAPI(
    title="RVA Contract Lens API",
    description="Richmond, VA procurement transparency API",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(services.router)
app.include_router(mbe.router)
app.include_router(parser.router)
app.include_router(decision.router)
app.include_router(health_scan.router)


@app.get("/api/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "rva-contract-lens"}


@app.get("/api/data-freshness")
def data_freshness() -> dict:
    """Return the modification timestamp of the contracts database."""
    db_path = os.path.join(os.path.dirname(__file__), "..", "data", "contracts.duckdb")
    if os.path.exists(db_path):
        mtime = os.path.getmtime(db_path)
        return {
            "last_updated": datetime.fromtimestamp(mtime).isoformat(),
            "source": "City of Richmond Open Data (Socrata)",
        }
    return {"last_updated": None, "source": "City of Richmond Open Data (Socrata)"}
