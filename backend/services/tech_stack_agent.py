import os
from openai import OpenAI
from backend.models import TechStackPrompts
from backend.schemas import TechStackPromptCreate
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging
from sqlalchemy.future import select

# Configure loggingss
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TechStackAgent:
    def __init__(self):
        token = os.environ["OPENAI_API_KEY"]
        endpoint = "https://models.inference.ai.azure.com"
        self.client = OpenAI(
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

    # ✅ Generate Interview Prompt (Async)
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

    # ✅ Save Prompt to Database (Async)
    async def save_prompt_to_db(
        self, db: AsyncSession, prompt_data: TechStackPromptCreate
    ) -> Optional[TechStackPrompts]:
        try:
            db_prompt = TechStackPrompts(
                tech_stack=prompt_data.tech_stack,
                difficulty=prompt_data.difficulty,
                generated_prompt=prompt_data.generated_prompt
            )
            db.add(db_prompt)
            await db.commit()
            await db.refresh(db_prompt)
            return db_prompt
        except Exception as e:
            logger.error(f"Failed to save prompt to database: {str(e)}")
            await db.rollback()
            return None

    # ✅ Fetch Existing Prompt by Tech Stack & Difficulty (Async)
    async def get_existing_prompt(
        self, db: AsyncSession, tech_stack: str, difficulty: str
    ) -> Optional[TechStackPrompts]:
        try:
            query = select(TechStackPrompts).where(
                (TechStackPrompts.tech_stack == tech_stack)
                & (TechStackPrompts.difficulty == difficulty)
            )
            result = await db.execute(query)
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Failed to fetch existing prompt: {str(e)}")
            return None
