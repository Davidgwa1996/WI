from functools import lru_cache


@lru_cache(maxsize=1)
def _load_embedder():
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer("all-MiniLM-L6-v2")
    except Exception as e:
        print(f"Warning: sentence-transformers unavailable: {e}")
        return None


def encode_text(text: str):
    model = _load_embedder()
    if model is None or not text:
        return None

    try:
        return model.encode(text).tolist()
    except Exception as e:
        print(f"Warning: embedding generation failed: {e}")
        return None