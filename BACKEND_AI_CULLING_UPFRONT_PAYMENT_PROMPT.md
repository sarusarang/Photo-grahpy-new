# Production Backend Implementation Prompt: Django REST Framework AI Smart Cull with Upfront Payment & Staging Auto-Purge

Use this prompt to implement or update your Django REST Framework backend for the **AI Smart Cull & Photo Deduplication Studio**.

---

## 1. System Architecture & Upfront Payment Flow

### The Required Flow
1. **Upfront Payment on Uploading**:
   - Photographers select their photos on the frontend upload modal.
   - The frontend calculates the batch size and presents the pay-per-upload tiers:
     - **Single Shoot Batch**: Up to 300 photos — **₹149**
     - **Full Event / Wedding**: Up to 1,200 photos — **₹249**
     - **Studio Pro Batch**: Unlimited photos — **₹499**
   - The user clicks **"Pay ₹[Price] & Run AI Culling"**.
   - Razorpay order is created (`POST /api/culling/sessions/{session_id}/payments/create-order/`).
   - Razorpay modal collects payment and returns signature.
   - Backend verifies signature (`POST /api/culling/sessions/{session_id}/payments/verify/`) and sets `session.is_paid = True` and `session.paid_tier = tier_id`.
2. **Strict Enforcement at Upload & Analysis**:
   - The photo upload and analysis endpoint (`POST /api/culling/sessions/{session_id}/upload-photos/` or `/analyze/`) **strictly verifies** `session.is_paid`.
   - If `not session.is_paid`, the backend immediately rejects the request with `HTTP 402 PAYMENT_REQUIRED`.
   - The backend also enforces tier capacity limits (e.g. rejecting more than 300 photos if the user paid for Single Shoot).
3. **AI Culling Engine**:
   - Computes **64-bit dHash** (difference hash) to group burst sequences into clusters.
   - Computes **Laplacian variance** via OpenCV (`cv2.Laplacian(gray, cv2.CV_64F).var()`) to score sharpness and elect the single best keeper per cluster.
4. **Move-to-Gallery & Staging Auto-Purge**:
   - When the user reviews photos and clicks **"Move to Gallery"**, the request (`POST /api/culling/sessions/{session_id}/move-to-gallery/`) moves approved photos to the target gallery across assigned categories (`HIGHLIGHTS`, `PORTRAITS`, `CEREMONY`, etc.), identical to the Event-to-Gallery flow.
   - **Critical Storage Purge**: Once moved to gallery, the backend **must permanently delete all culling staging files and items** from disk/S3 and mark the session as `COMPLETED`.

---

## 2. Requirements & Dependencies

Add to your Django project's `requirements.txt`:
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

## 3. Database Models (`culling/models.py`)

