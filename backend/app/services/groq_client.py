"""Groq LLM client with retry and graceful fallback."""

import os
import time
from typing import Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None

def _get_client() -> Optional[Groq]:
    global _client
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "placeholder":
        return None
    if _client is None:
        _client = Groq(api_key=api_key)
    return _client


def chat(system: str, user: str, model: str = "llama-3.3-70b-versatile") -> str:
    """Call Groq with retry logic and fallback."""
    client = _get_client()
    if client is None:
        raise RuntimeError("GROQ_API_KEY not configured")

    last_error = None
    # Try primary model, then fallback model
    models = [model, "llama-3.1-8b-instant"]

    for attempt_model in models:
        for attempt in range(2):
            try:
                resp = client.chat.completions.create(
                    model=attempt_model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    temperature=0.1,
                    max_tokens=2000,
                    timeout=15,
                )
                return resp.choices[0].message.content
            except Exception as e:
                last_error = e
                if attempt == 0:
                    time.sleep(1)  # Brief retry delay

    raise RuntimeError(f"All Groq models failed: {last_error}")
