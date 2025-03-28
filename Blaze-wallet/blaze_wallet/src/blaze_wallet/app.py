from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.responses import JSONResponse
from tensorflow.keras.models import load_model
from keras.preprocessing import image
from qdrant_client import QdrantClient
from qdrant_client.http import models
from dotenv import load_dotenv, find_dotenv
import numpy as np
import logging
import os
import sys
import io
from PIL import Image
import face_recognition
import cv2
from fastapi.middleware.cors import CORSMiddleware
from blaze_wallet.utils.utils import get_face_encoding_from_bytes, upsert_face_data
from uuid import uuid4
import random

# Loading ENV VARS
load_dotenv(find_dotenv())

app = FastAPI()

origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

logger = logging.getLogger("uvicorn")
save_path = '.'
model = load_model(os.path.join(save_path, "liveness.h5"))

qdrant_url = os.getenv('QDRANT_CLOUD_URL', 'https://bee4028a-8dd6-4e05-8875-cfe2fea0d4a0.us-east-1-0.aws.cloud.qdrant.io:6333')
client = QdrantClient(url=qdrant_url, api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.7xq9RsFzyHHEz9O4b_heM7697yDjKeUZCHNGWi6QrMk")

# Simple word list for passphrase generation (expand this for production)
WORD_LIST = [
    "apple", "blue", "cat", "dog", "echo", "fish", "green", "hat", "ice", "jump",
    "kite", "moon", "net", "orange", "pen", "quiet", "red", "sun", "tree", "wind"
]

def generate_unique_passphrase():
    """Generate a unique 6 or 7-word passphrase."""
    length = 7  # Randomly choose 6 or 7 words
    while True:
        passphrase_words = random.sample(WORD_LIST, length)
        passphrase = " ".join(passphrase_words)
        # Check if passphrase exists in Qdrant
        result = client.scroll(
            collection_name="blaze",
            scroll_filter=models.Filter(
                must=[models.FieldCondition(key="passphrase", match=models.MatchValue(value=passphrase))]
            ),
            limit=1
        )
        if not result[0]:  # If no match found, passphrase is unique
            return passphrase

# Predict endpoint (unchanged)
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    prediction = predict_image(img_bytes)
    score = prediction[0][0]  # Extracting the score from prediction array

    if score < 0.5:
        return JSONResponse(content={
            "result": "Real",
            "probability": str(round(100 * (1 - score), 2))
        })
    else:
        return JSONResponse(content={
            "result": "Spoof",
            "probability": str(round(100 * score, 2))
        })

def predict_image(img_bytes: bytes):
    img = Image.open(io.BytesIO(img_bytes))
    img = img.resize((128, 128))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array /= 255.0
    prediction = model.predict(img_array)
    return prediction

# Updated register endpoint with new passphrase logic
@app.post("/register")
async def upsert_user_face(request: Request):
    content_type = request.headers.get('Content-Type', '')
    
    if content_type.startswith('multipart/form-data'):
        form = await request.form()
        file = form.get('image')
        username = form.get('name')
        if not file:
            return JSONResponse(status_code=400, content={"success": False, "message": "No image file provided"})
        img_bytes = await file.read()
        await file.seek(0)
    else:
        img_bytes = await request.body()
        username = request.query_params.get('username', '')

    realness = predict_image(img_bytes)
    logger.info(realness)
    if realness[0][0] >= 0.5:
        return JSONResponse(content={"success": False, "message": "Spoof detected. Please try again."})

    encoding = await get_face_encoding_from_bytes(img_bytes)
    collection_name = "blaze"
    
    if not encoding:
        return JSONResponse(content={"success": False, "message": "No face detected in the image. Please try again."})

    try:
        wallet_address = f"0x{uuid4().hex[:40]}"
        passphrase = generate_unique_passphrase()  # New passphrase generation
        await upsert_face_data(client, encoding, collection_name, username, wallet_address, passphrase)
        
        return JSONResponse(content={
            "success": True,
            "message": "Face registration successful",
            "wallet_address": wallet_address,
            "passphrase": passphrase
        })
    except Exception as e:
        logger.error(f"Error during face data upsert: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error during registration: {str(e)}"})

# Login endpoint (unchanged)
@app.post("/login")
async def authenticate_user(request: Request):
    content_type = request.headers.get('Content-Type', '')
    
    if content_type.startswith('multipart/form-data'):
        form = await request.form()
        file = form.get('image')
        passphrase = form.get('passphrase')
        if not file:
            return JSONResponse(status_code=400, content={"success": False, "message": "No image file provided"})
        img_bytes = await file.read()
        await file.seek(0)
    else:
        img_bytes = await request.body()
        passphrase = request.query_params.get('passphrase', '')

    if not passphrase:
        return JSONResponse(status_code=400, content={"success": False, "message": "Passphrase is required"})

    realness = predict_image(img_bytes)
    logger.info(f"Liveness score: {realness}")
    if realness[0][0]  >= 0.5:
        return JSONResponse(content={"success": False, "message": "Spoof detected. Authentication failed."})

    encoding = await get_face_encoding_from_bytes(img_bytes)
    if not encoding:
        return JSONResponse(content={"success": False, "message": "No face detected in the image. Authentication failed."})

    collection_name = "blaze"
    
    try:
        search_result = client.search(
            collection_name=collection_name,
            query_vector=encoding,
            query_filter=models.Filter(
                must=[models.FieldCondition(key="passphrase", match=models.MatchValue(value=passphrase))]
            ),
            limit=1
        )
        
        if not search_result:
            return JSONResponse(content={"success": False, "message": "No matching user found."})

        matched_point = search_result[0]
        payload = matched_point.payload
        
        return JSONResponse(content={
            "success": True,
            "message": "Authentication successful",
            "user": {
                "name": payload["name"],
                "wallet_address": payload["wallet_address"],
                "passphrase": payload["passphrase"],
                "balance": payload["balance"]
            },
            "similarity_score": matched_point.score
        })
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Authentication error: {str(e)}"})

