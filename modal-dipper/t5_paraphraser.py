"""
T5-Large Paraphraser on Modal
Much faster than DIPPER XXL (~3GB vs 22GB)
"""

import modal

app = modal.App("t5-paraphraser")

image = modal.Image.debian_slim(python_version="3.10").pip_install(
    "torch",
    "transformers>=4.40.0",
    "accelerate>=0.28.0",
    "sentencepiece",
    "fastapi[standard]",
)

@app.cls(
    image=image,
    gpu="T4",
    timeout=300,
    scaledown_window=300,
)
class T5Paraphraser:
    @modal.enter()
    def load_model(self):
        """Load Flan-T5-base - instruction tuned"""
        import torch
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        
        print("Loading Flan-T5-base...")
        
        model_name = "google/flan-t5-base"
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        self.model.eval()
        print("Flan-T5-base loaded!")
    
    @modal.method()
    def paraphrase(self, text: str, num_variations: int = 1) -> str:
        """Paraphrase text using Flan-T5 - sentence by sentence"""
        import torch
        import re
        
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        
        paraphrased_sentences = []
        
        for sentence in sentences:
            if not sentence.strip():
                continue
            
            # Simple instruction for Flan-T5
            prompt = f"Paraphrase: {sentence}"
            
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                max_length=128,
                truncation=True
            )
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            # Target similar length to input
            input_len = len(self.tokenizer(sentence, return_tensors="pt")["input_ids"][0])
            target_len = int(input_len * 1.1)
            
            with torch.inference_mode():
                outputs = self.model.generate(
                    **inputs,
                    max_length=max(target_len, 30),
                    num_beams=4,
                    no_repeat_ngram_size=2,
                    early_stopping=True,
                )
            
            result = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Clean any weird prefixes the model might add
            result = re.sub(r'^(paraphrase[d]?\s*:?\s*|output\s*:?\s*)', '', result, flags=re.IGNORECASE)
            
            if result.strip():
                paraphrased_sentences.append(result.strip())
        
        return " ".join(paraphrased_sentences)


@app.function(image=image, timeout=300)
@modal.fastapi_endpoint(method="POST")
def paraphrase_endpoint(item: dict):
    """HTTP endpoint"""
    text = item.get("text", "")
    if not text:
        return {"error": "No text provided"}
    
    model = T5Paraphraser()
    result = model.paraphrase.remote(text)
    
    return {"paraphrased": result}


@app.local_entrypoint()
def main():
    model = T5Paraphraser()
    test = "The quick brown fox jumps over the lazy dog. This is a test."
    result = model.paraphrase.remote(test)
    print(f"Original: {test}")
    print(f"Paraphrased: {result}")
