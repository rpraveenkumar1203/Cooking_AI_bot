from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")

class DishRequest(BaseModel):
    dish: str

@app.post("/api/get-recipe")
async def get_recipe(request: DishRequest):
    try:
        completion = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional chef assistant. Explain cooking steps clearly, step-by-step."},
                {"role": "user", "content": f"Give me a step-by-step recipe for {request.dish}."},
            ],
            temperature=0.5,
            max_tokens=500
        )
        response_text = completion['choices'][0]['message']['content']
        steps = [line for line in response_text.split("\n") if line.strip()]
        return {"steps": steps}
    except Exception as e:
        return {"error": str(e)}
