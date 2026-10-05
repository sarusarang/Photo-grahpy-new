# Production Backend Implementation Prompt: Django REST Framework AI Smart Cull, Deduplication & Micro-Payment System

Use this specification prompt to implement the complete backend service for the **AI Smart Cull & Photo Deduplication Studio** in your Django REST Framework project.

---

## 1. System Overview & Technology Stack

### Objective
High-throughput asynchronous photo culling and duplicate elimination service. Photographers upload large batches of burst photos (e.g. 200–2,000 photos). The backend:
1. Calculates **Perceptual Structural Hashes (dHash/pHash)** to cluster identical or burst-shot frames.
2. Evaluates **Focus Sharpness & Edge Variance** using **2D Laplacian convolution** via OpenCV to automatically elect the single sharpest frame as the **"Best Pick"** and flag inferior/blurry takes as **"Duplicates"**.
3. Supports a **Pay-Per-Use micro-transaction** unlock flow via **Razorpay** (e.g. ₹149 / session) before moving approved photos to gallery.
4. Provides a **Move-to-Gallery API** (`POST /api/culling/<session_id>/move-to-gallery/`) that seamlessly publishes curated keeper photos directly into the photographer's target Gallery without re-uploading or duplicating storage.

### Core Dependencies (`requirements.txt`)
```txt
Django>=4.2,<6.0
djangorestframework>=3.14.0
celery>=5.3.0
redis>=5.0.0
Pillow>=10.0.0
imagehash>=4.3.1
opencv-python-headless>=4.8.0
razorpay>=1.4.1
numpy>=1.24.0
django-cors-headers>=4.3.0
```

---

## 2. Database Models (`culling/models.py`)

```python
import uuid
from django.db import models
from django.conf import settings

class CullingSession(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('analyzing', 'Analyzing'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='culling_sessions')
    title = models.CharField(max_length=255, default='Untitled Shoot Culling')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Pay-Per-Use Unlock Status
    is_paid = models.BooleanField(default=False)
    paid_tier = models.CharField(max_length=100, blank=True, null=True)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default='INR')
    
    # Progress & Metrics
    total_photos = models.PositiveIntegerField(default=0)
    duplicate_count = models.PositiveIntegerField(default=0)
    keeper_count = models.PositiveIntegerField(default=0)
    total_saved_bytes = models.BigIntegerField(default=0)
    progress_percentage = models.PositiveIntegerField(default=0)
    progress_status_text = models.CharField(max_length=255, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status}) - User: {self.user}"


class CullingClusterGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(CullingSession, on_delete=models.CASCADE, related_name='clusters')
    cluster_number = models.PositiveIntegerField(default=1)
    average_similarity = models.FloatField(default=0.0)
    best_pick_item = models.ForeignKey(
        'CullingItem', on_delete=models.SET_NULL, null=True, blank=True, related_name='won_clusters'
    )
    total_photos = models.PositiveIntegerField(default=0)
    duplicates_count = models.PositiveIntegerField(default=0)
    wasted_bytes = models.BigIntegerField(default=0)

    class Meta:
        ordering = ['cluster_number']


class CullingItem(models.Model):
    STATUS_CHOICES = [
        ('keep', 'Keep'),
        ('discard', 'Discard'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(CullingSession, on_delete=models.CASCADE, related_name='items')
    cluster = models.ForeignKey(
        CullingClusterGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='items'
    )
    
    file = models.ImageField(upload_to='culling_uploads/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255)
    file_size_bytes = models.BigIntegerField(default=0)
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    
    # AI Extracted Features
    dhash_string = models.CharField(max_length=64, blank=True, default='')
    laplacian_variance = models.FloatField(default=0.0)
    sharpness_score = models.PositiveIntegerField(default=50) # Normalized 0 - 100
    similarity_with_winner = models.FloatField(default=100.0)
    
    # Decisions
    is_best_pick = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='keep')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sharpness_score', 'created_at']


class CullingPaymentOrder(models.Model):
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('verified', 'Verified'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.ForeignKey(CullingSession, on_delete=models.CASCADE, related_name='payments')
    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    tier_name = models.CharField(max_length=100, default='Single Shoot Batch')
    amount_inr = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paisa = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## 3. Algorithmic Culling Engine (`culling/services/culling_engine.py`)

```python
import cv2
import numpy as np
import imagehash
from PIL import Image

