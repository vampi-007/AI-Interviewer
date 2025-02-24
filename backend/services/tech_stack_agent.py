import os
from openai import OpenAI
from models import TechStackPrompts
from schemas import TechStackPromptCreate
from sqlalchemy.orm import Session
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TechStackAgent:
    def __init__(self):
        token = os.environ["GITHUB_TOKEN"]
        endpoint = "https://models.inference.ai.azure.com"
        self.client =  OpenAI(
            base_url=endpoint,
            api_key=token,
        )
        self.prompt_templates = {
            "EASY": """Create a junior-level interview prompt for {tech_stack} focusing on:
                    - Basic syntax and concepts
                    - Simple problem-solving
                    - Fundamental best practices
                    Include 1-2 easy coding exercises""",
                    
            "MEDIUM": """Create a mid-level interview prompt for {tech_stack} covering:
                    - Intermediate concepts and patterns
                    - Debugging scenarios
                    - System design basics
                    Include 2-3 moderate coding challenges""",
                    
            "HARD": """Create a senior-level interview prompt for {tech_stack} emphasizing:
                    - Advanced system design
                    - Performance optimization
                    - Complex problem-solving
                    - Leadership scenarios
                    Include 3-5 challenging exercises"""
        }

    async def generate_prompt(self, tech_stack: str, difficulty: str) -> Optional[str]:
        try:
            system_message = """You are a senior technical interviewer specializing in creating 
                comprehensive, role-specific coding interview prompts. Generate detailed prompts 
                that accurately match the specified difficulty level and technology stack."""
                
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": self.prompt_templates[difficulty].format(tech_stack=tech_stack)}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Prompt generation failed: {str(e)}")
            return None
