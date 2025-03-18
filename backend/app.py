import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import markdown2  # Add this import

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OpenAI API key not found in environment variables")
client = OpenAI(api_key=openai_api_key)

def generate_table_of_contents(topic):
    try:
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

        user_prompt = f"""Create a detailed table of contents for a comprehensive textbook about {topic}.
        The response must exactly match this JSON structure: {json.dumps(example_structure, indent=2)}
        
        Requirements:
        1. Make the content comprehensive and well-structured
        2. Ensure the book title is descriptive and engaging
        3. All descriptions should be clear and concise
        4. Learning outcomes should be specific and measurable
        5. Maintain consistent numbering throughout
        6. Target audience and prerequisites should be relevant to {topic}
        
        Return only valid JSON matching the structure shown."""

        logger.info(f"Generating table of contents for topic: {topic}")
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        # Validate JSON structure
        toc = json.loads(content)
        return toc
        
    except Exception as e:
        logger.error(f"Error in generate_table_of_contents: {str(e)}", exc_info=True)
        raise

@app.route('/api/generate-toc', methods=['POST'])
def generate_toc():
    try:
        data = request.json
        if not data or 'topic' not in data:
            return jsonify({
                "status": "error",
                "message": "Topic is required",
                "code": "MISSING_TOPIC"
            }), 400
            
        topic = data['topic']
        logger.info(f"Received request to generate TOC for topic: {topic}")
        
        toc = generate_table_of_contents(topic)
        
        return jsonify({
            "status": "success",
            "data": toc,
            "message": "Table of contents generated successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating TOC: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e),
            "code": "GENERATION_ERROR"
        }), 500

def generate_subsection_content(topic, chapter_title, section_title, subsection_title):
    try:
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
           - Blockquotes: Use > for important notes

        Example Format:
        # Subsection Title

        Brief introduction to the topic and what will be covered.

        ## Main Concept 1

        Explanation of the first main concept.

        ### Sub-topic 1.1

        Detailed explanation with examples.

        ```python
        # Code example
        def example():
            return "This is a code example"
        ```

        ## Practice Exercises

        1. First exercise
        2. Second exercise

        ## Key Takeaways

        * First key point
        * Second key point"""

        user_prompt = f"""Create detailed educational content for:
        Topic: {topic}
        Chapter: {chapter_title}
        Section: {section_title}
        Subsection: {subsection_title}

        Structure the content EXACTLY as follows:
        1. # {subsection_title} (as main heading)
        2. Introduction paragraph
        3. ## Concepts and Theory
        4. ## Examples and Implementation
        5. ## Practice Exercises
        6. ## Key Takeaways

        Requirements:
        - Use proper markdown syntax for all formatting
        - Include code examples with language specification
        - Use tables where appropriate
        - Include at least 3 practice exercises
        - List 4-5 key takeaways
        - Use blockquotes (>) for important notes or tips
        - Use bold (**) for important terms
        - Use proper heading hierarchy (# ## ###)"""

        logger.info(f"Generating content for subsection: {subsection_title}")
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        content = response.choices[0].message.content
        
        # Ensure content starts with a proper heading
        if not content.startswith('# '):
            content = f"# {subsection_title}\n\n{content}"
        
        return {
            "content": content,
            "metadata": {
                "topic": topic,
                "chapter": chapter_title,
                "section": section_title,
                "subsection": subsection_title
            }
        }
    except Exception as e:
        logger.error(f"Error generating content for subsection {subsection_title}: {str(e)}", exc_info=True)
        raise

@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required",
                "code": "MISSING_DATA"
            }), 400

        required_fields = ['topic', 'chapter_title', 'section_title', 'subsection_title']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}",
                "code": "MISSING_FIELDS"
            }), 400

        content = generate_subsection_content(
            topic=data['topic'],
            chapter_title=data['chapter_title'],
            section_title=data['section_title'],
            subsection_title=data['subsection_title']
        )

        return jsonify({
            "status": "success",
            "data": content,
            "message": "Content generated successfully"
        }), 200

    except Exception as e:
        logger.error(f"Error generating content: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e),
            "code": "GENERATION_ERROR"
        }), 500

