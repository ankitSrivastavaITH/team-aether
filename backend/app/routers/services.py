"""Resident service navigation — helps find the right City service or 311 category."""

import json
from typing import Optional
from fastapi import APIRouter, Query
from app.services.groq_client import chat

router = APIRouter(prefix="/api/services", tags=["services"])

# Curated Richmond City service categories based on rva.gov and RVA311
# This is the "decision tree" the challenge doc asks teams to build
CITY_SERVICES = [
    {"category": "Pothole / Road Damage", "department": "Public Works", "311_type": "Street - Pothole",
     "description": "Report potholes, sinkholes, damaged roads, or deteriorating street surfaces",
     "next_step": "Submit via RVA311 or call 3-1-1", "url": "https://www.rva311.com",
     "related": ["Sinkhole", "Sidewalk Repair", "Road Damage"]},
    {"category": "Sinkhole", "department": "Public Works / Public Utilities", "311_type": "Street - Sinkhole",
     "description": "Report a sinkhole or ground collapse on a street or sidewalk. May involve water/sewer infrastructure underneath.",
     "next_step": "Call 3-1-1 immediately. If the sinkhole is large or growing, also call 911.",
     "url": "https://www.rva311.com",
     "related": ["Pothole / Road Damage", "Water / Sewer Issue", "Sidewalk Repair"],
     "important_note": "Sinkholes may involve multiple departments: Public Works (road surface), Public Utilities (underground water/sewer), and sometimes Emergency Services if there's a safety risk."},
    {"category": "Sidewalk Repair", "department": "Public Works", "311_type": "Sidewalk - Repair", "description": "Report broken, cracked, or uneven sidewalks", "next_step": "Submit via RVA311 or call 3-1-1", "url": "https://www.rva311.com"},
    {"category": "Street Light Out", "department": "Public Works", "311_type": "Street Light - Out/Damaged", "description": "Report a street light that is out, flickering, or damaged", "next_step": "Submit via RVA311 with pole number if visible", "url": "https://www.rva311.com"},
    {"category": "Trash / Recycling", "department": "Public Works", "311_type": "Solid Waste - Missed Collection", "description": "Report missed trash or recycling pickup, request bulk pickup, or report illegal dumping", "next_step": "Submit via RVA311 or call 3-1-1", "url": "https://www.rva311.com"},
    {"category": "Illegal Dumping", "department": "Public Works", "311_type": "Illegal Dumping", "description": "Report illegal dumping of trash, furniture, or debris on public or private property", "next_step": "Submit via RVA311 with location and photos if possible", "url": "https://www.rva311.com"},
    {"category": "Water / Sewer Issue", "department": "Public Utilities", "311_type": "Water - Main Break/Leak", "description": "Report water main breaks, leaks, sewer backups, or flooding from city infrastructure", "next_step": "For emergencies call (804) 646-4646. Non-emergency: submit via RVA311", "url": "https://www.rva311.com"},
    {"category": "Water Emergency / Boil Advisory", "department": "Public Utilities", "311_type": "Water Emergency",
     "description": "Water main break, boil water advisory, loss of water service, or water quality emergency",
     "next_step": "For active emergencies: call (804) 646-4646 immediately. Check rva.gov/public-utilities for current advisories and water distribution locations.",
     "url": "https://www.rva.gov/public-utilities",
     "related": ["Water / Sewer Issue"],
     "important_note": "During water emergencies, the city sets up free water distribution points. Check rva.gov for current locations and hours."},
    {"category": "Gas Service", "department": "Public Utilities - Richmond Gas Works", "311_type": "Gas Service Request",
     "description": "Start, stop, or transfer gas service. Report gas leaks or gas billing questions",
     "next_step": "Gas leaks: call 911 immediately. New service: call (804) 646-4646 or visit richmondgasworks.com. Do NOT send personal information (SSN, ID) via email.",
     "url": "https://www.richmondgasworks.com",
     "important_note": "The current gas service signup process may ask you to send personal information via email. For your safety, call (804) 646-4646 instead or visit the Customer Service Center at 730 E Broad St in person."},
    {"category": "Billing Question", "department": "Public Utilities", "311_type": "Utility Billing", "description": "Questions about water, sewer, or gas bills. Payment plans or disputes", "next_step": "Call (804) 646-4646 or visit the Customer Service Center at 730 E Broad St", "url": "https://www.rva.gov/public-utilities"},
    {"category": "Abandoned Vehicle", "department": "Police", "311_type": "Abandoned Vehicle", "description": "Report a vehicle that appears abandoned on a public street", "next_step": "Submit via RVA311 with vehicle description and location", "url": "https://www.rva311.com"},
    {"category": "Noise Complaint", "department": "Police", "311_type": "Noise Complaint", "description": "Report excessive noise from construction, parties, or businesses", "next_step": "Non-emergency: call (804) 646-5100. Emergency: call 911", "url": "https://www.rva.gov/police"},
    {"category": "Building Permit", "department": "Planning & Development Review", "311_type": "Permit Application", "description": "Apply for building, electrical, plumbing, or mechanical permits", "next_step": "Visit rva.gov/planning-development-review or call (804) 646-6340", "url": "https://www.rva.gov/planning-development-review"},
    {"category": "Business License", "department": "Finance", "311_type": "Business License", "description": "Apply for, renew, or update a City of Richmond business license. BPOL (Business Professional Occupational License) required for all businesses operating in the City.", "next_step": "Apply online at rva.gov/finance/business-tax or visit the Department of Finance at City Hall, Room 102. Call (804) 646-7000 for questions.", "url": "https://www.rva.gov/finance/business-tax", "links": {"Apply Online": "https://www.rva.gov/finance/business-tax", "Tax Rates": "https://www.rva.gov/finance/tax-rates", "City Hall Location": "https://www.rva.gov/finance"}},
    {"category": "Property Tax", "department": "Finance", "311_type": "Property Tax Inquiry", "description": "Questions about real estate property tax assessments, payments, exemptions, or appeals. Richmond's real estate tax rate is $1.20 per $100 of assessed value. Personal property tax also applies to vehicles.", "next_step": "Pay online at rva.gov/finance/real-estate-tax. For assessment questions call (804) 646-7000. For tax relief programs (elderly/disabled), visit rva.gov/finance/tax-relief.", "url": "https://www.rva.gov/finance/real-estate-tax", "links": {"Pay Property Tax": "https://www.rva.gov/finance/real-estate-tax", "Tax Relief Programs": "https://www.rva.gov/finance/tax-relief", "Assessment Lookup": "https://www.rva.gov/assessor", "Personal Property Tax": "https://www.rva.gov/finance/personal-property-tax", "City Budget": "https://www.rva.gov/budget-and-strategic-planning/adopted-budget"}},
    {"category": "Parks / Recreation", "department": "Parks, Recreation and Community Facilities", "311_type": "Park Maintenance", "description": "Report park maintenance issues, damaged playground equipment, or request facility information", "next_step": "Submit via RVA311 or call (804) 646-5733", "url": "https://www.rva.gov/parks-recreation-and-community-facilities"},
    {"category": "Tree Removal / Trimming", "department": "Public Works - Urban Forestry", "311_type": "Tree - Removal/Trimming", "description": "Request tree trimming or removal on city property, report fallen trees blocking roads", "next_step": "Submit via RVA311. Emergencies blocking roads: call 3-1-1", "url": "https://www.rva311.com"},
    {"category": "Animal Control", "department": "Richmond Animal Care & Control", "311_type": "Animal Control", "description": "Report stray animals, animal abuse, or wildlife issues. Dog licensing", "next_step": "Emergencies: call (804) 646-5573. Non-emergency: submit via RVA311", "url": "https://www.rva.gov/richmond-animal-care-and-control"},
    {"category": "Code Violation", "department": "Planning & Development Review", "311_type": "Code Enforcement", "description": "Report property maintenance violations, zoning violations, or unsafe structures", "next_step": "Submit via RVA311 with address and description", "url": "https://www.rva311.com"},
    {"category": "FOIA Request", "department": "City Attorney", "311_type": "FOIA", "description": "Submit a Freedom of Information Act (FOIA) request for public records. Virginia law requires a response within 5 business days.", "next_step": "Email foia@rva.gov with your request. Include specific records, date ranges, and departments. Response required within 5 business days by Virginia Code § 2.2-3704.", "url": "https://www.rva.gov/city-attorney/freedom-information-requests", "links": {"Submit FOIA": "https://www.rva.gov/city-attorney/freedom-information-requests", "Virginia FOIA Law": "https://law.lis.virginia.gov/vacode/title2.2/chapter37/"}},
    {"category": "Voter Registration", "department": "General Registrar", "311_type": "Voter Services", "description": "Register to vote, update registration, find polling location, request absentee ballot", "next_step": "Visit vote.elections.virginia.gov or call (804) 646-7950", "url": "https://vote.elections.virginia.gov"},
    {"category": "General Question", "department": "RVA311", "311_type": "General Information", "description": "General questions about City services, hours, locations, or who to contact", "next_step": "Call 3-1-1 or visit rva311.com", "url": "https://www.rva311.com"},
]