def compute_dhash_64(image_path: str) -> str:
    """Computes 64-bit difference hash (dHash) using PIL and imagehash."""
    with Image.open(image_path) as img:
        img_rgb = img.convert('RGB')
        dhash = imagehash.dhash(img_rgb, hash_size=8)
        # Returns 64-char binary string '10101...'
        return ''.join(f"{byte:08b}" for byte in dhash.hash.flatten())

def compute_laplacian_sharpness(image_path: str) -> tuple[float, int]:
    """
    Computes 2D discrete Laplacian edge variance via OpenCV.
    Returns (raw_variance, normalized_score_0_to_100).
    """
    # Read as grayscale
    img_gray = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img_gray is None:
        return 0.0, 50
    
    # Downscale large raw images to max 1200px width for fast convolution
    h, w = img_gray.shape[:2]
    if w > 1200:
        scale = 1200.0 / w
        img_gray = cv2.resize(img_gray, (1200, int(h * scale)), interpolation=cv2.INTER_AREA)

    laplacian = cv2.Laplacian(img_gray, cv2.CV_64F)
    variance = float(laplacian.var())

    # Sigmoid normalization around standard photographic thresholds (140 mid-point)
    normalized = int(min(100, max(10, round(100.0 / (1.0 + np.exp(-(variance - 140.0) / 75.0))))))
    return round(variance, 2), normalized

def calculate_hamming_similarity(hash_a: str, hash_b: str) -> float:
    """Calculates bit-level similarity percentage between two 64-bit strings."""
    if len(hash_a) != 64 or len(hash_b) != 64:
        return 0.0
    diff = sum(c1 != c2 for c1, c2 in zip(hash_a, hash_b))
    return round(((64 - diff) / 64.0) * 100.0, 1)

def cluster_culling_items(items, similarity_threshold: float = 88.0):
    """
    Greedy graph clustering of CullingItem records.
    Groups items with similarity >= threshold into duplicate burst clusters.
    Assigns the sharpest item as is_best_pick=True and status='keep'.
    Marks duplicate items as status='discard'.
    """
    visited = set()
    clusters = []

    items_list = list(items)
    for i, item_a in enumerate(items_list):
        if item_a.id in visited:
            continue

        cluster_group = [item_a]
        for j in range(i + 1, len(items_list)):
            item_b = items_list[j]
            if item_b.id in visited:
                continue

            sim = calculate_hamming_similarity(item_a.dhash_string, item_b.dhash_string)
            if sim >= similarity_threshold:
                item_b.similarity_with_winner = sim
                cluster_group.append(item_b)
                visited.add(item_b.id)

        if len(cluster_group) > 1:
            visited.add(item_a.id)
            # Sort cluster by sharpness descending
            cluster_group.sort(key=lambda x: x.sharpness_score, reverse=True)
            winner = cluster_group[0]
            winner.is_best_pick = True
            winner.status = 'keep'
            winner.similarity_with_winner = 100.0

            for dup in cluster_group[1:]:
                dup.is_best_pick = False
                dup.status = 'discard'
                if not dup.similarity_with_winner:
                    dup.similarity_with_winner = calculate_hamming_similarity(winner.dhash_string, dup.dhash_string)

            clusters.append(cluster_group)

    return clusters
```

---

## 4. Celery Asynchronous Task (`culling/tasks.py`)

```python
from celery import shared_task
from django.db import transaction
from .models import CullingSession, CullingItem, CullingClusterGroup
from .services.culling_engine import (
    compute_dhash_64,
    compute_laplacian_sharpness,
    cluster_culling_items,
)

