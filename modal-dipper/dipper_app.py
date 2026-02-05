"""
DIPPER Paraphraser on Modal
No Docker needed - just Python!
"""

import modal

# Define the Modal app
app = modal.App("dipper-paraphraser")

# Define the container image with all dependencies
image = modal.Image.debian_slim(python_version="3.10").pip_install(
    "torch",
    "transformers>=4.40.0",
    "accelerate>=0.28.0",
    "bitsandbytes>=0.42.0",
    "nltk>=3.8.0",
    "tokenizers>=0.15.0",
    "fastapi[standard]",
)

# Create a class that holds the model in GPU memory
@app.cls(
    image=image,
    gpu="A10G",  # 24GB VRAM, good balance of cost/performance
    timeout=600,
    scaledown_window=300,  # Keep warm for 5 minutes
)
class DipperModel:
    @modal.enter()
    def load_model(self):
        """Load model when container starts"""
        import torch
        from transformers import T5TokenizerFast, T5ForConditionalGeneration, BitsAndBytesConfig
        import nltk
        
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        
        print("Loading DIPPER model in 8-bit mode...")
        self.tokenizer = T5TokenizerFast.from_pretrained('t5-base')
        
        # Configure 8-bit quantization
        quantization_config = BitsAndBytesConfig(load_in_8bit=True)
        
        self.model = T5ForConditionalGeneration.from_pretrained(
            'kalpeshk2011/dipper-paraphraser-xxl',
            quantization_config=quantization_config,
            device_map='auto'
        )
        self.model.eval()
        print("DIPPER model loaded successfully!")
    
    @modal.method()
    def paraphrase(self, text: str, lex_diversity: int = 60, order_diversity: int = 40) -> str:
        """Paraphrase text using DIPPER"""
        import torch
        from nltk import sent_tokenize
        
        # DIPPER uses inverse coding
        lex_code = 100 - lex_diversity
        order_code = 100 - order_diversity
        
        # Clean input
        text = " ".join(text.split())
        
        # Split into sentences and process in chunks
        sentences = sent_tokenize(text)
        sent_interval = 3
        
        output_text = ""
        prefix = ""
        
        for sent_idx in range(0, len(sentences), sent_interval):
            curr_sent_window = " ".join(sentences[sent_idx:sent_idx + sent_interval])
            
            # Build input with control codes
            final_input = f"lexical = {lex_code}, order = {order_code}"
            if prefix:
                final_input += f" {prefix}"
            final_input += f" <sent> {curr_sent_window} </sent>"
            
            # Tokenize
            inputs = self.tokenizer(
                [final_input], 
                return_tensors="pt", 
                max_length=1024, 
                truncation=True
            )
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            # Generate
            with torch.inference_mode():
                outputs = self.model.generate(
                    **inputs,
                    max_length=1024,
                    do_sample=True,
                    top_p=0.75,
                    top_k=None,
                    num_return_sequences=1
                )
            
            # Decode
            decoded = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
            
            prefix += " " + decoded
            output_text += " " + decoded
        
        return output_text.strip()


# Web endpoint for API calls
@app.function(image=image, timeout=600)
@modal.fastapi_endpoint(method="POST")
def paraphrase_endpoint(item: dict):
    """HTTP endpoint for paraphrasing"""
    text = item.get("text", "")
    if not text:
        return {"error": "No text provided"}
    
    lex_diversity = item.get("lex_diversity", 60)
    order_diversity = item.get("order_diversity", 40)
    
    # Call the model
    model = DipperModel()
    result = model.paraphrase.remote(text, lex_diversity, order_diversity)
    
    return {"paraphrased": result}


# For local testing
@app.local_entrypoint()
def main():
    model = DipperModel()
    test_text = "The quick brown fox jumps over the lazy dog. This is a test sentence to see how the model works."
    result = model.paraphrase.remote(test_text)
    print(f"Original: {test_text}")
    print(f"Paraphrased: {result}")
