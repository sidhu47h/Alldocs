import os
import json
import logging
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OpenAI API key not found in environment variables")
client = OpenAI(api_key=openai_api_key)

def generate_table_of_contents():
    system_prompt = """You are a textbook content creator. Create a detailed table of contents following these rules:
    1. Always return valid JSON matching the exact structure provided
    2. Each section must have 2-3 subsections
    3. Each chapter must have 2-3 sections
    4. Include 3-4 chapters
    5. Ensure all numbering is correct and sequential
    6. Learning outcomes must be specific and measurable
    7. Do not deviate from the provided JSON structure"""

    example_structure = {
        "title": "Example Book Title",
        "description": "A brief overview of what this book covers",
        "target_audience": "Who this book is for",
        "prerequisites": ["prerequisite 1", "prerequisite 2"],
        "chapters": [
            {
                "chapter_number": 1,
                "title": "Chapter Title",
                "description": "Brief chapter overview",
                "sections": [
                    {
                        "section_number": "1.1",
                        "title": "Section Title",
                        "description": "Brief section overview",
                        "learning_outcomes": [
                            "After completing this section, you will be able to...",
                            "Another specific learning outcome"
                        ],
                        "subsections": [
                            {
                                "subsection_number": "1.1.1",
                                "title": "Subsection Title",
                                "description": "What this subsection covers"
                            }
                        ]
                    }
                ]
            }
        ]
    }

    user_prompt = f"""Create a detailed table of contents for a comprehensive textbook about Python Programming.
    The response must exactly match this JSON structure: {json.dumps(example_structure, indent=2)}"""

    logger.info("Generating table of contents for Python Programming")
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={ "type": "json_object" }
    )
    
    return json.loads(response.choices[0].message.content)

def generate_section_content(chapter_title, section_title, subsection_title):
    system_prompt = """You are a textbook content creator specializing in creating detailed, educational content.
    You MUST follow this exact markdown structure:
    1. Start with a level 1 heading for the subsection title
    2. Follow with a brief introduction paragraph
    3. Use level 2 headings for main points
    4. Use level 3 headings for sub-points
    5. Code blocks MUST use triple backticks with language specification
    6. Use proper markdown for:
       - Bold: **bold text**
       - Italic: *italic text*
       - Lists: Use proper indentation
       - Code: `inline code` or code blocks
       - Tables: Use proper markdown table syntax
       - Blockquotes: Use > for important notes"""

    user_prompt = f"""Create detailed educational content for:
    Topic: Python Programming
    Chapter: {chapter_title}
    Section: {section_title}
    Subsection: {subsection_title}

    Structure the content EXACTLY as follows:
    1. # {subsection_title} (as main heading)
    2. Introduction paragraph
    3. ## Concepts and Theory
    4. ## Examples and Implementation
    5. ## Practice Exercises
    6. ## Key Takeaways"""

    logger.info(f"Generating content for subsection: {subsection_title}")
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    )
    
    content = response.choices[0].message.content
    if not content.startswith('# '):
        content = f"# {subsection_title}\n\n{content}"
    
    return content

def main():
    # Create cache directory
    cache_dir = Path("cache")
    cache_dir.mkdir(exist_ok=True)
    
    try:
        # Generate and save table of contents
        toc = generate_table_of_contents()
        with open(cache_dir / "python_toc.json", "w") as f:
            json.dump(toc, f, indent=2)
        logger.info("Saved table of contents")

        # Generate content for each section
        for chapter in toc["chapters"]:
            chapter_dir = cache_dir / f"chapter_{chapter['chapter_number']}"
            chapter_dir.mkdir(exist_ok=True)
            
            for section in chapter["sections"]:
                # Create a safe filename from section title
                section_filename = f"{section['section_number']}_{section['title'].lower().replace(' ', '_')}.json"
                section_content = {
                    "section_info": section,
                    "subsections": []
                }
                
                for subsection in section["subsections"]:
                    logger.info(f"Processing: Chapter {chapter['chapter_number']} - {section['title']} - {subsection['title']}")
                    
                    content = generate_section_content(
                        chapter_title=chapter["title"],
                        section_title=section["title"],
                        subsection_title=subsection["title"]
                    )
                    
                    section_content["subsections"].append({
                        "subsection_info": subsection,
                        "content": content
                    })
                
                # Save section content
                with open(chapter_dir / section_filename, "w") as f:
                    json.dump(section_content, f, indent=2)
                logger.info(f"Saved content for section: {section['title']}")

        logger.info("Successfully generated and cached all Python content")
        
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    main() 