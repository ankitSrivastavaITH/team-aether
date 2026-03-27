"""Resident service navigation — helps find the right City service or 311 category."""

import json
from typing import Optional
from fastapi import APIRouter, Query
from app.services.groq_client import chat

router = APIRouter(prefix="/api/services", tags=["services"])

# Curated Richmond City service categories based on rva.gov and RVA311
# This is the "decision tree" the challenge doc asks teams to build
CITY_SERVICES = [
    {"category": "Pothole / Road Damage", "department": "Public Works", "311_type": "Street - Pothole", "description": "Report potholes, sinkholes, damaged roads, or deteriorating street surfaces", "next_step": "Submit via RVA311 or call 3-1-1", "url": "https://www.rva311.com"},
    {"category": "Sidewalk Repair", "department": "Public Works", "311_type": "Sidewalk - Repair", "description": "Report broken, cracked, or uneven sidewalks", "next_step": "Submit via RVA311 or call 3-1-1", "url": "https://www.rva311.com"},
    {"category": "Street Light Out", "department": "Public Works", "311_type": "Street Light - Out/Damaged", "description": "Report a street light that is out, flickering, or damaged", "next_step": "Submit via RVA311 with pole number if visible", "url": "https://www.rva311.com"},
    {"category": "Trash / Recycling", "department": "Public Works", "311_type": "Solid Waste - Missed Collection", "description": "Report missed trash or recycling pickup, request bulk pickup, or report illegal dumping", "next_step": "Submit via RVA311 or call 3-1-1", "url": "https://www.rva311.com"},
    {"category": "Illegal Dumping", "department": "Public Works", "311_type": "Illegal Dumping", "description": "Report illegal dumping of trash, furniture, or debris on public or private property", "next_step": "Submit via RVA311 with location and photos if possible", "url": "https://www.rva311.com"},
    {"category": "Water / Sewer Issue", "department": "Public Utilities", "311_type": "Water - Main Break/Leak", "description": "Report water main breaks, leaks, sewer backups, or flooding from city infrastructure", "next_step": "For emergencies call (804) 646-4646. Non-emergency: submit via RVA311", "url": "https://www.rva311.com"},
    {"category": "Gas Service", "department": "Public Utilities - Richmond Gas Works", "311_type": "Gas Service Request", "description": "Start, stop, or transfer gas service. Report gas leaks or gas billing questions", "next_step": "Gas leaks: call 911 immediately. Service: call (804) 646-4646 or visit richmondgasworks.com", "url": "https://www.richmondgasworks.com"},
    {"category": "Billing Question", "department": "Public Utilities", "311_type": "Utility Billing", "description": "Questions about water, sewer, or gas bills. Payment plans or disputes", "next_step": "Call (804) 646-4646 or visit the Customer Service Center at 730 E Broad St", "url": "https://www.rva.gov/public-utilities"},
    {"category": "Abandoned Vehicle", "department": "Police", "311_type": "Abandoned Vehicle", "description": "Report a vehicle that appears abandoned on a public street", "next_step": "Submit via RVA311 with vehicle description and location", "url": "https://www.rva311.com"},
    {"category": "Noise Complaint", "department": "Police", "311_type": "Noise Complaint", "description": "Report excessive noise from construction, parties, or businesses", "next_step": "Non-emergency: call (804) 646-5100. Emergency: call 911", "url": "https://www.rva.gov/police"},
    {"category": "Building Permit", "department": "Planning & Development Review", "311_type": "Permit Application", "description": "Apply for building, electrical, plumbing, or mechanical permits", "next_step": "Visit rva.gov/planning-development-review or call (804) 646-6340", "url": "https://www.rva.gov/planning-development-review"},
    {"category": "Business License", "department": "Finance", "311_type": "Business License", "description": "Apply for, renew, or update a City of Richmond business license", "next_step": "Visit rva.gov/finance or the Department of Finance at City Hall", "url": "https://www.rva.gov/finance"},
    {"category": "Property Tax", "department": "Finance", "311_type": "Property Tax Inquiry", "description": "Questions about property tax assessments, payments, or exemptions", "next_step": "Visit rva.gov/finance or call (804) 646-7000", "url": "https://www.rva.gov/finance"},
    {"category": "Parks / Recreation", "department": "Parks, Recreation and Community Facilities", "311_type": "Park Maintenance", "description": "Report park maintenance issues, damaged playground equipment, or request facility information", "next_step": "Submit via RVA311 or call (804) 646-5733", "url": "https://www.rva.gov/parks-recreation-and-community-facilities"},
    {"category": "Tree Removal / Trimming", "department": "Public Works - Urban Forestry", "311_type": "Tree - Removal/Trimming", "description": "Request tree trimming or removal on city property, report fallen trees blocking roads", "next_step": "Submit via RVA311. Emergencies blocking roads: call 3-1-1", "url": "https://www.rva311.com"},
    {"category": "Animal Control", "department": "Richmond Animal Care & Control", "311_type": "Animal Control", "description": "Report stray animals, animal abuse, or wildlife issues. Dog licensing", "next_step": "Emergencies: call (804) 646-5573. Non-emergency: submit via RVA311", "url": "https://www.rva.gov/richmond-animal-care-and-control"},
    {"category": "Code Violation", "department": "Planning & Development Review", "311_type": "Code Enforcement", "description": "Report property maintenance violations, zoning violations, or unsafe structures", "next_step": "Submit via RVA311 with address and description", "url": "https://www.rva311.com"},
    {"category": "FOIA Request", "department": "City Attorney", "311_type": "FOIA", "description": "Submit a Freedom of Information Act request for public records", "next_step": "Email foia@rva.gov or submit online at rva.gov", "url": "https://www.rva.gov/city-attorney"},
    {"category": "Voter Registration", "department": "General Registrar", "311_type": "Voter Services", "description": "Register to vote, update registration, find polling location, request absentee ballot", "next_step": "Visit vote.elections.virginia.gov or call (804) 646-7950", "url": "https://vote.elections.virginia.gov"},
    {"category": "General Question", "department": "RVA311", "311_type": "General Information", "description": "General questions about City services, hours, locations, or who to contact", "next_step": "Call 3-1-1 or visit rva311.com", "url": "https://www.rva311.com"},
]


