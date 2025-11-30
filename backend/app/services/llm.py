import google.generativeai as genai
from app.core.config import get_settings
import json

settings = get_settings()

genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel('gemini-2.5-flash') # Or pro

import logging

async def generate_content(prompt: str) -> str:
    response = await model.generate_content_async(prompt)
    return response.text

async def extract_topics(text: str) -> list:
    prompt = f"""
    Analyze the following text and extract key topics. 
    Return a JSON list of strings.
    Text: {text[:10000]}... (truncated)
    """
    # In real app, handle truncation or chunking better
    response = await generate_content(prompt)
    # Parse JSON from response (might need cleaning)
    result = _parse_json(response)
    return result if isinstance(result, list) else []

async def generate_explanations(text: str, topics: list) -> dict:
    prompt = f"""
    For each of the following topics, provide a detailed explanation based on the text.
    Topics: {topics}
    Text: {text[:10000]}...
    Return a JSON object where keys are topics and values are explanations.
    """
    response = await generate_content(prompt)
    result = _parse_json(response)
    return result if isinstance(result, dict) else {}

async def generate_mind_tree(text: str) -> dict:
    prompt = f"""
    Create a hierarchical mind map of the concepts in the text.
    Return a JSON structure representing the tree.
    Text: {text[:10000]}...
    """
    response = await generate_content(prompt)
    result = _parse_json(response)
    return result if isinstance(result, dict) else {}

async def generate_predicted_questions(text: str) -> list:
    prompt = f"""
    Predict 5 potential exam questions based on the text.
    Return a JSON list of objects with 'question' and 'answer' keys.
    Text: {text[:10000]}...
    """
    response = await generate_content(prompt)
    result = _parse_json(response)
    return result if isinstance(result, list) else []

def _parse_json(text: str):
    # Helper to extract JSON from LLM response (often wrapped in ```json ... ```)
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}
