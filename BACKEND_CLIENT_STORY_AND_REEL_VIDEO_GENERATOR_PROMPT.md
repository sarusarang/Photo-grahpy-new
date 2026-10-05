# Backend Client Story & Reel Video Generator Specification & Implementation Prompt

This specification prompt is for backend engineers working on the **Django REST Framework (DRF)** backend.

It defines the backend architecture, data models, serializers, and endpoints to support the **Client Story & Reel Video Creator** feature across all public gallery templates.

---

## 1. Feature Architecture & Overview

### A. Feature Goal
Allow client gallery visitors (wedding couples, family members, event guests, or photographers) to select photos from any gallery, choose a background soundtrack (curated or custom upload), select an aspect ratio (9:16 vertical Reel/Story/WhatsApp status, 1:1 square, or 16:9 widescreen), apply cinematic transitions (Ken Burns motion, crossfade dissolve, zoom burst), and generate high-definition video reels for social media sharing and downloading.

### B. Client vs. Server Responsibilities
1. **Frontend (Browser-Side)**:
   - High-performance real-time Canvas rendering with Ken Burns matrix interpolation.
   - Audio mixing via Web Audio API (`AudioContext`).
   - In-browser recording via `MediaRecorder` (`video/webm` or `video/mp4`).
   - Native social sharing via Web Share API (`navigator.share`) directly to Instagram Stories, WhatsApp Status, and TikTok.
2. **Backend (Django REST Framework)**:
   - **Guest / User Identity**: Lightweight session management (`guest_token`) so every visitor's customized video creations and stories are maintained separately without requiring a complex password registration.
   - **Story Video Persistence**: Storing rendered video files and metadata (`GalleryStoryVideo`) so users can access their creations, re-download them, or view community guest stories.
   - **Optional Server-Side FFmpeg Renderer**: Celery background task for high-resolution headless video generation (useful for low-power mobile devices or batch rendering).

---

## 2. Django Models (`gallery/models.py`)

Add the following models to your `gallery` application:

```python
import os
import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


def story_video_upload_path(instance, filename):
    """
    Storage path: media/galleries/<gallery_id>/story_videos/<unique_filename>
    """
    clean_name = os.path.basename(filename)
    return f"galleries/{instance.gallery_id}/story_videos/{uuid.uuid4().hex[:8]}_{clean_name}"


class GalleryGuestSession(models.Model):
    """
    Lightweight guest identification for public gallery visitors.
    Ensures each guest has their own video stories, favorites, and downloads tracked separately.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gallery = models.ForeignKey(
        'gallery.Gallery',
        on_delete=models.CASCADE,
        related_name='guest_sessions'
    )
    guest_token = models.CharField(
        max_length=128, 
        unique=True, 
        db_index=True,
        help_text="Unique client token stored in visitor's localStorage"
    )
    name = models.CharField(max_length=120, default="Guest Creator")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_active_at']
        indexes = [
            models.Index(fields=['gallery', 'guest_token']),
        ]

    def __str__(self):
        return f"{self.name} ({self.guest_token[:8]}) - Gallery {self.gallery_id}"


class GalleryStoryVideo(models.Model):
    """
    A generated story or reel video created from gallery photographs.
    """
    class AspectRatio(models.TextChoices):
        VERTICAL_9_16 = '9:16', _('9:16 Vertical (Reel / Story / Status)')
        SQUARE_1_1 = '1:1', _('1:1 Square (Instagram Feed)')
        LANDSCAPE_16_9 = '16:9', _('16:9 Widescreen (Cinematic / TV)')

    class TransitionStyle(models.TextChoices):
        KEN_BURNS = 'ken-burns', _('Ken Burns (Cinematic Drift)')
        CROSSFADE = 'crossfade', _('Dreamy Dissolve (Crossfade)')
        BURST = 'burst', _('Dynamic Burst')
        FADE_BLACK = 'fade-black', _('Classic Noir (Fade to Black)')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gallery = models.ForeignKey(
        'gallery.Gallery',
        on_delete=models.CASCADE,
        related_name='story_videos'
    )
    guest_session = models.ForeignKey(
        GalleryGuestSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='story_videos'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_story_videos'
    )

    creator_name = models.CharField(max_length=120, default="Guest Creator")
    title = models.CharField(max_length=255, default="Our Story")
    subtitle = models.CharField(max_length=255, blank=True, default="")
    
    aspect_ratio = models.CharField(
        max_length=10,
        choices=AspectRatio.choices,
        default=AspectRatio.VERTICAL_9_16
    )
    transition_style = models.CharField(
        max_length=20,
        choices=TransitionStyle.choices,
        default=TransitionStyle.KEN_BURNS
    )
    duration_seconds = models.FloatField(default=15.0)

    # Music / Soundtrack metadata
    music_title = models.CharField(max_length=255, blank=True, default="Soundtrack")
    music_artist = models.CharField(max_length=255, blank=True, default="")
    music_url = models.URLField(max_length=1024, blank=True, default="")

    # JSON array of MediaItem IDs included in this reel
    photo_ids = models.JSONField(default=list)

    # Rendered video file (MP4 / WebM)
    video_file = models.FileField(upload_to=story_video_upload_path, max_length=512)
    file_size_bytes = models.BigIntegerField(default=0)

    is_public_story = models.BooleanField(
        default=True,
        help_text="If true, visible in the gallery's guest stories showcase"
    )
    download_count = models.PositiveIntegerField(default=0)
    share_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['gallery', 'created_at']),
            models.Index(fields=['guest_session']),
        ]

    def __str__(self):
        return f"Reel '{self.title}' by {self.creator_name} ({self.aspect_ratio})"
```