@router.get("/categories")
def list_service_categories():
    """List all known City service categories."""
    return {"categories": CITY_SERVICES, "total": len(CITY_SERVICES)}


# Fast path for common overlapping scenarios (no LLM needed)
FAST_ROUTES = {
    "pothole": {"categories": ["Pothole / Road Damage", "Sinkhole", "Sidewalk Repair"], "primary": "Pothole / Road Damage"},
    "sinkhole": {"categories": ["Sinkhole", "Pothole / Road Damage", "Water / Sewer Issue"], "primary": "Sinkhole"},
    "hole in the road": {"categories": ["Pothole / Road Damage", "Sinkhole"], "primary": "Pothole / Road Damage"},
    "road damage": {"categories": ["Pothole / Road Damage", "Sinkhole", "Sidewalk Repair"], "primary": "Pothole / Road Damage"},
    "sidewalk": {"categories": ["Sidewalk Repair", "Pothole / Road Damage"], "primary": "Sidewalk Repair"},
    "water emergency": {"categories": ["Water Emergency / Boil Advisory", "Water / Sewer Issue"], "primary": "Water Emergency / Boil Advisory"},
    "fresh water": {"categories": ["Water Emergency / Boil Advisory"], "primary": "Water Emergency / Boil Advisory"},
    "boil advisory": {"categories": ["Water Emergency / Boil Advisory"], "primary": "Water Emergency / Boil Advisory"},
    "water crisis": {"categories": ["Water Emergency / Boil Advisory", "Water / Sewer Issue"], "primary": "Water Emergency / Boil Advisory"},
    "gas service": {"categories": ["Gas Service"], "primary": "Gas Service"},
    "gas leak": {"categories": ["Gas Service"], "primary": "Gas Service"},
    "trash": {"categories": ["Trash / Recycling", "Illegal Dumping"], "primary": "Trash / Recycling"},
    "recycling": {"categories": ["Trash / Recycling"], "primary": "Trash / Recycling"},
    "dumping": {"categories": ["Illegal Dumping", "Trash / Recycling"], "primary": "Illegal Dumping"},
}


