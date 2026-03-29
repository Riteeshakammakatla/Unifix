import json
import logging
import os
from django.conf import settings
from groq import Groq

from .prompts import ISSUE_CLASSIFICATION_PROMPT, DUPLICATE_DETECTION_PROMPT

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        api_key = getattr(settings, 'GROQ_API_KEY', '') or os.environ.get('GROQ_API_KEY', '')
        if api_key:
            self.client = Groq(api_key=api_key)
        else:
            self.client = None
        
        self.model = 'llama-3.3-70b-versatile'

    def analyze_issue(self, description: str) -> dict:
        if not self.client:
            return {
                "category": "General",
                "priority": "Medium",
                "department": "General",
                "summary": description[:100] + "..." if len(description) > 100 else description
            }
            
        prompt = ISSUE_CLASSIFICATION_PROMPT.format(description=description)
        try:
            print(f"--- Sending to LLM ---\n{description}\n----------------------")
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.0,
            )
            response_text = chat_completion.choices[0].message.content
            print(f"--- LLM Response ---\n{response_text}\n--------------------")
            
            # Extract JSON if model wraps in code blocks
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()
                
            result = json.loads(json_str)
            
            # Ensure all keys exist
            for key in ["category", "priority", "department", "summary"]:
                if key not in result:
                    result[key] = "General" if key != "summary" else description[:50]
            
            return result
        except Exception as e:
            print(f"!!! Groq API Error: {e} !!!")
            logger.error(f"Error calling Groq API for analyze_issue: {e}")
            return {
                "category": "General",
                "priority": "Medium",
                "department": "General",
                "summary": description[:100] + "..." if len(description) > 100 else description
            }

    def detect_duplicate(self, description: str, existing_issues: list) -> dict:
        if not self.client:
            return {"duplicate_score": 0.0, "reason": "No API Key fallback"}
            
        if not existing_issues:
             return {"duplicate_score": 0.0, "reason": "No recent issues"}
             
        formatted_issues = "\n".join([f"- ID {i.get('id', 'N/A')}: {i.get('title', 'No Title')} - {i.get('description', '')}" for i in existing_issues])
        prompt = DUPLICATE_DETECTION_PROMPT.format(
            description=description,
            existing_issues=formatted_issues
        )
        try:
            print(f"--- Duplicate Check ---\n{description}\n----------------------")
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.0,
            )
            response_text = chat_completion.choices[0].message.content
            print(f"--- Duplicate Result ---\n{response_text}\n------------------------")
            
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            else:
                json_str = response_text.strip()
                
            return json.loads(json_str)
        except Exception as e:
            print(f"!!! Groq Duplicate Error: {e} !!!")
            logger.error(f"Error calling Groq API for detect_duplicate: {e}")
            return {"duplicate_score": 0.0, "reason": "Error calling LLM fallback"}
