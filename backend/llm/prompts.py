"""
Prompts for Groq LLM API calls.
"""

ISSUE_CLASSIFICATION_PROMPT = """You are an AI assistant for a campus maintenance system.
Analyze the following maintenance issue description and classify it into exactly one of the categories below, determine its priority, map the category to the responsible department, and generate a short, professional summary.

Categories: Electrical, Plumbing, Cleaning, Network, Carpentry, Infrastructure, General
Priorities: Low, Medium, High, Critical

Rules:
1. If there is any safety risk (e.g., exposed wires, flooding, hazardous materials), the priority MUST be High or Critical.
2. Department mapping:
   - Electrical -> Electrical
   - Plumbing -> Plumbing
   - Cleaning -> Cleaning
   - Network -> Network
   - Carpentry -> Carpentry
   - Infrastructure -> Infrastructure
   - General -> General
3. The summary must be short, professional, and actionable (max 1-2 sentences).
4. Return ONLY valid JSON format with the following keys exactly: "category", "priority", "department", "summary". No other text.

Issue description:
"{description}"
"""

DUPLICATE_DETECTION_PROMPT = """You are an AI assistant helping to detect duplicate maintenance issues.
Compare the NEW ISSUE with the list of RECENT ISSUES.
Determine if the NEW ISSUE is likely a duplicate of any of the RECENT ISSUES.

Return a duplicate_score between 0.0 (completely distinct) and 1.0 (exact duplicate).
Generally, a score > 0.7 means it's highly likely to be the same underlying problem.

Return ONLY valid JSON format with the following keys exactly: "duplicate_score", "reason". No other text.

NEW ISSUE:
"{description}"

RECENT ISSUES:
{existing_issues}
"""
