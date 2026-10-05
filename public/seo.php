<?php
/**
 * EX SHARE ATELIER — Social Media Crawler SEO Proxy (Apache / cPanel / Shared Hosting)
 *
 * Intercepts requests from WhatsApp, Facebook, Twitter, Telegram, Slack, etc.
 * and outputs the dynamic Open Graph meta tags (title, description, image).
 * Human visitors are redirected to the React Single Page App automatically.
 */

$type = isset($_GET['type']) ? strtolower(trim($_GET['type'])) : 'gallery';
$rawSlug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
$slug = trim(explode('?', $rawSlug)[0], '/');
$photoId = isset($_GET['photo']) ? trim($_GET['photo']) : '';

// 1. Resolve API Backend Base URL
$apiBase = getenv('API_BASE_URL') ?: (getenv('VITE_API_BASE_URL') ?: 'https://server.exshare.ai/api');
$apiBase = rtrim($apiBase, '/');

// 2. Resolve Frontend Host Domain
$proto = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ? 'https' : 'http';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'exshare.ai';
$siteDomain = $proto . '://' . $host;

// Default SEO Image: User specified public/ex-share-balck-logo.png
$defaultShareLogo = $siteDomain . '/ex-share-balck-logo.png';

$title = 'EX SHARE — Premium Photography Gallery Platform & Client Proofing';
$description = 'Delivering bespoke editorial client proofing, high-resolution photo galleries, 4K cinematic video reels, and AI biometric search for professional photographers.';
$imageUrl = $defaultShareLogo;
$canonicalUrl = $siteDomain . '/';

// Template curated covers
$templateCovers = [
    'editorial' => 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    'masonry'   => 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
    'cinematic' => 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=85',
    'minimal'   => 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
    'default'   => 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
];

function humanizeSlug($s, $fallback) {
    if (empty($s)) return $fallback;
    // Check if UUID
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $s)) {
        return $fallback;
    }
    return ucwords(str_replace(['-', '_'], ' ', $s));
}

function normalizeUrl($img, $domain, $fallback) {
    if (empty($img)) return $fallback;
    $trimmed = trim($img);
    if (strpos($trimmed, 'http://') === 0 || strpos($trimmed, 'https://') === 0) {
        return $trimmed;
    }
    return $domain . '/' . ltrim($trimmed, '/');
}

$context = stream_context_create([
    'http' => [
        'timeout' => 3,
        'header'  => "Accept: application/json\r\nUser-Agent: EXSHARE-Crawler-Proxy/2.0\r\n"
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
    ]
]);

function fetchCandidateApi($urls, $ctx) {
    foreach ($urls as $url) {
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw) {
            $data = json_decode($raw, true);
            if (is_array($data)) return $data;
        }
    }
    return null;
}

