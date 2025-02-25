import os
from openai import OpenAI
from backend.models import Prompt , Difficulty # Update to use the unified Prompt model
from backend.schemas import PromptCreate
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from uuid import uuid4
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.future import select
from fastapi import HTTPException

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

    # ✅ Check for Existing Prompt (Async)
    async def get_existing_prompt(self, db: AsyncSession, tech_stack: str, difficulty: str) -> Optional[Prompt]:
        try:
            query = select(Prompt).where(
                (Prompt.name == f"{tech_stack} - {difficulty}")
            )
            result = await db.execute(query)
            return result.scalars().first()
        except Exception as e:
            logger.error(f"Failed to fetch existing prompt: {str(e)}")
            return None

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
            print(response)
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"Prompt generation failed: {str(e)}")
            return None


    async def save_generated_prompt_to_db(
        self, db: AsyncSession, tech_stack: str, difficulty: str, generated_prompt: str
    ) -> Optional[Prompt]:
        try:
            # Ensure difficulty is a valid Enum
            difficulty_enum = Difficulty[difficulty.upper()]  # Convert to Difficulty Enum

            # Create new Prompt instance
            db_prompt = Prompt(
                prompt_id=uuid4(),  # Ensure UUID is generated
                content=generated_prompt,
                tech_stack=tech_stack,
                difficulty=difficulty_enum
            )

            print(f"Saving to DB: {db_prompt}")

            db.add(db_prompt)
            await db.commit()
            await db.refresh(db_prompt)

            return db_prompt

        except KeyError:
            logger.error(f"Invalid difficulty level provided: {difficulty}")
            await db.rollback()
            raise HTTPException(status_code=400, detail="Invalid difficulty level. Use EASY, MEDIUM, or HARD.")

        except SQLAlchemyError as e:
            logger.error(f"Database error while saving generated prompt: {str(e)}")
            await db.rollback()
            raise HTTPException(status_code=500, detail="Database error while saving generated prompt.")

        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            await db.rollback()
            raise HTTPException(status_code=500, detail="Unexpected error occurred while saving prompt.")