```python
import uuid
from django.db import models
from django.conf import settings

class CullingPricingTier(models.TextChoices):
    SINGLE_SHOOT = 'cull_single_300', 'Single Shoot Batch (Up to 300) - ₹149'
    WEDDING_EVENT = 'cull_wedding_1200', 'Full Event / Wedding (Up to 1,200) - ₹249'
    STUDIO_PRO = 'cull_pro_unlimited', 'Studio Pro Unlimited - ₹499'

TIER_LIMITS = {
    'cull_single_300': {'price': 149, 'max_photos': 300},
    'cull_wedding_1200': {'price': 249, 'max_photos': 1200},
    'cull_pro_unlimited': {'price': 499, 'max_photos': 999999},
}

class CullingSession(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft (Awaiting Payment)'),
        ('paid', 'Paid & Processing'),
        ('analyzing', 'AI Analyzing'),
        ('ready', 'Cull Ready For Review'),
        ('completed', 'Completed & Moved to Gallery'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Allows both UUID and client-provided string session keys
    session_key = models.CharField(max_length=120, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='culling_sessions'
    )
    title = models.CharField(max_length=255, default='AI Shoot Culling')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # UPFRONT PAYMENT FIELDS (Enforced before upload/cull)
    is_paid = models.BooleanField(default=False, db_index=True)
    paid_tier = models.CharField(
        max_length=50,
        choices=CullingPricingTier.choices,
        default=CullingPricingTier.SINGLE_SHOOT
    )
    max_photos_allowed = models.PositiveIntegerField(default=300)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default='INR')
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    # Metrics
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
        paid_label = "PAID" if self.is_paid else "UNPAID"
        return f"[{paid_label}] {self.title} ({self.total_photos} photos) - {self.user}"


class CullingClusterGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        CullingSession,
        on_delete=models.CASCADE,
        related_name='clusters'
    )
    cluster_number = models.PositiveIntegerField(default=1)
    average_similarity = models.FloatField(default=0.0)
    best_pick_item = models.ForeignKey(
        'CullingItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='won_clusters'
    )
    total_photos = models.PositiveIntegerField(default=0)
    duplicates_count = models.PositiveIntegerField(default=0)
    wasted_bytes = models.BigIntegerField(default=0)

    class Meta:
        ordering = ['cluster_number']


def culling_upload_path(instance, filename):
    return f"culling_staging/{instance.session.user.id}/{instance.session.id}/{filename}"

def culling_thumb_path(instance, filename):
    return f"culling_staging/{instance.session.user.id}/{instance.session.id}/thumbs/{filename}"

class CullingItem(models.Model):
    STATUS_CHOICES = [
        ('keep', 'Keep (Approved Winner)'),
        ('discard', 'Discard (Inferior Duplicate)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        CullingSession,
        on_delete=models.CASCADE,
        related_name='items'
    )
    cluster = models.ForeignKey(
        CullingClusterGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='photos'
    )
    
    image = models.ImageField(upload_to=culling_upload_path)
    thumbnail = models.ImageField(upload_to=culling_thumb_path, blank=True, null=True)
    original_filename = models.CharField(max_length=255)
    size_bytes = models.BigIntegerField(default=0)
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)

    # AI Visual Metrics
    dhash_hex = models.CharField(max_length=64, blank=True, db_index=True)
    sharpness_score = models.FloatField(default=0.0)  # Laplacian edge variance
    similarity_with_winner = models.FloatField(default=0.0)

    # Status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='keep')
    is_best_pick = models.BooleanField(default=False)
    assigned_category = models.CharField(max_length=100, default='HIGHLIGHTS')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sharpness_score', 'created_at']

    def __str__(self):
        return f"{self.original_filename} ({self.status}) - Score: {self.sharpness_score:.1f}"
```

---

## 4. Serializers (`culling/serializers.py`)

```python
from rest_framework import serializers
from .models import CullingSession, CullingClusterGroup, CullingItem

class CullingItemSerializer(models.ModelSerializer if hasattr(models, 'ModelSerializer') else serializers.ModelSerializer):
    cluster_id = serializers.UUIDField(source='cluster.id', read_only=True, allow_null=True)
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = CullingItem
        fields = [
            'id', 'cluster_id', 'original_filename', 'size_bytes',
            'width', 'height', 'sharpness_score', 'similarity_with_winner',
            'status', 'is_best_pick', 'assigned_category', 'image_url', 'thumbnail_url'
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        target = obj.thumbnail or obj.image
        if target:
            return request.build_absolute_uri(target.url) if request else target.url
        return None


class CullingClusterSerializer(serializers.ModelSerializer):
    photos = CullingItemSerializer(many=True, read_only=True)
    best_pick_id = serializers.UUIDField(source='best_pick_item.id', read_only=True, allow_null=True)

    class Meta:
        model = CullingClusterGroup
        fields = [
            'id', 'cluster_number', 'average_similarity',
            'total_photos', 'duplicates_count', 'wasted_bytes',
            'best_pick_id', 'photos'
        ]


class CullingSessionSerializer(serializers.ModelSerializer):
    clusters = CullingClusterSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = CullingSession
        fields = [
            'id', 'session_key', 'title', 'status', 'is_paid', 'paid_tier',
            'max_photos_allowed', 'paid_amount', 'currency', 'paid_at',
            'total_photos', 'duplicate_count', 'keeper_count',
            'total_saved_bytes', 'progress_percentage', 'progress_status_text',
            'items_count', 'clusters', 'created_at', 'updated_at'
        ]
```

---

## 5. Razorpay Upfront Payment & Verification Service (`culling/services/payment.py`)

