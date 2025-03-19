import os
from openai import OpenAI
from backend.models import Prompt, Difficulty  # Update to use the unified Prompt model
from backend.schemas import PromptCreate
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from uuid import uuid4
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.future import select
from fastapi import HTTPException

# Configure logging
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
            "EASY": """Create a junior-level voice-based interview prompt for {tech_stack} focusing on:
                    - Basic syntax and concepts explained verbally
                    - Simple problem-solving discussions
                    - Fundamental best practices articulation
                    Include 1-2 discussion topics that the candidate can explain verbally without needing to write code""",
                    
            "MEDIUM": """Create a mid-level voice-based interview prompt for {tech_stack} covering:
                    - Intermediate concepts and patterns to be explained verbally
                    - Debugging scenarios to discuss conceptually
                    - System design basics to articulate verbally
                    Include 2-3 moderate technical discussion points that can be explained without coding""",
                    
            "HARD": """Create a senior-level voice-based interview prompt for {tech_stack} emphasizing:
                    - Advanced system design to be explained verbally
                    - Performance optimization concepts to articulate
                    - Complex problem-solving approaches to discuss
                    - Leadership scenarios to verbalize
                    Include 3-5 challenging topics for verbal discussion without requiring coding"""
        }

    async def generate_prompt(self, tech_stack: str, difficulty: str) -> Optional[dict]:
        try:
            # Normalize the difficulty to uppercase
            difficulty = difficulty.upper()

            # Validate difficulty
            if difficulty not in self.prompt_templates:
                logger.error(f"Invalid difficulty level: {difficulty}. Must be one of {list(self.prompt_templates.keys())}.")
                return None

            # System message for instructing the LLM on how to generate the prompt
            system_message = f"""You are a senior technical interviewer specializing in creating 
                comprehensive, role-specific voice-based interview prompts. Generate detailed prompts 
                for audio-only interviews where candidates will respond verbally without writing code.
                Focus on how candidates can verbally explain concepts, approaches, and solutions.
                The prompt must follow these instructions based on the difficulty:
                - *EASY*: Focus on basic concepts, syntax, and simple problem-solving.
                - *MEDIUM*: Focus on intermediate concepts, debugging, and system design basics.
                - *HARD*: Focus on advanced system design, performance optimization, and complex problem-solving.
                """

            # Log the values being used
            logger.info(f"Generating prompt for tech_stack: {tech_stack}, difficulty: {difficulty}")

            # Request from OpenAI API with the appropriate template
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": self.prompt_templates[difficulty].format(tech_stack=tech_stack)}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            # Parse the raw response and return in the desired structured format
            generated_content = response.choices[0].message.content
            structured_prompt = self.format_response(generated_content, tech_stack, difficulty)
            return structured_prompt
        
        except Exception as e:
            logger.error(f"Prompt generation failed: {str(e)}")
            return None

    def format_response(self, generated_content: str, tech_stack: str, difficulty: str) -> dict:
        """
        This method formats the raw response into a structured JSON response.
        """
        # Extract tech_stack from the title
        title = f"{difficulty} Level {tech_stack} Voice-Based Interview Prompt"
        
        # Replace the placeholder {tech_stack} in the generated content with actual tech_stack value
        content = generated_content.replace("{tech_stack}", tech_stack)

        structured_prompt = {
            "title": title,  # Using the tech_stack directly here for the title
            "sections": [],
            "evaluation_criteria": {}
        }

        # Example raw parsing (it can be refined based on how the model responds)
        sections = [
            {
                "part": "Part 1: Advanced System Design",
                "question": "Design a high-performance system using {tech_stack}. What factors must be considered to optimize the system for speed and scalability?".replace("{tech_stack}", tech_stack),
                "follow_up_questions": [
                    f"How would you handle high traffic and load balancing in a {tech_stack} system?",
                    f"What strategies would you use to ensure fault tolerance and high availability in {tech_stack}?"
                ]
            },
            {
                "part": "Part 2: Performance Optimization",
                "question": f"How would you optimize the performance of an existing {tech_stack} application that’s facing slow response times?",
                "follow_up_questions": [
                    f"What profiling tools would you use to identify bottlenecks in {tech_stack}?",
                    f"Can you describe a time when you optimized a {tech_stack} system and what steps you took?"
                ]
            },
        ]

        structured_prompt["sections"] = sections

        # Add evaluation criteria
        structured_prompt["evaluation_criteria"] = {
            "clarity_of_explanation": "Evaluate how clearly the candidate can articulate concepts.",
            "problem_solving_approach": "Assess the ability to describe debugging approaches.",
            "system_design_understanding": "Evaluate the candidate's ability to break down and design systems.",
            "communication_skills": "Assess structured and effective verbal communication."
        }

        return structured_prompt


    async def save_generated_prompt_to_db(
        self, db: AsyncSession, tech_stack: str, difficulty: str, generated_prompt: dict
    ) -> Optional[Prompt]:
        try:
            # Ensure difficulty is a valid Enum
            difficulty_enum = Difficulty[difficulty.upper()]  # Convert to Difficulty Enum

            # Create new Prompt instance
            db_prompt = Prompt(
                prompt_id=uuid4(),  # Ensure UUID is generated
                content=str(generated_prompt),  # Save as string in DB
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