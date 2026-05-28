from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import ollama
import glob
import os
import shutil

#loading pdf's using glob.glob for this

all_pages = []
for pdf_file in glob.glob("*.pdf"):
    print(f"Reading: {pdf_file}")
    loader = PyPDFLoader(pdf_file)
    all_pages.extend(loader.load())
print(f"Total pages loaded: {len(all_pages)}")

#Combing all the data into one big string

full_text = ""
for page in all_pages:
    full_text += page.page_content

#chunking

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_text(full_text)
print(f"Total chunks: {len(chunks)}")

#embedding and saving them into chromadB

if os.path.exists("chroma_db"):
    shutil.rmtree("chroma_db")
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vector_db = Chroma.from_texts(
    texts=chunks,
    embedding=embedding_model,
    persist_directory="chroma_db"
)
print("Vector database ready.")

#Querying

print("\nChatbot ready! Type your question. Type quit to stop.\n")
while True:
    question = input("You: ")
    if question == "quit":
        break
    # similarity search 
    matches = vector_db.similarity_search(question, k=2)
    # context creation
    context = ""
    for match in matches:
        context += match.page_content + "\n\n"
    # send context + question to ollama
    response = ollama.chat(
    model="phi3",
    messages=[
        {
            "role": "user",
            "content": f"""
Use the provided context to answer the question.
you are a helpful mental assistance bot that understand and summarizes points in a easy understandable way without jaragon. give answer in 2 points for the asked query
If the answer is not in the context, say:
"That falls out of my current knowledge and i dont have the exact details."
Context:{context} Question:{question}
"""
        }
    ]
)
    print("\nBot:", response["message"]["content"])
    print("\n" + "-"*40 + "\n")