if ($type === 'gallery' && !empty($slug)) {
    $canonicalUrl = $siteDomain . '/gallery/' . urlencode($slug) . ($photoId ? '?photo=' . urlencode($photoId) : '');
    $candidateUrls = [
        $apiBase . '/public/galleries/' . urlencode($slug) . '/',
        $apiBase . '/galleries/' . urlencode($slug) . '/'
    ];

    $data = fetchCandidateApi($candidateUrls, $context);
    if ($data) {
        $galleryTitle = !empty($data['title']) ? $data['title'] : (!empty($data['name']) ? $data['name'] : humanizeSlug($slug, 'Client Gallery'));
        $clientName   = !empty($data['client_name']) ? $data['client_name'] : (!empty($data['clientName']) ? $data['clientName'] : 'Valued Client');
        $photographer = !empty($data['photographer_name']) ? $data['photographer_name'] : (!empty($data['studio_name']) ? $data['studio_name'] : '');

        $photoCount = isset($data['photos_count']) ? $data['photos_count'] : (isset($data['media']) && is_array($data['media']) ? count($data['media']) : 0);
        $countLabel = $photoCount > 0 ? "{$photoCount} high-resolution photographs" : "curated collection";

        // Check if specific photo was requested
        $selectedPhoto = null;
        if (!empty($photoId) && isset($data['media']) && is_array($data['media'])) {
            foreach ($data['media'] as $m) {
                if (isset($m['id']) && (string)$m['id'] === $photoId) {
                    $selectedPhoto = $m;
                    break;
                }
            }
        }

        if ($selectedPhoto) {
            $pTitle = !empty($selectedPhoto['title']) ? $selectedPhoto['title'] : 'Photograph';
            $title = "{$pTitle} — {$galleryTitle} | EX SHARE";
            $description = !empty($selectedPhoto['caption']) ? $selectedPhoto['caption'] . " • From \"{$galleryTitle}\" on EX SHARE." : "View photo from \"{$galleryTitle}\" on EX SHARE.";
            $rawImg = !empty($selectedPhoto['url']) ? $selectedPhoto['url'] : (!empty($selectedPhoto['file_url']) ? $selectedPhoto['file_url'] : $defaultShareLogo);
            $imageUrl = normalizeUrl($rawImg, $siteDomain, $defaultShareLogo);
        } else {
            $title = "{$galleryTitle} — Photography Collection | EX SHARE";
            $description = "Explore the private client photography collection \"{$galleryTitle}\" for {$clientName}" . ($photographer ? " by {$photographer}" : "") . ". Featuring {$countLabel}, bespoke proofing, and instant downloads.";

            $templateId = !empty($data['template_id']) ? $data['template_id'] : 'default';
            $tCover = isset($templateCovers[$templateId]) ? $templateCovers[$templateId] : $defaultShareLogo;

            $cover = !empty($data['cover_image']) ? $data['cover_image'] : (!empty($data['coverImage']) ? $data['coverImage'] : (isset($data['media'][0]['url']) ? $data['media'][0]['url'] : $tCover));
            $imageUrl = normalizeUrl($cover, $siteDomain, $defaultShareLogo);
        }
    } else {
        $fallback = humanizeSlug($slug, 'Private Photography Collection');
        $title = "{$fallback} | EX SHARE";
        $description = 'Explore this private client photography collection on EX SHARE. Bespoke proofing, high-resolution downloads, and editorial captures.';
    }
} elseif (($type === 'event' || $type === 'events') && !empty($slug)) {
    $canonicalUrl = $siteDomain . '/events/' . urlencode($slug);
    $candidateUrls = [
        $apiBase . '/public/events/' . urlencode($slug) . '/',
        $apiBase . '/events/' . urlencode($slug) . '/'
    ];

    $data = fetchCandidateApi($candidateUrls, $context);
    if ($data) {
        $eventTitle = !empty($data['title']) ? $data['title'] : (!empty($data['name']) ? $data['name'] : humanizeSlug($slug, 'Live Event'));
        $venue      = !empty($data['venue']) ? $data['venue'] : (!empty($data['city']) ? $data['city'] : '');
        $photographer = !empty($data['photographer_name']) ? $data['photographer_name'] : (!empty($data['studio_name']) ? $data['studio_name'] : '');

        $title = "{$eventTitle} — Live Event & AI Photo Discovery | EX SHARE";
        $description = !empty($data['description']) ? trim($data['description']) : "Live event gallery for \"{$eventTitle}\"" . ($venue ? " at {$venue}" : "") . ($photographer ? " by {$photographer}" : "") . ". Find your photos instantly with AI facial recognition search.";

        $banner = !empty($data['banner_url']) ? $data['banner_url'] : (!empty($data['bannerUrl']) ? $data['bannerUrl'] : (isset($data['media'][0]['url']) ? $data['media'][0]['url'] : $templateCovers['editorial']));
        $imageUrl = normalizeUrl($banner, $siteDomain, $defaultShareLogo);
    } else {
        $fallback = humanizeSlug($slug, 'Live Event Gallery');
        $title = "{$fallback} & AI Photo Discovery | EX SHARE";
        $description = 'Find your photos instantly with AI facial recognition search on EX SHARE live event galleries.';
    }
} elseif ($type === 'portfolio' && !empty($slug)) {
    $canonicalUrl = $siteDomain . '/portfolio/' . urlencode($slug);
    $candidateUrls = [
        $apiBase . '/public/portfolio/' . urlencode($slug) . '/',
        $apiBase . '/portfolio/' . urlencode($slug) . '/'
    ];

    $data = fetchCandidateApi($candidateUrls, $context);
    if ($data) {
        $studio = !empty($data['studio_name']) ? $data['studio_name'] : (!empty($data['studioName']) ? $data['studioName'] : (!empty($data['photographer_name']) ? $data['photographer_name'] : humanizeSlug($slug, 'Professional Photographer')));
        $hero   = !empty($data['hero_image']) ? $data['hero_image'] : (!empty($data['heroImage']) ? $data['heroImage'] : (!empty($data['banner_url']) ? $data['banner_url'] : (!empty($data['profile_photo']) ? $data['profile_photo'] : $defaultShareLogo)));

        $title = "{$studio} — Photography Portfolio & Editorial Works | EX SHARE";
        $description = !empty($data['hero_subtitle']) ? $data['hero_subtitle'] : (!empty($data['bio_story']) ? $data['bio_story'] : (!empty($data['tagline']) ? $data['tagline'] : "Explore bespoke editorial collections and portfolios by {$studio}."));

        $imageUrl = normalizeUrl($hero, $siteDomain, $defaultShareLogo);
    } else {
        $fallback = humanizeSlug($slug, 'Photography Portfolio');
        $title = "{$fallback} | EX SHARE";
        $description = 'Explore bespoke editorial collections and fine art portfolios on EX SHARE.';
    }
}