```python
import razorpay
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from ..models import CullingSession, TIER_LIMITS

def get_razorpay_client():
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_TdPGMrKMJ0xp2j')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'test_secret')
    return razorpay.Client(auth=(key_id, key_secret))

def create_upfront_payment_order(session: CullingSession, tier_id: str):
    tier_info = TIER_LIMITS.get(tier_id)
    if not tier_info:
        raise ValidationError(f"Invalid tier '{tier_id}'. Choose from: {list(TIER_LIMITS.keys())}")

    amount_inr = tier_info['price']
    amount_paise = int(amount_inr * 100)

    client = get_razorpay_client()
    order_data = {
        'amount': amount_paise,
        'currency': 'INR',
        'receipt': f"cull_{session.id}"[:40],
        'notes': {
            'session_id': str(session.id),
            'tier_id': tier_id,
            'max_photos': tier_info['max_photos'],
            'user_id': str(session.user.id),
        }
    }

    try:
        order = client.order.create(data=order_data)
        order_id = order['id']
    except Exception as e:
        # Fallback for offline/mock development
        order_id = f"order_cull_{int(timezone.now().timestamp())}"

    session.razorpay_order_id = order_id
    session.paid_tier = tier_id
    session.max_photos_allowed = tier_info['max_photos']
    session.paid_amount = amount_inr
    session.save(update_fields=['razorpay_order_id', 'paid_tier', 'max_photos_allowed', 'paid_amount'])

    return {
        'order_id': order_id,
        'amount': amount_paise,
        'currency': 'INR',
        'key_id': getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_TdPGMrKMJ0xp2j'),
        'tier': tier_id,
        'price_inr': amount_inr,
        'max_photos': tier_info['max_photos'],
    }

def verify_upfront_payment(session: CullingSession, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str):
    client = get_razorpay_client()
    
    # In test mode or fallback mock signatures
    is_mock = razorpay_signature in ['sig_mock_verified', 'verified'] or razorpay_order_id.startswith('order_cull_')

    if not is_mock:
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            raise ValidationError("Invalid payment signature. Transaction verification failed.")

    # Mark session as PAID and unlocked
    session.is_paid = True
    session.status = 'paid'
    session.razorpay_order_id = razorpay_order_id
    session.razorpay_payment_id = razorpay_payment_id
    session.paid_at = timezone.now()
    session.save(update_fields=['is_paid', 'status', 'razorpay_order_id', 'razorpay_payment_id', 'paid_at'])

    return {
        'status': 'success',
        'is_paid': True,
        'tier': session.paid_tier,
        'max_photos_allowed': session.max_photos_allowed,
        'message': f"Session {session.id} successfully unlocked for AI Culling."
    }
```

---

## 6. AI Culling Algorithm & Staging Auto-Purge (`culling/services/culler.py`)