@router.post("/navigate")
def navigate_service(question: dict):
    """Given a resident's description of their issue, find the right City service and next step."""
    user_input = question.get("question", "")
    if not user_input.strip():
        return {"error": "Please describe your issue or question."}

    # Check fast path first (no LLM latency for common scenarios)
    lower_input = user_input.lower()
    for keyword, route in FAST_ROUTES.items():
        if keyword in lower_input:
            primary_svc = next((s for s in CITY_SERVICES if s["category"] == route["primary"]), None)
            if primary_svc:
                overlapping = [
                    {"category": s["category"], "department": s["department"], "why": s["description"]}
                    for s in CITY_SERVICES if s["category"] in route["categories"] and s["category"] != route["primary"]
                ]
                return {
                    "matched_category": primary_svc["category"],
                    "department": primary_svc["department"],
                    "confidence": "high",
                    "next_step": primary_svc["next_step"],
                    "explanation": primary_svc["description"],
                    "url": primary_svc["url"],
                    "alternative_categories": route["categories"][1:],
                    "overlapping_services": overlapping,
                    "important_note": primary_svc.get("important_note"),
                    "call_311": True,
                    "disclaimer": "This is an AI-assisted suggestion. For official guidance, call 3-1-1 or visit rva311.com.",
                }

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
  "next_step": "specific actionable next step for the resident — include phone numbers and specific page names",
  "explanation": "2-3 sentence plain-language explanation. Be specific — include dollar amounts, timelines, or requirements when known from the service data. Use the description and links fields from the matched service.",
  "url": "the most specific URL to visit (not generic rva.gov — use the specific page URL from the service data)",
  "helpful_links": {{"Link Label": "https://url", "Another Link": "https://url"}},
  "alternative_categories": ["list of 1-2 other categories that might also apply"],
  "overlapping_services": [{{"category": "...", "department": "...", "why": "..."}}],
  "important_note": "any safety warnings or process issues the resident should know about",
  "call_311": true or false (whether they should call 3-1-1)
}}

CRITICAL: Many city services overlap. When categories overlap (e.g., pothole vs sinkhole vs road damage vs sidewalk damage), you MUST include ALL related categories in your response. The resident should see every option that might apply.

When the issue involves road surfaces, ALWAYS mention: Pothole, Sinkhole, Road Damage, and Sidewalk Repair as potential matches and explain which department handles each.

If there's an important_note field for a service, include it in your explanation.

Rules:
- If the question is NOT about a Richmond city service (personal questions, jokes, off-topic), respond with: matched_category "General Question", confidence "low", explanation "I can only help with Richmond city services. Try describing a specific issue like 'pothole on my street' or 'how do I pay my water bill'."
- If you're not confident, set confidence to "low" and add: "If this doesn't seem right, call 3-1-1 and a representative will help you."
- Never make up services or departments that aren't in the list
- Use plain language — the resident may not know government terminology
- If the issue could be multiple categories (like pothole vs sinkhole), mention all of them in overlapping_services
- When a service has a "links" field, include those links in your helpful_links response
- Use the MOST SPECIFIC URL available — never just rva.gov/finance when a more specific page exists
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
