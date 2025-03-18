# Textbook Content Generator

This application generates textbook content using ChatGPT API. It can create a table of contents and detailed content for each section of the book.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the backend directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the Flask application:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### 1. Generate Table of Contents
- **Endpoint**: `/api/generate-toc`
- **Method**: POST
- **Request Body**:
```json
{
    "topic": "Your topic here"
}
```
- **Response**: JSON containing the table of contents structure

### 2. Generate Section Content
- **Endpoint**: `/api/generate-section`
- **Method**: POST
- **Request Body**:
```json
{
    "topic": "Your topic here",
    "chapter_title": "Chapter title",
    "section_title": "Section title"
}
```
- **Response**: Markdown content for the specified section

## Response Formats

### Table of Contents Format
```json
{
    "title": "Book Title",
    "chapters": [
        {
            "chapter_number": 1,
            "title": "Chapter Title",
            "sections": [
                {
                    "section_number": "1.1",
                    "title": "Section Title",
                    "learning_outcomes": [
                        "Learning outcome 1",
                        "Learning outcome 2"
                    ]
                }
            ]
        }
    ]
}
```

### Section Content Format
The section content is returned in markdown format, including:
- Headings
- Code snippets
- Examples
- Diagrams (in markdown format)
- Practice problems 