import os
import io
from minio import Minio
from config import settings

class FileLoader:
    def __init__(self):
        # Handle MinIO endpoint format (strip http:// or https:// if present for MinIO client)
        endpoint = settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", "")
        
        self.client = Minio(
            endpoint,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )

    def download_file(self, file_path: str) -> bytes:
        try:
            response = self.client.get_object(settings.MINIO_BUCKET, file_path)
            file_data = response.read()
            response.close()
            response.release_conn()
            return file_data
        except Exception as e:
            print(f"Error downloading file {file_path}: {e}")
            raise e

file_loader = FileLoader()
