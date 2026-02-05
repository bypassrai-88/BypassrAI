# DIPPER Deployment for RunPod Serverless

This folder contains everything needed to deploy DIPPER on RunPod Serverless.

## Option A: Use Pre-built Template (Easier)

RunPod has a template system. You can create a serverless endpoint directly from the dashboard.

## Option B: Build & Push Docker Image (More Control)

### 1. Build the Docker image
```bash
cd runpod-dipper
docker build -t your-dockerhub-username/dipper-paraphraser:latest .
```

### 2. Push to Docker Hub
```bash
docker login
docker push your-dockerhub-username/dipper-paraphraser:latest
```

### 3. Create RunPod Serverless Endpoint
1. Go to RunPod Dashboard → Serverless
2. Click "New Endpoint"
3. Enter your Docker image: `your-dockerhub-username/dipper-paraphraser:latest`
4. Select GPU: A10 24GB (recommended)
5. Set min workers: 0 (scale to zero)
6. Set max workers: 3 (scale up as needed)
7. Click Create

### 4. Get Endpoint ID
After creating, copy the Endpoint ID and add to `.env.local`:
```
RUNPOD_ENDPOINT_ID=your_endpoint_id_here
```

## Testing

```bash
curl -X POST "https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/runsync" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "text": "The quick brown fox jumps over the lazy dog.",
      "lex_diversity": 60,
      "order_diversity": 40
    }
  }'
```

## Parameters

- `text`: The text to paraphrase
- `lex_diversity`: 0-100, how much to change words (60 recommended)
- `order_diversity`: 0-100, how much to reorder content (40 recommended)
