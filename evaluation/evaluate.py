import json
import requests
import os
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper

# CONFIG
API_URL = "http://localhost:3003/document/query"
DOCUMENT_ID = "5a3ec33d-0d1a-4f64-ab9b-329462032c80"
GEMINI_API_KEY = "AQ.Ab8RN6K_IPXNN0HkuIwDd92Bb6csAEb7t2Xz8OZqoOklWzWiBA"

# SETUP GEMINI
llm = LangchainLLMWrapper(ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=GEMINI_API_KEY))
embeddings = LangchainEmbeddingsWrapper(GoogleGenerativeAIEmbeddings(model="gemini-embedding-2-preview", google_api_key=GEMINI_API_KEY))

# LOAD TEST DATASET
with open("test_dataset.json") as f:
    test_dataset = json.load(f)

# CALL API FOR EACH QUESTION
questions = []
answers = []
contexts = []
ground_truths = []

import time

for item in test_dataset:
    response = requests.post(API_URL, json={
        "question": item["question"],
        "documentId": DOCUMENT_ID
    })
    data = response.json()

    questions.append(item["question"])
    answers.append(data["answer"])
    contexts.append([source["content"] for source in data["sources"]])
    ground_truths.append(item["ground_truth"])
    
    time.sleep(90)

# BUILD RAGAS DATASET
dataset = Dataset.from_dict({
    "question": questions,
    "answer": answers,
    "contexts": contexts,
    "ground_truth": ground_truths
})

# EVALUATE
result = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
    llm=llm,
    embeddings=embeddings
)

print(result)