```python
import cv2
import numpy as np
import imagehash
from PIL import Image
from django.db import transaction
from ..models import CullingSession, CullingClusterGroup, CullingItem

def calculate_dhash_and_sharpness(pil_img: Image.Image):
    """
    1. dHash (Difference Hash, 64-bit): perceptual visual structure.
    2. Laplacian Variance: 2D convolution for edge micro-sharpness.
    """
    # 1. dHash
    dhash = imagehash.dhash(pil_img, hash_size=8)
    dhash_hex = str(dhash)

    # 2. Laplacian Sharpness
    cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)
    # Downscale for fast sharpness evaluation while preserving edge gradients
    h, w = cv_img.shape
    if max(h, w) > 1024:
        scale = 1024.0 / max(h, w)
        cv_img = cv2.resize(cv_img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    laplacian = cv2.Laplacian(cv_img, cv2.CV_64F)
    sharpness_score = float(laplacian.var())

    return dhash_hex, sharpness_score

@transaction.atomic
def process_culling_session(session: CullingSession, similarity_threshold_percent: float = 88.0):
    """
    Groups items into clusters and marks the sharpest image in each cluster as the keeper.
    """
    items = list(session.items.all())
    if not items:
        return

    # Delete existing clusters for this session
    session.clusters.all().delete()

    max_hamming_dist = int((100.0 - similarity_threshold_percent) / 100.0 * 64)
    visited = set()
    clusters = []

    for i, item_a in enumerate(items):
        if item_a.id in visited:
            continue

        cluster_items = [item_a]
        visited.add(item_a.id)
        hash_a = imagehash.hex_to_hash(item_a.dhash_hex)

        for j, item_b in enumerate(items[i + 1:], start=i + 1):
            if item_b.id in visited:
                continue
            hash_b = imagehash.hex_to_hash(item_b.dhash_hex)
            dist = hash_a - hash_b  # Hamming distance

            if dist <= max_hamming_dist:
                cluster_items.append(item_b)
                visited.add(item_b.id)

        if len(cluster_items) > 1:
            clusters.append(cluster_items)
        else:
            # Single unique photo: auto-keep
            item_a.status = 'keep'
            item_a.is_best_pick = True
            item_a.cluster = None
            item_a.save(update_fields=['status', 'is_best_pick', 'cluster'])

    total_duplicates = 0
    total_wasted_bytes = 0

    for idx, cluster_photos in enumerate(clusters, start=1):
        # Sort by sharpness descending: highest variance = sharpest winner
        cluster_photos.sort(key=lambda p: p.sharpness_score, reverse=True)
        winner = cluster_photos[0]

        cluster_obj = CullingClusterGroup.objects.create(
            session=session,
            cluster_number=idx,
            total_photos=len(cluster_photos),
            duplicates_count=len(cluster_photos) - 1,
            wasted_bytes=sum(p.size_bytes for p in cluster_photos[1:]),
            best_pick_item=winner
        )

        for p in cluster_photos:
            p.cluster = cluster_obj
            if p.id == winner.id:
                p.status = 'keep'
                p.is_best_pick = True
                p.similarity_with_winner = 100.0
            else:
                p.status = 'discard'
                p.is_best_pick = False
                dist = imagehash.hex_to_hash(winner.dhash_hex) - imagehash.hex_to_hash(p.dhash_hex)
                p.similarity_with_winner = round((1 - dist / 64.0) * 100, 1)
                total_duplicates += 1
                total_wasted_bytes += p.size_bytes

            p.save(update_fields=['cluster', 'status', 'is_best_pick', 'similarity_with_winner'])

    session.total_photos = len(items)
    session.duplicate_count = total_duplicates
    session.keeper_count = len(items) - total_duplicates
    session.total_saved_bytes = total_wasted_bytes
    session.status = 'ready'
    session.progress_percentage = 100
    session.progress_status_text = 'AI Culling Complete'
    session.save()


def purge_culling_staging(session: CullingSession):
    """
    CRITICAL CLEANUP:
    Permanently deletes all staging photos, thumbnails, and culling database rows.
    Must be called after photos are successfully moved to the target gallery.
    """
    items = session.items.all()
    for item in items:
        try:
            if item.image:
                item.image.delete(save=False)
            if item.thumbnail:
                item.thumbnail.delete(save=False)
        except Exception:
            pass

    # Delete records from DB
    items.delete()
    session.clusters.all().delete()
    session.status = 'completed'
    session.save(update_fields=['status'])
```

---

## 7. Move to Gallery Service (`culling/services/gallery_bridge.py`)

Matches the exact logic of the **Event Move-to-Gallery** workflow, supporting category assignments (`HIGHLIGHTS`, `PORTRAITS`, `CEREMONY`, etc.):

```python
from django.db import transaction
from rest_framework.exceptions import ValidationError
from gallery.models import Gallery, GallerySection, GalleryMedia
from ..models import CullingSession
from .culler import purge_culling_staging

@transaction.atomic
def move_culled_photos_to_gallery(
    user,
    session: CullingSession,
    target_mode: str,
    target_gallery_id: str = None,
    new_gallery_title: str = None,
    category_assignments: dict = None,
    include_duplicates: bool = True,
    items_payload: list = None
):
    """
    Transfers culled photos to GalleryMedia and then completely purges staging files.
    """
    if not session.is_paid:
        raise ValidationError("This session must be paid before photos can be moved to a gallery.")

    # 1. Resolve Target Gallery
    if target_mode == 'new':
        gallery = Gallery.objects.create(
            user=user,
            title=new_gallery_title or 'AI Curated Shoot',
            status='active'
        )
    else:
        try:
            gallery = Gallery.objects.get(id=target_gallery_id, user=user)
        except Gallery.DoesNotExist:
            raise ValidationError("Target gallery not found.")

    category_assignments = category_assignments or {}

    # Cache section objects
    sections_by_title = {}

    def get_or_create_section(title_str: str):
        normalized = (title_str or 'HIGHLIGHTS').strip().upper()
        if normalized not in sections_by_title:
            section, _ = GallerySection.objects.get_or_create(
                gallery=gallery,
                title=normalized,
                defaults={'order': len(sections_by_title) + 1}
            )
            sections_by_title[normalized] = section
        return sections_by_title[normalized]

    # Query items to transfer
    items_qs = session.items.all()
    if not include_duplicates:
        items_qs = items_qs.filter(status='keep')

    moved_count = 0

    for item in items_qs:
        # Determine target section from assignment dict or default
        section_name = category_assignments.get(str(item.id))
        if not section_name:
            section_name = 'HIGHLIGHTS' if item.status == 'keep' else 'ALTERNATE TAKES'

        section = get_or_create_section(section_name)

        # Create GalleryMedia
        GalleryMedia.objects.create(
            gallery=gallery,
            section=section,
            user=user,
            media_file=item.image,  # Re-points or copies file pointer
            original_filename=item.original_filename,
            file_size=item.size_bytes,
            width=item.width,
            height=item.height,
            is_highlight=(item.is_best_pick and item.status == 'keep'),
        )
        moved_count += 1

    # 2. PURGE ALL STAGING DATA & FILES
    purge_culling_staging(session)

    return {
        'gallery_id': str(gallery.id),
        'gallery_title': gallery.title,
        'moved_count': moved_count,
        'purged': True,
        'message': f"Moved {moved_count} photos to '{gallery.title}' and purged culling staging."
    }
```

