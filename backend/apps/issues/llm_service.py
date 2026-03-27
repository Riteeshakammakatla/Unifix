"""
LLM Integration placeholder for issue classification.
Replace with real API call when API key is available.
"""
import random


def classify_issue(description: str) -> dict:
    """
    Send issue description to LLM for classification.
    
    Returns:
        dict with 'category', 'priority', and 'duplicate_score'
    
    In production, this would call an LLM API like OpenAI, Gemini, etc.
    Currently returns a smart placeholder based on keyword matching.
    """
    description_lower = description.lower()

    # Keyword-based classification (placeholder for LLM)
    category_map = {
        'plumbing': ['water', 'leak', 'pipe', 'tap', 'drain', 'toilet', 'bathroom'],
        'electrical': ['light', 'fan', 'power', 'switch', 'wire', 'electrical', 'bulb', 'socket'],
        'furniture': ['chair', 'table', 'desk', 'door', 'window', 'cupboard', 'shelf'],
        'network': ['wifi', 'internet', 'network', 'lan', 'router', 'connectivity'],
        'civil': ['wall', 'floor', 'ceiling', 'paint', 'crack', 'roof', 'tile'],
        'hvac': ['ac', 'air conditioner', 'heating', 'ventilation', 'temperature'],
        'cleaning': ['clean', 'garbage', 'trash', 'dirty', 'hygiene', 'pest', 'insect'],
    }

    detected_category = 'General'
    for category, keywords in category_map.items():
        if any(kw in description_lower for kw in keywords):
            detected_category = category.capitalize()
            break

    # Priority classification based on urgency keywords
    high_priority_words = ['urgent', 'emergency', 'severe', 'dangerous', 'critical', 'immediately', 'hazard', 'safety']
    low_priority_words = ['minor', 'small', 'cosmetic', 'eventually', 'when possible']

    if any(word in description_lower for word in high_priority_words):
        priority = 'High'
    elif any(word in description_lower for word in low_priority_words):
        priority = 'Low'
    else:
        priority = 'Medium'

    return {
        'category': detected_category,
        'priority': priority,
        'duplicate_score': round(random.uniform(0.0, 0.3), 2),
    }