# Dashboard endpoint (unchanged)
@app.get("/dashboard")
async def get_user_data(wallet_address: str):
    try:
        search_result = client.scroll(
            collection_name="blaze",
            scroll_filter=models.Filter(
                must=[models.FieldCondition(key="wallet_address", match=models.MatchValue(value=wallet_address))]
            ),
            limit=1
        )
        
        if not search_result[0]:
            return JSONResponse(status_code=404, content={"success": False, "message": "User not found"})
        
        user_point = search_result[0][0]
        payload = user_point.payload
        
        return JSONResponse(content={
            "success": True,
            "user": {
                "name": payload["name"],
                "balance": payload["balance"],
                "wallet_address": payload["wallet_address"]
            }
        })
    except Exception as e:
        logger.error(f"Error fetching user data: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error: {str(e)}"})

@app.post("/send")
async def send_transaction(request: Request):
    content_type = request.headers.get('Content-Type', '')
    
    if content_type.startswith('multipart/form-data'):
        form = await request.form()
        file = form.get('image')
        sender_address = form.get('sender_address').strip().lower()  # Trim and normalize to lowercase
        recipient_address = form.get('recipient_address').strip()  # Trim and normalize to lowercase
        amount = form.get('amount')
        if not file or not sender_address or not recipient_address or not amount:
            return JSONResponse(status_code=400, content={"success": False, "message": "Missing required fields"})
        img_bytes = await file.read()
        await file.seek(0)
    else:
        return JSONResponse(status_code=400, content={"success": False, "message": "Only multipart/form-data supported"})

    # Face verification
    realness = predict_image(img_bytes)
    if realness[0][0] >= 0.5:  # Higher score = more live, fail if <= 0.5
        return JSONResponse(content={"success": False, "message": "Spoof detected. Transaction failed."})

    encoding = await get_face_encoding_from_bytes(img_bytes)
    if not encoding:
        return JSONResponse(content={"success": False, "message": "No face detected. Transaction failed."})

    try:
        # Dummy vector for search
        dummy_vector = [0.0] * 128

        # Find sender by wallet_address using client.search
        sender_result = client.search(
            collection_name="blaze",
            query_vector=dummy_vector,
            query_filter=models.Filter(
                must=[models.FieldCondition(key="wallet_address", match=models.MatchValue(value=sender_address))]
            ),
            limit=1,
            with_payload=True,
            with_vectors=False
        )
        if not sender_result:
            return JSONResponse(content={"success": False, "message": "Sender not found"})
        
        sender_point = sender_result[0]
        sender_id = sender_point.id
        sender_balance = sender_point.payload["balance"]
        amount_float = float(amount)
        
        if sender_balance < amount_float:
            return JSONResponse(content={"success": False, "message": "Insufficient balance"})

        # Find recipient by wallet_address using client.search
        recipient_result = client.search(
            collection_name="blaze",
            query_vector=dummy_vector,
            query_filter=models.Filter(
                must=[models.FieldCondition(key="wallet_address", match=models.MatchValue(value=recipient_address))]
            ),
            limit=1,
            with_payload=True,
            with_vectors=False
        )
        if not recipient_result:
            return JSONResponse(content={"success": False, "message": "Recipient not found"})
        
        recipient_point = recipient_result[0]
        recipient_id = recipient_point.id
        recipient_balance = recipient_point.payload["balance"]

        # Update balances locally
        new_sender_balance = sender_balance - amount_float
        new_recipient_balance = recipient_balance + amount_float

        # Update balance field in Qdrant for sender
        client.set_payload(
            collection_name="blaze",
            payload={"balance": new_sender_balance},
            points=[sender_id]
        )
        # Update balance field in Qdrant for recipient
        client.set_payload(
            collection_name="blaze",
            payload={"balance": new_recipient_balance},
            points=[recipient_id]
        )
        
        return JSONResponse(content={"success": True, "message": "Transaction successful"})
    except Exception as e:
        logger.error(f"Transaction error: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Transaction error: {str(e)}"})


# Receive endpoint (unchanged)
@app.get("/receive")
async def get_wallet_address(wallet_address: str):
    try:
        search_result = client.scroll(
            collection_name="blaze",
            scroll_filter=models.Filter(
                must=[models.FieldCondition(key="wallet_address", match=models.MatchValue(value=wallet_address))]
            ),
            limit=1
        )
        
        if not search_result[0]:
            return JSONResponse(status_code=404, content={"success": False, "message": "User not found"})
        
        user_point = search_result[0][0]
        
        return JSONResponse(content={
            "success": True,
            "wallet_address": user_point.payload["wallet_address"]
        })
    except Exception as e:
        logger.error(f"Error fetching wallet address: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error: {str(e)}"})