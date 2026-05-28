from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import ollama
import glob
import os
import shutil

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

print("Loading PDFs...")
all_pages = []
for pdf_file in glob.glob("*.pdf"):
    loader = PyPDFLoader(pdf_file)
    all_pages.extend(loader.load())

full_text = ""
for page in all_pages:
    full_text += page.page_content

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_text(full_text)

embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_db = Chroma.from_texts(texts=chunks, embedding=embedding_model, persist_directory="chroma_db")
print("Ready.")

class Question(BaseModel):
    text: str

@app.post("/chat")
def ask(q: Question):
    matches = vector_db.similarity_search(q.text, k=3)
    context = "\n\n".join([m.page_content for m in matches])
    response = ollama.chat(
    model="phi3",
    messages=[
        {
            "role": "user",
            "content": f"""
Use the provided context to answer the question.
you are a helpful mental assistance bot that understand and summarizes points in a easy understandable way without jargon. Give the answer in 2 points for the asked query also keep the answer in proper alignment.
If the answer is not in the context, say:
"That falls out of my current knowledge and i dont have the exact details."

Context:
{context}

Question:
{q.text}
"""
        }
    ]
)
    return {"answer": response["message"]["content"]}