from qdrant_client import QdrantClient, models
import os 
import logging
from dotenv import load_dotenv, find_dotenv
import sys
load_dotenv(find_dotenv())


logger = logging.getLogger("mylogger")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)

# Formatter with color support (matches uvicorn's log colorization)
formatter = logging.Formatter('%(levelname)s: %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

qdrant_url = os.getenv('QDRANT_CLOUD_URL', 'https://bee4028a-8dd6-4e05-8875-cfe2fea0d4a0.us-east-1-0.aws.cloud.qdrant.io:6333')

client = QdrantClient(url=qdrant_url,api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.7xq9RsFzyHHEz9O4b_heM7697yDjKeUZCHNGWi6QrMk")
print(client.get_collections())
collection_exists = client.collection_exists("blaze")
logger.info(f"Collection Exists: {collection_exists}")

if not collection_exists:
    client.create_collection(
        collection_name="blaze",
        vectors_config=models.VectorParams(size=128, distance=models.Distance.COSINE)
    )

    logger.info("Created New Collection Successfully")
