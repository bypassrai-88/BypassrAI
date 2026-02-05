# DIPPER Paraphraser for RunPod Serverless
FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"

# Copy handler
COPY handler.py .

CMD ["python", "-u", "handler.py"]