def clean_content(content):
    # Remove excessive newlines while preserving markdown structure
    lines = content.split('\n')
    cleaned_lines = []
    prev_empty = False
    
    for line in lines:
        # Skip empty lines if previous line was empty
        if not line.strip():
            if not prev_empty:
                cleaned_lines.append(line)
                prev_empty = True
            continue
        else:
            prev_empty = False
        
        # Clean up excessive spaces while preserving code blocks
        if not line.strip().startswith('```'):
            line = ' '.join(line.split())
        
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def convert_markdown_to_html(markdown_content):
    # Clean the content first
    cleaned_content = clean_content(markdown_content)
    
    # Initialize markdown converter with extras
    markdown_converter = markdown2.Markdown(extras=[
        'fenced-code-blocks',
        'tables',
        'break-on-newline',
        'cuddled-lists',
        'target-blank-links',
        'header-ids',
        'task_list'
    ])
    
    # Convert markdown to HTML
    html_content = markdown_converter.convert(cleaned_content)
    
    # Add syntax highlighting CSS and better spacing
    html_template = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Content</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }}
        pre {{
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            overflow: auto;
            margin: 16px 0;
        }}
        code {{
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 14px;
            padding: 0.2em 0.4em;
            background-color: rgba(27,31,35,0.05);
            border-radius: 3px;
        }}
        pre code {{
            padding: 0;
            background-color: transparent;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            margin: 16px 0;
            padding: 0 16px;
            color: #666;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background-color: #f6f8fa;
        }}
        h1, h2, h3, h4, h5, h6 {{
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }}
        h1 {{ 
            font-size: 2em;
            border-bottom: 1px solid #eee;
            padding-bottom: 0.3em;
        }}
        h2 {{ 
            font-size: 1.5em;
            border-bottom: 1px solid #eee;
            padding-bottom: 0.3em;
        }}
        h3 {{ font-size: 1.25em; }}
        p {{ margin: 16px 0; }}
        ul, ol {{ 
            margin: 16px 0;
            padding-left: 32px;
        }}
        li {{ margin: 8px 0; }}
        img {{ 
            max-width: 100%;
            margin: 16px 0;
        }}
        hr {{
            height: 1px;
            background-color: #ddd;
            border: none;
            margin: 24px 0;
        }}
    </style>
</head>
<body>
    {html_content}
    <script>
        // Ensure all code blocks are properly highlighted
        document.addEventListener('DOMContentLoaded', (event) => {{
            document.querySelectorAll('pre code').forEach((block) => {{
                hljs.highlightBlock(block);
            }});
        }});
    </script>
</body>
</html>"""
    
    return html_template

@app.route('/api/generate-content-html', methods=['POST'])
def generate_content_html():
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "Request body is required",
                "code": "MISSING_DATA"
            }), 400

        required_fields = ['topic', 'chapter_title', 'section_title', 'subsection_title']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(missing_fields)}",
                "code": "MISSING_FIELDS"
            }), 400

        # Generate markdown content
        content_response = generate_subsection_content(
            topic=data['topic'],
            chapter_title=data['chapter_title'],
            section_title=data['section_title'],
            subsection_title=data['subsection_title']
        )

        # Convert markdown to HTML
        html_content = convert_markdown_to_html(content_response['content'])

        return jsonify({
            "status": "success",
            "data": {
                "html": html_content,
                "metadata": content_response['metadata']
            },
            "message": "HTML content generated successfully"
        }), 200

    except Exception as e:
        logger.error(f"Error generating HTML content: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e),
            "code": "GENERATION_ERROR"
        }), 500

if __name__ == '__main__':
    try:
        logger.info("Starting Flask application...")
        app.run(host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        raise 