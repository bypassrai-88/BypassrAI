"""
DIPPER Paraphraser Service on Modal
Deploy with: modal deploy dipper_service.py
"""

import modal

# Create the Modal app
app = modal.App("dipper-paraphraser")

# Define the container image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "torch>=2.0.0",
        "transformers>=4.30.0",
        "accelerate>=0.20.0",
        "nltk>=3.8.0",
        "sentencepiece>=0.1.99",
    )
    .run_commands(
        "python -c \"import nltk; nltk.download('punkt'); nltk.download('punkt_tab')\""
    )
)

# GPU configuration - A10G has 24GB, good for DIPPER in FP16
gpu_config = modal.gpu.A10G()


@app.cls(
    image=image,
    gpu=gpu_config,
    timeout=300,  # 5 minute timeout
    container_idle_timeout=300,  # Keep warm for 5 min after last request
)
class DipperModel:
    """DIPPER Paraphraser Model"""
    
    @modal.enter()
    def load_model(self):
        """Load model when container starts (runs once)"""
        import torch
        from transformers import T5Tokenizer, T5ForConditionalGeneration
        
        print("Loading DIPPER model...")
        self.tokenizer = T5Tokenizer.from_pretrained('google/t5-v1_1-xxl')
        self.model = T5ForConditionalGeneration.from_pretrained(
            'kalpeshk2011/dipper-paraphraser-xxl',
            torch_dtype=torch.float16,
            device_map='auto'
        )
        self.model.eval()
        print("DIPPER model loaded!")
    
    @modal.method()
    def paraphrase(self, text: str, lex_diversity: int = 60, order_diversity: int = 40) -> str:
        """
        Paraphrase text using DIPPER
        
        Args:
            text: Text to paraphrase
            lex_diversity: 0-100, higher = more word changes (60 recommended)
            order_diversity: 0-100, higher = more reordering (40 recommended)
        
        Returns:
            Paraphrased text
        """
        import torch
        from nltk import sent_tokenize
        
        # DIPPER uses inverse coding
        lex_code = 100 - lex_diversity
        order_code = 100 - order_diversity
        
        # Clean input
        text = " ".join(text.split())
        sentences = sent_tokenize(text)
        
        output_text = ""
        prefix = ""
        sent_interval = 3
        
        for sent_idx in range(0, len(sentences), sent_interval):
            curr_sent_window = " ".join(sentences[sent_idx:sent_idx + sent_interval])
            
            final_input_text = f"lexical = {lex_code}, order = {order_code}"
            if prefix:
                final_input_text += f" {prefix}"
            final_input_text += f" <sent> {curr_sent_window} </sent>"
            
            inputs = self.tokenizer(
                [final_input_text], 
                return_tensors="pt", 
                max_length=1024, 
                truncation=True
            )
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            with torch.inference_mode():
                outputs = self.model.generate(
                    **inputs,
                    max_length=1024,
                    do_sample=True,
                    top_p=0.75,
                    num_return_sequences=1
                )
            
            decoded = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
            prefix += " " + decoded
            output_text += " " + decoded
        
        return output_text.strip()


# Create a web endpoint for easy calling
@app.function(image=image)
@modal.web_endpoint(method="POST")
def paraphrase_endpoint(item: dict):
    """
    Web endpoint to call DIPPER
    
    POST body: {"text": "...", "lex_diversity": 60, "order_diversity": 40}
    """
    text = item.get("text", "")
    if not text:
        return {"error": "No text provided"}
    
    lex_diversity = item.get("lex_diversity", 60)
    order_diversity = item.get("order_diversity", 40)
    
    model = DipperModel()
    result = model.paraphrase.remote(text, lex_diversity, order_diversity)
    
    return {"paraphrased": result}


# For testing locally
if __name__ == "__main__":
    # Test the model
    model = DipperModel()
    result = model.paraphrase.local(
        "The quick brown fox jumps over the lazy dog. This is a test sentence.",
        lex_diversity=60,
        order_diversity=40
    )
    print(f"Result: {result}")