@shared_task(bind=True)
def analyze_culling_session_task(self, session_id: str, similarity_threshold: float = 88.0):
    try:
        session = CullingSession.objects.get(id=session_id)
        session.status = 'analyzing'
        session.progress_percentage = 5
        session.progress_status_text = 'Starting AI feature extraction...'
        session.save(update_fields=['status', 'progress_percentage', 'progress_status_text'])

        items = list(session.items.all())
        total_items = len(items)

        # 1. Feature Extraction Phase
        for idx, item in enumerate(items):
            file_path = item.file.path
            dhash_str = compute_dhash_64(file_path)
            raw_var, norm_sharpness = compute_laplacian_sharpness(file_path)

            item.dhash_string = dhash_str
            item.laplacian_variance = raw_var
            item.sharpness_score = norm_sharpness
            item.save(update_fields=['dhash_string', 'laplacian_variance', 'sharpness_score'])

            # Update progress
            progress = 5 + int(((idx + 1) / total_items) * 60)
            session.progress_percentage = progress
            session.progress_status_text = f"Analyzed sharpness: {item.original_filename} ({idx + 1}/{total_items})"
            session.save(update_fields=['progress_percentage', 'progress_status_text'])

        # 2. Clustering Phase
        session.progress_percentage = 70
        session.progress_status_text = "Clustering burst sequences and structural duplicates..."
        session.save(update_fields=['progress_percentage', 'progress_status_text'])

        cluster_groups = cluster_culling_items(items, similarity_threshold=similarity_threshold)

        with transaction.atomic():
            # Delete any previous clusters
            session.clusters.all().delete()

            total_duplicates = 0
            total_saved_bytes = 0

            for idx, c_group in enumerate(cluster_groups, start=1):
                winner = c_group[0]
                duplicates = c_group[1:]

                avg_sim = round(sum(d.similarity_with_winner for d in duplicates) / len(duplicates), 1)
                wasted_bytes = sum(d.file_size_bytes for d in duplicates)

                cluster_obj = CullingClusterGroup.objects.create(
                    session=session,
                    cluster_number=idx,
                    average_similarity=avg_sim,
                    best_pick_item=winner,
                    total_photos=len(c_group),
                    duplicates_count=len(duplicates),
                    wasted_bytes=wasted_bytes,
                )

                for p in c_group:
                    p.cluster = cluster_obj
                    p.save(update_fields=['cluster', 'is_best_pick', 'status', 'similarity_with_winner'])

                total_duplicates += len(duplicates)
                total_saved_bytes += wasted_bytes

            # Unique photos (not in any cluster) stay as keep
            CullingItem.objects.filter(session=session, cluster__isnull=True).update(
                is_best_pick=True, status='keep'
            )

            session.total_photos = total_items
            session.duplicate_count = total_duplicates
            session.keeper_count = total_items - total_duplicates
            session.total_saved_bytes = total_saved_bytes
            session.status = 'completed'
            session.progress_percentage = 100
            session.progress_status_text = 'AI Culling & Deduplication Complete.'
            session.save()

        return {'status': 'success', 'session_id': session_id}

    except Exception as e:
        session = CullingSession.objects.filter(id=session_id).first()
        if session:
            session.status = 'draft'
            session.progress_status_text = f"Error during analysis: {str(e)}"
            session.save(update_fields=['status', 'progress_status_text'])
        raise e