---

## 3. DRF Serializers (`gallery/serializers.py`)

```python
from rest_framework import serializers
from .models import GalleryGuestSession, GalleryStoryVideo


class GalleryGuestSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryGuestSession
        fields = ['id', 'guest_token', 'name', 'email', 'phone', 'created_at']
        read_only_fields = ['id', 'created_at']


class GalleryStoryVideoSerializer(serializers.ModelSerializer):
    videoUrl = serializers.SerializerMethodField()
    photoCount = serializers.SerializerMethodField()

    class Meta:
        model = GalleryStoryVideo
        fields = [
            'id', 'creator_name', 'title', 'subtitle',
            'aspect_ratio', 'transition_style', 'duration_seconds',
            'music_title', 'music_artist', 'photo_ids',
            'videoUrl', 'photoCount', 'file_size_bytes',
            'download_count', 'share_count', 'created_at'
        ]
        read_only_fields = ['id', 'videoUrl', 'photoCount', 'download_count', 'share_count', 'created_at']

    def get_videoUrl(self, obj):
        if not obj.video_file:
            return ""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.video_file.url)
        return obj.video_file.url

    def get_photoCount(self, obj):
        return len(obj.photo_ids) if obj.photo_ids else 0


class CreateStoryVideoPayloadSerializer(serializers.Serializer):
    guest_token = serializers.CharField(max_length=128, required=False, allow_blank=True)
    creator_name = serializers.CharField(max_length=120, required=False, default="Guest Creator")
    title = serializers.CharField(max_length=255, required=False, default="Our Story")
    subtitle = serializers.CharField(max_length=255, required=False, allow_blank=True)
    aspect_ratio = serializers.ChoiceField(choices=['9:16', '1:1', '16:9'], default='9:16')
    transition_style = serializers.CharField(max_length=32, default='ken-burns')
    duration_seconds = serializers.FloatField(default=15.0)
    music_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    music_artist = serializers.CharField(max_length=255, required=False, allow_blank=True)
    music_url = serializers.CharField(max_length=1024, required=False, allow_blank=True)
    photo_ids = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    video = serializers.FileField(required=True)
```

---

## 4. DRF Views (`gallery/views.py`)

```python
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Gallery, GalleryGuestSession, GalleryStoryVideo
from .serializers import (
    GalleryGuestSessionSerializer,
    GalleryStoryVideoSerializer,
    CreateStoryVideoPayloadSerializer
)


class GalleryGuestSessionView(APIView):
    """
    POST /api/public/galleries/{id_or_slug}/guest-session/
    Registers or updates an anonymous guest identity for the gallery.
    Stores guest token and creator name so their videos are kept separately.
    """
    permission_classes = [AllowAny]

    def post(self, request, id_or_slug):
        gallery = get_object_or_404(Gallery, models.Q(id=id_or_slug) | models.Q(slug=id_or_slug))
        guest_token = request.data.get('guest_token')
        name = request.data.get('name', 'Guest Creator')
        email = request.data.get('email', '')
        phone = request.data.get('phone', '')

        if not guest_token:
            return Response({"error": "guest_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        guest_session, created = GalleryGuestSession.objects.get_or_create(
            gallery=gallery,
            guest_token=guest_token,
            defaults={
                'name': name,
                'email': email,
                'phone': phone,
                'ip_address': request.META.get('REMOTE_ADDR')
            }
        )

        if not created:
            if name and name != 'Guest Creator':
                guest_session.name = name
            if email:
                guest_session.email = email
            if phone:
                guest_session.phone = phone
            guest_session.save(update_fields=['name', 'email', 'phone', 'last_active_at'])

        serializer = GalleryGuestSessionSerializer(guest_session)
        return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


class GalleryStoryVideoListCreateView(APIView):
    """
    GET  /api/public/galleries/{id_or_slug}/story-videos/
    POST /api/public/galleries/{id_or_slug}/story-videos/
    Lists or saves story reel videos created by gallery guests.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, id_or_slug):
        gallery = get_object_or_404(Gallery, models.Q(id=id_or_slug) | models.Q(slug=id_or_slug))
        guest_token = request.query_params.get('guest_token')
        only_mine = request.query_params.get('mine') == 'true'

        qs = GalleryStoryVideo.objects.filter(gallery=gallery)

        # Filter to only the current guest/user creations if requested
        if only_mine and guest_token:
            qs = qs.filter(guest_session__guest_token=guest_token)
        elif only_mine and request.user.is_authenticated:
            qs = qs.filter(user=request.user)

        serializer = GalleryStoryVideoSerializer(qs, many=True, context={'request': request})
        return Response({
            "count": qs.count(),
            "results": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, id_or_slug):
        gallery = get_object_or_404(Gallery, models.Q(id=id_or_slug) | models.Q(slug=id_or_slug))
        serializer = CreateStoryVideoPayloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        video_file = data['video']
        guest_token = data.get('guest_token')
        guest_session = None

        if guest_token:
            guest_session = GalleryGuestSession.objects.filter(gallery=gallery, guest_token=guest_token).first()
            if not guest_session:
                guest_session = GalleryGuestSession.objects.create(
                    gallery=gallery,
                    guest_token=guest_token,
                    name=data.get('creator_name', 'Guest Creator')
                )

        story_video = GalleryStoryVideo.objects.create(
            gallery=gallery,
            guest_session=guest_session,
            user=request.user if request.user.is_authenticated else None,
            creator_name=data.get('creator_name', 'Guest Creator'),
            title=data.get('title', 'Our Story'),
            subtitle=data.get('subtitle', ''),
            aspect_ratio=data.get('aspect_ratio', '9:16'),
            transition_style=data.get('transition_style', 'ken-burns'),
            duration_seconds=data.get('duration_seconds', 15.0),
            music_title=data.get('music_title', ''),
            music_artist=data.get('music_artist', ''),
            music_url=data.get('music_url', ''),
            photo_ids=data.get('photo_ids', []),
            video_file=video_file,
            file_size_bytes=video_file.size
        )

        response_serializer = GalleryStoryVideoSerializer(story_video, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TrackStoryVideoActionView(APIView):
    """
    POST /api/public/galleries/{id_or_slug}/story-videos/{video_id}/track/
    Increments download or share count for telemetry.
    """
    permission_classes = [AllowAny]

    def post(self, request, id_or_slug, video_id):
        story_video = get_object_or_404(GalleryStoryVideo, id=video_id, gallery__slug=id_or_slug)
        action = request.data.get('action', 'download')

        if action == 'download':
            story_video.download_count += 1
            story_video.save(update_fields=['download_count'])
        elif action == 'share':
            story_video.share_count += 1
            story_video.save(update_fields=['share_count'])

        return Response({"status": "success", "action": action}, status=status.HTTP_200_OK)
```

