from qdrant_client import QdrantClient, models
from typing import List
from fastapi import FastAPI, File, UploadFile, Request, Form
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from PIL import Image
import io
import logging
from uuid import uuid4
import face_recognition

logger = logging.getLogger("Agent")

async def get_face_encoding_from_bytes(img_bytes: bytes):
    image_obj = Image.open(io.BytesIO(img_bytes))
    image_array = np.array(image_obj)
    rgb_image_array = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
    locations = face_recognition.face_locations(rgb_image_array)
    encodings = face_recognition.face_encodings(rgb_image_array, locations)
    if encodings:
        return list(encodings[0])
    return None

async def upsert_face_data(client: QdrantClient, encoding: List[float], collection_name: str, username: str, wallet_address: str, passphrase: str):
    try:
        client.upsert(
            collection_name=collection_name,
            points=[
                models.PointStruct(
                    id=str(uuid4()),
                    payload={
                        "name": username,
                        "wallet_address": wallet_address,
                        "passphrase": passphrase,
                        "balance": 50.0  # Default balance
                    },
                    vector=encoding
                )
            ]
        )
    except Exception as e:
        logger.info(f"Error Upserting Face Data - {e}")
        raise e

async def get_face_encoding(file: UploadFile = File(...)):
    img_bytes = await file.read()
    return await get_face_encoding_from_bytes(img_bytes)