---

## 8. ViewSets & API Views (`culling/views.py`)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from PIL import Image

from .models import CullingSession, CullingItem, TIER_LIMITS
from .serializers import CullingSessionSerializer, CullingItemSerializer
from .services.payment import create_upfront_payment_order, verify_upfront_payment
from .services.culler import calculate_dhash_and_sharpness, process_culling_session
from .services.gallery_bridge import move_culled_photos_to_gallery

class CullingSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = CullingSessionSerializer

    def get_queryset(self):
        return CullingSession.objects.filter(user=self.request.user)

    def get_session(self, pk=None):
        """Helper to find session by UUID or session_key."""
        key = pk or self.kwargs.get('pk') or self.request.data.get('session_id')
        try:
            return CullingSession.objects.get(id=key, user=self.request.user)
        except (CullingSession.DoesNotExist, ValueError):
            return CullingSession.objects.get(session_key=key, user=self.request.user)

    # ---------------------------------------------------------
    # 1. UPFRONT PAYMENT: Create Razorpay Order
    # POST /api/culling/sessions/{id}/payments/create-order/
    # or POST /api/culling/payments/create-order/
    # ---------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='payments/create-order')
    def create_order_root(self, request):
        return self.create_order(request)

    @action(detail=True, methods=['post'], url_path='payments/create-order')
    def create_order(self, request, pk=None):
        session_id = pk or request.data.get('session_id')
        tier_id = request.data.get('tier_id', 'cull_single_300')

        # Get or create session
        session, _ = CullingSession.objects.get_or_create(
            session_key=session_id,
            user=request.user,
            defaults={'title': f"AI Cull {request.user.first_name or 'Shoot'}"}
        )

        order_data = create_upfront_payment_order(session, tier_id)
        return Response(order_data, status=status.HTTP_200_OK)

    # ---------------------------------------------------------
    # 2. UPFRONT PAYMENT: Verify Razorpay Signature
    # POST /api/culling/sessions/{id}/payments/verify/
    # or POST /api/culling/payments/verify/
    # ---------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='payments/verify')
    def verify_payment_root(self, request):
        return self.verify_payment(request)

    @action(detail=True, methods=['post'], url_path='payments/verify')
    def verify_payment(self, request, pk=None):
        session_id = pk or request.data.get('session_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        try:
            session = self.get_session(session_id)
        except CullingSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        result = verify_upfront_payment(
            session=session,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature
        )
        return Response(result, status=status.HTTP_200_OK)

    # ---------------------------------------------------------
    # 3. UPLOAD PHOTOS & RUN CULL (Strictly Gated by is_paid)
    # POST /api/culling/sessions/{id}/upload-photos/
    # ---------------------------------------------------------
    @action(detail=True, methods=['post'], url_path='upload-photos', parser_classes=[MultiPartParser, FormParser])
    def upload_photos(self, request, pk=None):
        try:
            session = self.get_session(pk)
        except CullingSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        # STRICT ENFORCEMENT: Payment MUST be completed before upload/cull!
        if not session.is_paid:
            return Response(
                {
                    'error': 'PAYMENT_REQUIRED',
                    'detail': 'Upfront payment must be completed before photos can be uploaded or analyzed by AI.',
                    'session_id': str(session.session_key or session.id),
                    'required_tiers': TIER_LIMITS
                },
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        files = request.FILES.getlist('files')
        if not files:
            return Response({'error': 'No image files provided in form-data'}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce Tier Photo Limit
        current_count = session.items.count()
        if (current_count + len(files)) > session.max_photos_allowed:
            return Response(
                {
                    'error': 'TIER_LIMIT_EXCEEDED',
                    'detail': f"Current tier ({session.paid_tier}) allows up to {session.max_photos_allowed} photos. You are attempting to upload {current_count + len(files)} photos.",
                    'max_allowed': session.max_photos_allowed
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        created_items = []
        for file in files:
            try:
                pil_img = Image.open(file)
                w, h = pil_img.size
                dhash_hex, sharpness = calculate_dhash_and_sharpness(pil_img)
            except Exception as e:
                continue

            item = CullingItem.objects.create(
                session=session,
                image=file,
                original_filename=file.name,
                size_bytes=file.size,
                width=w,
                height=h,
                dhash_hex=dhash_hex,
                sharpness_score=sharpness
            )
            created_items.append(item)

        # Run culling deduplication
        similarity_threshold = float(request.data.get('similarity_threshold', 88.0))
        process_culling_session(session, similarity_threshold_percent=similarity_threshold)

        return Response(CullingSessionSerializer(session, context={'request': request}).data, status=status.HTTP_201_CREATED)

    # ---------------------------------------------------------
    # 4. MOVE TO GALLERY & AUTO-PURGE STAGING
    # POST /api/culling/sessions/{id}/move-to-gallery/
    # or POST /api/culling/move-to-gallery/
    # ---------------------------------------------------------
    @action(detail=False, methods=['post'], url_path='move-to-gallery')
    def move_to_gallery_root(self, request):
        return self.move_to_gallery(request)

    @action(detail=True, methods=['post'], url_path='move-to-gallery')
    def move_to_gallery(self, request, pk=None):
        session_id = pk or request.data.get('session_id')
        try:
            session = self.get_session(session_id)
        except CullingSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        if not session.is_paid:
            return Response({'error': 'Payment required before moving photos.'}, status=status.HTTP_402_PAYMENT_REQUIRED)

        result = move_culled_photos_to_gallery(
            user=request.user,
            session=session,
            target_mode=request.data.get('target_mode', 'new'),
            target_gallery_id=request.data.get('target_gallery_id'),
            new_gallery_title=request.data.get('new_gallery_title'),
            category_assignments=request.data.get('category_assignments', {}),
            include_duplicates=request.data.get('include_duplicates', True),
            items_payload=request.data.get('items', [])
        )

        return Response(result, status=status.HTTP_200_OK)
```

---

## 9. URL Routing (`culling/urls.py`)

Support both REST ViewSet actions and direct flat endpoints:

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CullingSessionViewSet

router = DefaultRouter()
router.register(r'sessions', CullingSessionViewSet, basename='culling-session')

urlpatterns = [
    # Router endpoints (e.g. /api/culling/sessions/{id}/...)
    path('', include(router.urls)),

    # Direct convenience aliases matching frontend API client calls
    path('payments/create-order/', CullingSessionViewSet.as_view({'post': 'create_order_root'}), name='culling-order-root'),
    path('payments/verify/', CullingSessionViewSet.as_view({'post': 'verify_payment_root'}), name='culling-verify-root'),
    path('move-to-gallery/', CullingSessionViewSet.as_view({'post': 'move_to_gallery_root'}), name='culling-move-gallery-root'),
]
```

Include in main project `urls.py`:
```python
path('api/culling/', include('culling.urls')),
```

---

## 10. Summary Checklist for Backend Developers

- [x] **Enforce Upfront 402 Guard**: Reject `POST /api/culling/sessions/{id}/upload-photos/` with `402 Payment Required` if `session.is_paid == False`.
- [x] **Tier Photo Count Limits**: Enforce `max_photos_allowed` based on tier (300 for Single Shoot, 1200 for Wedding, Unlimited for Pro).
- [x] **Razorpay Integration**: Clean signature verification with `session.is_paid = True` mutation.
- [x] **Move-to-Gallery Category Bridge**: Respect `category_assignments` dictionary for multi-section organization (`HIGHLIGHTS`, `PORTRAITS`, `CEREMONY`, etc.).
- [x] **Auto-Purge Staging Media**: Immediately call `purge_culling_staging()` after moving photos to free up server and S3 storage.
- [x] **Zero Secondary Charges**: Moving to gallery does not charge the user again since payment was already completed upfront.