@router.get("/categories")
def list_service_categories():
    """List all known City service categories."""
    return {"categories": CITY_SERVICES, "total": len(CITY_SERVICES)}


@router.post("/navigate")
def navigate_service(question: dict):
    """Given a resident's description of their issue, find the right City service and next step."""
    user_input = question.get("question", "")
    if not user_input.strip():
        return {"error": "Please describe your issue or question."}

    # Build context from our service knowledge base
    services_context = json.dumps(CITY_SERVICES, indent=2)

    system_prompt = f"""You are a Richmond, VA city services navigator helping residents find the right department and next step.

You have access to these City service categories:
{services_context}

Given the resident's description, respond with a JSON object:
{{
  "matched_category": "the best matching category name from the list",
  "department": "the responsible department",
  "confidence": "high" or "medium" or "low",
  "next_step": "specific actionable next step for the resident",
  "explanation": "1-2 sentence plain-language explanation of why this is the right service",
  "url": "the URL to visit",
  "alternative_categories": ["list of 1-2 other categories that might also apply"],
  "call_311": true or false (whether they should call 3-1-1)
}}

Rules:
- If you're not confident, set confidence to "low" and add: "If this doesn't seem right, call 3-1-1 and a representative will help you."
- Never make up services or departments that aren't in the list
- Use plain language — the resident may not know government terminology
- If the issue could be multiple categories (like pothole vs sinkhole), mention all of them
- Always provide a concrete next step, not just "contact the city"

Return ONLY raw JSON, no markdown fences."""

    try:
        raw = chat(system_prompt, f"Resident says: {user_input}")
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        result = json.loads(cleaned.strip())
        result["disclaimer"] = "This is an AI-assisted suggestion. For official guidance, call 3-1-1 or visit rva311.com."
        return result
    except Exception:
        # Fallback: simple keyword matching
        lower = user_input.lower()
        for svc in CITY_SERVICES:
            keywords = svc["description"].lower().split()
            if any(word in lower for word in keywords if len(word) > 4):
                return {
                    "matched_category": svc["category"],
                    "department": svc["department"],
                    "confidence": "medium",
                    "next_step": svc["next_step"],
                    "explanation": svc["description"],
                    "url": svc["url"],
                    "alternative_categories": [],
                    "call_311": True,
                    "disclaimer": "This is an AI-assisted suggestion. For official guidance, call 3-1-1 or visit rva311.com.",
                }
        return {
            "matched_category": "General Question",
            "department": "RVA311",
            "confidence": "low",
            "next_step": "Call 3-1-1 or visit rva311.com for assistance",
            "explanation": "We couldn't determine the exact service. A 311 representative can help route your request.",
            "url": "https://www.rva311.com",
            "alternative_categories": [],
            "call_311": True,
            "disclaimer": "This is an AI-assisted suggestion. For official guidance, call 3-1-1 or visit rva311.com.",
        }