```

---

## 5. Razorpay Micro-Transaction Service (`culling/services/payment_service.py`)

```python
import razorpay
from django.conf import settings
from rest_framework.exceptions import ValidationError
from ..models import CullingSession, CullingPaymentOrder

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def create_razorpay_culling_order(session: CullingSession, amount_inr: float, tier_name: str) -> dict:
    """Creates a Razorpay order specifically for pay-per-use culling unlocks."""
    amount_paisa = int(amount_inr * 100)
    data = {
        'amount': amount_paisa,
        'currency': 'INR',
        'receipt': f"cull_{session.id.hex[:12]}",
        'notes': {
            'session_id': str(session.id),
            'tier_name': tier_name,
            'user_id': str(session.user.id),
        },
    }
    rzp_order = client.order.create(data=data)

    payment_record = CullingPaymentOrder.objects.create(
        user=session.user,
        session=session,
        razorpay_order_id=rzp_order['id'],
        amount_inr=amount_inr,
        amount_paisa=amount_paisa,
        tier_name=tier_name,
        currency='INR',
        status='created',
    )

    return {
        'order_id': rzp_order['id'],
        'key_id': settings.RAZORPAY_KEY_ID,
        'amount': amount_paisa,
        'currency': 'INR',
        'session_id': str(session.id),
        'tier_name': tier_name,
    }

def verify_razorpay_culling_signature(session: CullingSession, order_id: str, payment_id: str, signature: str) -> bool:
    """Verifies HMAC SHA-256 signature and unlocks the culling session."""
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature,
        })
    except razorpay.errors.SignatureVerificationError:
        raise ValidationError('Invalid Razorpay signature. Transaction verification failed.')

    order = CullingPaymentOrder.objects.filter(session=session, razorpay_order_id=order_id).first()
    if order:
        order.razorpay_payment_id = payment_id
        order.razorpay_signature = signature
        order.status = 'verified'
        order.save()

    session.is_paid = True
    session.paid_amount = order.amount_inr if order else 149.00
    session.paid_tier = order.tier_name if order else 'Standard Batch'
    session.save(update_fields=['is_paid', 'paid_amount', 'paid_tier'])
    return True
```

---

## 6. Move to Gallery Service (`culling/services/move_service.py`)

```python
from django.db import transaction
from rest_framework.exceptions import ValidationError
from ..models import CullingSession
# Import your existing gallery models:
from galleries.models import Gallery, GalleryMedia, GallerySection

def execute_move_to_gallery(session: CullingSession, payload: dict):
    """
    Moves culled photos into the photographer's target Gallery.
    Same-to-same as MoveEventToGallery: supports category_assignments mapping each photo to a specific section.
    
    IMPORTANT: Once all photos are transferred to the Gallery, all photos and clusters
    are permanently deleted/purged from the CullingSession table to free up staging space.
    """
    target_mode = payload.get('target_mode', 'new') # 'new' or 'existing'
    target_gallery_id = payload.get('target_gallery_id')
    new_gallery_title = payload.get('new_gallery_title', 'AI Curated Shoot')
    category_assignments = payload.get('category_assignments', {}) # Dict: { "photo_id_or_culling_id": "HIGHLIGHTS" }
    target_section_title = payload.get('target_section_title', 'AI CURATED').strip().upper()

    user = session.user

    with transaction.atomic():
        # 1. Resolve or Create Target Gallery
        if target_mode == 'new':
            gallery = Gallery.objects.create(
                user=user,
                title=new_gallery_title,
                status='active',
            )
        else:
            gallery = Gallery.objects.filter(id=target_gallery_id, user=user).first()
            if not gallery:
                raise ValidationError("Target gallery does not exist or you don't have access.")

        # 2. Cache Sections dynamically
        section_cache = {}
        def get_or_create_section(title_str: str):
            clean_title = (title_str or target_section_title or 'HIGHLIGHTS').strip().upper()
            if clean_title not in section_cache:
                sec, _ = GallerySection.objects.get_or_create(gallery=gallery, title=clean_title)
                section_cache[clean_title] = sec
            return section_cache[clean_title]

        # 3. Transfer Media
        items_to_move = list(session.items.all())
        created_media = []

        for item in items_to_move:
            # Check if user customized the category assignment for this photo
            assigned_title = category_assignments.get(str(item.id)) or category_assignments.get(item.original_filename) or target_section_title
            target_section = get_or_create_section(assigned_title)

            media = GalleryMedia.objects.create(
                gallery=gallery,
                section=target_section,
                file=item.file,
                title=item.original_filename,
                size_bytes=item.file_size_bytes,
                width=item.width,
                height=item.height,
            )
            created_media.append(media)

        # 4. CRITICAL: Delete/Purge all photos & clusters from the culling session
        # Just like moving an event deletes the event photos from events staging!
        session.items.all().delete()
        session.clusters.all().delete()
        session.total_photos = 0
        session.duplicate_count = 0
        session.keeper_count = 0
        session.status = 'archived'
        session.progress_status_text = f"Successfully moved {len(created_media)} photos to '{gallery.title}' and cleared session."
        session.save(update_fields=['total_photos', 'duplicate_count', 'keeper_count', 'status', 'progress_status_text'])

        return {
            'success': True,
            'gallery_id': str(gallery.id),
            'gallery_title': gallery.title,
            'transferred_count': len(created_media),
            'sections_created': list(section_cache.keys()),
            'message': f"Successfully transferred {len(created_media)} photos to '{gallery.title}' and cleared culling staging.",
        }
