"""
DIPPER Handler for RunPod Serverless
This runs on the GPU and processes paraphrasing requests
"""

import runpod
import torch
from transformers import T5TokenizerFast, T5ForConditionalGeneration
from nltk import sent_tokenize
import nltk

# Download nltk data
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

# Global model (loaded once, reused for all requests)
MODEL = None
TOKENIZER = None

def load_model():
    """Load DIPPER model into GPU memory"""
    global MODEL, TOKENIZER
    
    if MODEL is None:
        print("Loading DIPPER model in 8-bit mode...")
        # Use T5TokenizerFast (Rust implementation) to avoid sentencepiece issues
        TOKENIZER = T5TokenizerFast.from_pretrained('t5-base')
        MODEL = T5ForConditionalGeneration.from_pretrained(
            'kalpeshk2011/dipper-paraphraser-xxl',
            load_in_8bit=True,  # 8-bit quantization to fit in 24GB
            device_map='auto'
        )
        MODEL.eval()
        print("DIPPER model loaded successfully!")
    
    return MODEL, TOKENIZER

def paraphrase(input_text: str, lex_diversity: int = 60, order_diversity: int = 40) -> str:
    """
    Paraphrase text using DIPPER
    
    Args:
        input_text: Text to paraphrase
        lex_diversity: 0-100, higher = more lexical changes
        order_diversity: 0-100, higher = more content reordering
    
    Returns:
        Paraphrased text
    """
    model, tokenizer = load_model()
    
    # DIPPER uses inverse coding (100 - diversity = control code)
    lex_code = 100 - lex_diversity
    order_code = 100 - order_diversity
    
    # Clean input
    input_text = " ".join(input_text.split())
    
    # Split into sentences and process in chunks
    sentences = sent_tokenize(input_text)
    sent_interval = 3  # Process 3 sentences at a time
    
    output_text = ""
    prefix = ""
    
    for sent_idx in range(0, len(sentences), sent_interval):
        curr_sent_window = " ".join(sentences[sent_idx:sent_idx + sent_interval])
        
        # Build input with control codes
        final_input_text = f"lexical = {lex_code}, order = {order_code}"
        if prefix:
            final_input_text += f" {prefix}"
        final_input_text += f" <sent> {curr_sent_window} </sent>"
        
        # Tokenize
        inputs = tokenizer([final_input_text], return_tensors="pt", max_length=1024, truncation=True)
        inputs = {k: v.to(model.device) for k, v in inputs.items()}
        
        # Generate
        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                max_length=1024,
                do_sample=True,
                top_p=0.75,
                top_k=None,
                num_return_sequences=1
            )
        
        # Decode
        decoded = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
        
        # Update prefix for context
        prefix += " " + decoded
        output_text += " " + decoded
    
    return output_text.strip()


def handler(job):
    """
    RunPod handler function
    Called for each incoming request
    """
    try:
        job_input = job.get("input", {})
        
        text = job_input.get("text", "")
        if not text:
            return {"error": "No text provided"}
        
        lex_diversity = job_input.get("lex_diversity", 60)
        order_diversity = job_input.get("order_diversity", 40)
        
        # Validate diversity values
        lex_diversity = max(0, min(100, int(lex_diversity)))
        order_diversity = max(0, min(100, int(order_diversity)))
        
        # Run paraphrasing
        paraphrased = paraphrase(text, lex_diversity, order_diversity)
        
        return {"paraphrased": paraphrased}
    
    except Exception as e:
        print(f"Error in handler: {e}")
        return {"error": str(e)}


# Start the serverless worker
runpod.serverless.start({"handler": handler})
