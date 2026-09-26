# Backend API Specification: Gallery Archive, Soft/Hard Delete & Shared Link Disabling

This document contains the complete specification and copy-pasteable code prompt for your backend engineer or backend AI agent to implement the two-stage gallery deletion, archiving lifecycle, and public link protection.

---

## 1. Requirements Overview

1. **Two-Stage Deletion Lifecycle**:
   - When a photographer deletes a gallery from their active workspace, it is **not permanently destroyed**. It is soft-deleted by moving its status to `archived`.
   - When a photographer deletes an already-archived gallery (or passes `?permanent=true`), it is **permanently purged** from the database along with associated storage media objects.
2. **Dashboard Queryset Filtering (`/api/galleries/`)**:
   - `GET /api/galleries/` (default active drive): Returns active, delivered, and draft galleries, **excluding archived**.
   - `GET /api/galleries/?status=archived`: Returns **only archived** galleries for the Archive / Trash tab.
   - `GET /api/galleries/?status=active`: Returns only active galleries.
   - `GET /api/galleries/?status=delivered`: Returns only delivered galleries.
3. **Gallery Restoration (`POST /api/galleries/{id}/restore/`)**:
   - Reactivates an archived gallery, moving its status back to `active` (or `delivered`).
4. **Public Shared Link Disabling (`GET /api/public/galleries/{id_or_slug}/`)**:
   - If a client or guest opens a shared link (`/gallery/{id_or_slug}`) and the gallery is **archived**, access must be **blocked**. Return `HTTP 410 Gone` (or `HTTP 403 Forbidden`) with code `gallery_archived`.
   - If the gallery is **deleted** or does not exist, return `HTTP 404 Not Found`.

---

## 2. Django REST Framework Implementation

### A. Model Definition (`models.py`)
Ensure `Gallery` model has the `'archived'` status choice:

```python
from django.db import models
from django.utils import timezone

class Gallery(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('delivered', 'Delivered'),
        ('draft', 'Draft'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    photographer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='galleries')
    client_name = models.CharField(max_length=255, blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    event_date = models.DateField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
```

---

### B. Studio Dashboard ViewSet (`views.py`)
Update `GalleryViewSet` to handle filtering, soft/hard deletion, and restore actions:

```python
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

class GalleryViewSet(viewsets.ModelViewSet):
    """
    Studio Photographer Gallery Management ViewSet.
    """
    permission_classes = [IsAuthenticated]
    # serializer_class = GallerySerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Gallery.objects.filter(photographer=user)
        status_filter = self.request.query_params.get('status')

        if status_filter == 'archived':
            return queryset.filter(status='archived')
        elif status_filter in ['active', 'delivered', 'draft']:
            return queryset.filter(status=status_filter)
        elif not status_filter or status_filter == 'all':
            # Default active drive view: Exclude archived items so they don't clutter the main drive
            return queryset.exclude(status='archived')

        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Two-stage gallery deletion:
        1. Calling DELETE on an active gallery moves it to 'archived'.
        2. Calling DELETE on an already-archived gallery (or with ?permanent=true) permanently removes it.
        """
        instance = self.get_object()
        is_permanent = request.query_params.get('permanent', 'false').lower() in ('true', '1')

        # Permanent Delete
        if is_permanent or instance.status == 'archived':
            gallery_title = instance.title
            # Cascade media files from cloud storage (S3/Cloudflare R2/GCS) here if applicable
            self.perform_destroy(instance)
            return Response({
                'success': True,
                'status': 'deleted',
                'message': f'Gallery "{gallery_title}" permanently deleted.'
            }, status=status.HTTP_200_OK)

        # Soft Delete (Move to Archive / Trash)
        instance.status = 'archived'
        instance.save(update_fields=['status'])
        return Response({
            'success': True,
            'status': 'archived',
            'message': f'Gallery "{instance.title}" moved to archive / trash.'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """
        POST /api/galleries/{id}/restore/
        Reactivates an archived gallery back to 'active' or 'delivered'.
        """
        instance = self.get_object()
        target_status = request.data.get('status', 'active')
        if target_status not in ['active', 'delivered']:
            target_status = 'active'

        instance.status = target_status
        instance.save(update_fields=['status'])
        return Response({
            'success': True,
            'status': instance.status,
            'message': f'Gallery "{instance.title}" restored to {instance.status}.'
        }, status=status.HTTP_200_OK)
```

---

### C. Public Shared Link Endpoint (`views.py`)
Ensure client viewing links are blocked when archived or deleted:

```python
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

class PublicGalleryDetailView(APIView):
    """
    Public Client Gallery Access.
    GET /api/public/galleries/{slug_or_id}/
    """
    permission_classes = [AllowAny]

    def get(self, request, slug_or_id):
        # 1. Lookup by UUID id or unique slug
        gallery = Gallery.objects.filter(
            Q(id=slug_or_id) | Q(slug=slug_or_id)
        ).first()

        # 2. Deleted or Non-existent Gallery
        if not gallery:
            return Response({
                'code': 'gallery_not_found',
                'detail': 'This collection does not exist or has been permanently removed.'
            }, status=status.HTTP_404_NOT_FOUND)

        # 3. Block Archived Gallery Access
        if gallery.status == 'archived':
            return Response({
                'code': 'gallery_archived',
                'status': 'archived',
                'title': gallery.title,
                'client_name': gallery.client_name,
                'detail': 'This collection has been archived by the studio and is currently unavailable.'
            }, status=status.HTTP_410_GONE)

        # 4. Block Expired Gallery Access
        if gallery.is_expired():
            return Response({
                'code': 'gallery_expired',
                'status': 'expired',
                'title': gallery.title,
                'is_expired': True,
                'detail': 'The access period for this private collection has expired.'
            }, status=status.HTTP_410_GONE)

        # 5. Return Public Gallery Serializer (media items, layout configuration, etc.)
        serializer = PublicGallerySerializer(gallery, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
```

---

## 3. URLs Configuration (`urls.py`)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GalleryViewSet, PublicGalleryDetailView

router = DefaultRouter()
router.register(r'galleries', GalleryViewSet, basename='gallery')

urlpatterns = [
    # Studio authenticated endpoints:
    path('', include(router.urls)),
    
    # Public client share endpoint:
    path('public/galleries/<str:slug_or_id>/', PublicGalleryDetailView.as_view(), name='public-gallery-detail'),
]
```

---

## 4. Endpoint Verification Checklist

| Scenario | HTTP Method & URL | Expected Status | Expected Response Body |
|---|---|---|---|
| Active Drive List | `GET /api/galleries/` | `200 OK` | Array of galleries excluding `status="archived"` |
| Archive Tab List | `GET /api/galleries/?status=archived` | `200 OK` | Array of galleries with `status="archived"` only |
| Soft Delete (Archive) | `DELETE /api/galleries/{id}/` | `200 OK` | `{"success": true, "status": "archived", "message": "..."}` |
| Permanent Wipe | `DELETE /api/galleries/{id}/?permanent=true` | `200 OK` | `{"success": true, "status": "deleted", "message": "..."}` |
| Restore to Active | `POST /api/galleries/{id}/restore/` | `200 OK` | `{"success": true, "status": "active", "message": "..."}` |
| Client visits active link | `GET /api/public/galleries/{slug}/` | `200 OK` | Full gallery data with photos and layout |
| Client visits archived link | `GET /api/public/galleries/{slug}/` | `410 GONE` | `{"code": "gallery_archived", "status": "archived", "detail": "..."}` |
| Client visits deleted link | `GET /api/public/galleries/{slug}/` | `404 NOT FOUND` | `{"code": "gallery_not_found", "detail": "..."}` |

---

## 5. cURL Test Commands

```bash
# 1. Soft delete an active gallery (moves to archive)
curl -X DELETE "https://api.yourdomain.com/api/galleries/<GALLERY_ID>/" \
  -H "Cookie: sessionid=YOUR_COOKIE"

# 2. View Archive / Trash items
curl -X GET "https://api.yourdomain.com/api/galleries/?status=archived" \
  -H "Cookie: sessionid=YOUR_COOKIE"

# 3. Client tries to open archived gallery link (should return 410 with gallery_archived)
curl -i -X GET "https://api.yourdomain.com/api/public/galleries/<GALLERY_SLUG>/"

# 4. Restore gallery back to active
curl -X POST "https://api.yourdomain.com/api/galleries/<GALLERY_ID>/restore/" \
  -H "Cookie: sessionid=YOUR_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'

# 5. Permanently delete gallery from archive
curl -X DELETE "https://api.yourdomain.com/api/galleries/<GALLERY_ID>/?permanent=true" \
  -H "Cookie: sessionid=YOUR_COOKIE"
```

---

## 6. Automatic 15-Day Trash Purge Task

Galleries residing in Archive / Trash must be automatically purged after 15 days of inactivity unless restored.

### Celery / Cron Task or Management Command (`management/commands/purge_archived_galleries.py`):

```python
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.galleries.models import Gallery

class Command(BaseCommand):
    help = "Permanently purge galleries archived more than 15 days ago."

    def handle(self, *args, **options):
        cutoff_date = timezone.now() - timedelta(days=15)
        expired_archives = Gallery.objects.filter(
            status='archived',
            updated_at__lte=cutoff_date
        )
        count = expired_archives.count()
        for gallery in expired_archives:
            # Purge associated storage objects and delete instance
            gallery.delete()
        
        self.stdout.write(self.style.SUCCESS(f"Successfully purged {count} expired archived galleries."))
```

Add this command to your daily cron or Celery Beat scheduler (`@daily` or `crontab(hour=3, minute=0)`).