```

---

## 7. DRF ViewSets & Endpoints (`culling/views.py`)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CullingSession, CullingItem
from .serializers import CullingSessionSerializer, CullingItemSerializer
from .tasks import analyze_culling_session_task
from .services.payment_service import create_razorpay_culling_order, verify_razorpay_culling_signature
from .services.move_service import execute_move_to_gallery

class CullingSessionViewSet(viewsets.ModelViewSet):
    serializer_class = CullingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CullingSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['POST'], url_path='upload-photos')
    def upload_photos(self, request, pk=None):
        session = self.get_object()
        files = request.FILES.getlist('photos')
        created_items = []
        for f in files:
            item = CullingItem.objects.create(
                session=session,
                file=f,
                original_filename=f.name,
                file_size_bytes=f.size,
            )
            created_items.append(item)

        session.total_photos = session.items.count()
        session.save(update_fields=['total_photos'])

        # Automatically kick off Celery task
        analyze_culling_session_task.delay(str(session.id))
        return Response({'message': f"Enqueued {len(created_items)} photos for AI culling analysis."})

    @action(detail=True, methods=['POST'], url_path='payments/create-order')
    def create_payment_order(self, request, pk=None):
        session = self.get_object()
        amount_inr = float(request.data.get('amount_inr', 149.0))
        tier_name = request.data.get('tier_name', 'Single Shoot Batch')
        order_data = create_razorpay_culling_order(session, amount_inr, tier_name)
        return Response(order_data)

    @action(detail=True, methods=['POST'], url_path='payments/verify')
    def verify_payment(self, request, pk=None):
        session = self.get_object()
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        sig = request.data.get('razorpay_signature')
        verify_razorpay_culling_signature(session, order_id, payment_id, sig)
        return Response({'success': True, 'is_paid': True, 'message': 'Culling session unlocked.'})

    @action(detail=True, methods=['POST'], url_path='move-to-gallery')
    def move_to_gallery(self, request, pk=None):
        session = self.get_object()
        if not session.is_paid:
            return Response({'error': 'Session payment required before moving to gallery.'}, status=status.HTTP_402_PAYMENT_REQUIRED)

        res = execute_move_to_gallery(session, request.data)
        return Response(res)
```

---

## 8. Summary of API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/culling/sessions/` | Create a new culling session |
| `GET` | `/api/culling/sessions/{id}/` | Get culling progress, duplicate clusters, and metrics |
| `POST` | `/api/culling/sessions/{id}/upload-photos/` | Upload multiple images & enqueue Celery AI task |
| `POST` | `/api/culling/sessions/{id}/payments/create-order/` | Generate Razorpay order for pay-per-use unlock |
| `POST` | `/api/culling/sessions/{id}/payments/verify/` | Verify signature & unlock session |
| `POST` | `/api/culling/sessions/{id}/move-to-gallery/` | Move curated keepers into target Gallery |
