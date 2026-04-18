import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.issues.models import Issue
from llm.embedding_service import generate_embedding, embedding_to_bytes
import time

issues = Issue.objects.filter(embedding__isnull=True)
print(f'Updating {issues.count()} issues...')

t0 = time.time()
count = 0
for i in issues:
    emb = generate_embedding(i.title + '. ' + i.description)
    i.embedding = embedding_to_bytes(emb)
    i.save(update_fields=['embedding'])
    count += 1

print(f'Done updating {count} issues in {time.time() - t0:.2f}s')