// MIME Type
$imageType = 'image/jpeg';
if (stripos($imageUrl, '.png') !== false) {
    $imageType = 'image/png';
} elseif (stripos($imageUrl, '.webp') !== false) {
    $imageType = 'image/webp';
}

$safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
$safeDesc  = htmlspecialchars($description, ENT_QUOTES, 'UTF-8');
$safeImage = htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8');
$safeUrl   = htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8');

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=120, s-maxage=600');
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title><?= $safeTitle ?></title>
    <meta name="title" content="<?= $safeTitle ?>" />
    <meta name="description" content="<?= $safeDesc ?>" />
    <link rel="canonical" href="<?= $safeUrl ?>" />

    <!-- Open Graph (WhatsApp, Facebook, LinkedIn, iMessage, Slack, Telegram, Discord) -->
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="EX SHARE Atelier" />
    <meta property="og:title" content="<?= $safeTitle ?>" />
    <meta property="og:description" content="<?= $safeDesc ?>" />
    <meta property="og:image" content="<?= $safeImage ?>" />
    <meta property="og:image:secure_url" content="<?= $safeImage ?>" />
    <meta property="og:image:type" content="<?= $imageType ?>" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="<?= $safeTitle ?>" />
    <meta property="og:url" content="<?= $safeUrl ?>" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@exshare" />
    <meta name="twitter:title" content="<?= $safeTitle ?>" />
    <meta name="twitter:description" content="<?= $safeDesc ?>" />
    <meta name="twitter:image" content="<?= $safeImage ?>" />
    <meta name="twitter:image:alt" content="<?= $safeTitle ?>" />

    <!-- Instant redirect for real browser visits -->
    <meta http-equiv="refresh" content="0;url=<?= $safeUrl ?>" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #07080b; color: #fff; padding: 3rem 1.5rem; text-align: center;">
    <h2 style="font-weight: 600; margin-bottom: 0.5rem;"><?= $safeTitle ?></h2>
    <p style="color: #9ca3af; max-width: 600px; margin: 0 auto 1.5rem;"><?= $safeDesc ?></p>
    <p style="color: #6b7280; font-size: 0.875rem;">Opening gallery... <a href="<?= $safeUrl ?>" style="color: #f59e0b; text-decoration: underline;">Click here if not redirected</a></p>
    <script>window.location.replace("<?= $safeUrl ?>");</script>
  </body>
</html>