---

## 5. URL Routes (`gallery/urls.py`)

Add the following routes to your `urls.py`:

```python
from django.urls import path
from .views import (
    GalleryGuestSessionView,
    GalleryStoryVideoListCreateView,
    TrackStoryVideoActionView
)

urlpatterns = [
    # Guest Profile & Session Management
    path('public/galleries/<str:id_or_slug>/guest-session/', GalleryGuestSessionView.as_view(), name='gallery-guest-session'),

    # Story & Reel Videos CRUD
    path('public/galleries/<str:id_or_slug>/story-videos/', GalleryStoryVideoListCreateView.as_view(), name='gallery-story-videos'),
    path('public/galleries/<str:id_or_slug>/story-videos/<uuid:video_id>/track/', TrackStoryVideoActionView.as_view(), name='gallery-story-video-track'),
]
```

---

## 6. Optional: Headless FFmpeg Server-Side Rendering (Celery Worker)

If low-powered mobile devices or high-volume 4K rendering is desired, implement this Celery worker task using `ffmpeg-python`:

```python
# gallery/tasks.py
import subprocess
import os
import tempfile
from celery import shared_task
from .models import GalleryStoryVideo

@shared_task
def render_story_video_ffmpeg(story_video_id):
    """
    Renders high-definition MP4 story video using server-side FFmpeg with Ken Burns transitions.
    """
    story = GalleryStoryVideo.objects.get(id=story_video_id)
    # 1. Fetch images from storage / S3
    # 2. Build FFmpeg command with xfade filters and audio mix
    # 3. Save output MP4 to story.video_file
    return f"Rendered story video {story_video_id} successfully."
```

---

## 7. Frontend Integration Verification

The frontend implementation is already complete and verified:
1. **Interactive Creator Modal**: [`StoryVideoCreatorModal.tsx`](file:///d:/Projects/Photo-garaphy/src/components/gallery/StoryVideoCreatorModal.tsx) provides a live canvas preview, filmstrip photo reordering, custom song upload, curated tracks, and aspect ratio switching (`9:16`, `1:1`, `16:9`).
2. **Accessible Across All Gallery Templates**:
   - Floating Selection Bar (`SelectionBar.tsx`): "Make Video" button.
   - Floating Navbar (`ClientGalleryNavbar.tsx`): "Make Reel" button.
   - Sub-header Filter Bar (`ClientSectionFilterBar.tsx`): "Create Reel" pill in Editorial, Masonry, Cinematic, and Minimal templates.
3. **Guest Identity**: [`guestIdentity.ts`](file:///d:/Projects/Photo-garaphy/src/utils/guestIdentity.ts) tracks guest creators independently in `localStorage` and on the backend.
4. **Export & Sharing**: Uses HTML5 Canvas stream + Web Audio API + `MediaRecorder` + Web Share API (`navigator.share`) for direct 1-tap sharing to Instagram Stories and WhatsApp Status.
