"""
Embedding-based duplicate detection using sentence-transformers.
Uses all-MiniLM-L6-v2 (free, local, ~80MB) for 384-dim embeddings.
No paid API calls required.
"""
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Singleton model instance — loaded once, reused
_model = None


def _get_model():
    """Lazy-load sentence-transformers model (singleton pattern)."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Loaded sentence-transformers model: all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"Failed to load sentence-transformers model: {e}")
            raise
    return _model


def generate_embedding(text: str) -> np.ndarray:
    """
    Generate a 384-dimensional normalized embedding for the given text.
    Normalized embeddings allow cosine similarity via simple dot product.
    """
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding


def embedding_to_bytes(embedding: np.ndarray) -> bytes:
    """Convert numpy embedding to bytes for database storage."""
    return embedding.astype(np.float32).tobytes()


def bytes_to_embedding(data: bytes) -> np.ndarray:
    """Convert stored bytes back to numpy embedding."""
    return np.frombuffer(data, dtype=np.float32)


def find_duplicate(new_text: str, threshold: float = 0.70) -> dict:
    """
    Compare new complaint text against all stored issue embeddings.
    
    Uses cosine similarity (via dot product of normalized vectors).
    Only compares against non-duplicate original issues.
    
    Args:
        new_text: Combined title + description of the new complaint
        threshold: Similarity threshold (0.70 = 70% similar)
    
    Returns:
        dict with:
            - is_duplicate: bool
            - score: float (0.0 to 1.0)
            - original_issue_id: int or None
    """
    from apps.issues.models import Issue

    try:
        new_embedding = generate_embedding(new_text)
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        return {"is_duplicate": False, "score": 0.0, "original_issue_id": None}

    # Only compare against active (non-resolved), original (non-duplicate) issues
    active_statuses = ['Open', 'Assigned', 'In Progress', 'Escalated']
    existing = Issue.objects.filter(
        embedding__isnull=False,
        is_duplicate=False,
        status__in=active_statuses
    ).only('id', 'embedding')

    if not existing.exists():
        return {"is_duplicate": False, "score": 0.0, "original_issue_id": None}

    best_score = 0.0
    best_id = None

    for issue in existing:
        try:
            stored = bytes_to_embedding(issue.embedding)
            # Cosine similarity via dot product (vectors are already normalized)
            score = float(np.dot(new_embedding, stored))
            if score > best_score:
                best_score = score
                best_id = issue.id
        except Exception as e:
            logger.warning(f"Failed to compare embedding for issue {issue.id}: {e}")
            continue

    return {
        "is_duplicate": best_score >= threshold,
        "score": round(best_score, 4),
        "original_issue_id": best_id if best_score >= threshold else None,
    }
