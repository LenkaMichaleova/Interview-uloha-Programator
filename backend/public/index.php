<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/ParcelRepository.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$repo = new ParcelRepository(dirname(__DIR__) . '/data/parcels.geojson');

try {
    if ($uri === '/api/parcels' || $uri === '/api/parcels/') {
        $bbox = trim((string) ($_GET['bbox'] ?? ''));

        if ($bbox === '') {
            echo json_encode(['type' => 'FeatureCollection', 'features' => $repo->getAll()], JSON_PRETTY_PRINT);
            exit;
        }

        $parts = array_map('floatval', explode(',', $bbox));
        if (count($parts) !== 4) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid bbox format. Use minLon,minLat,maxLon,maxLat.']);
            exit;
        }

        [$minLon, $minLat, $maxLon, $maxLat] = $parts;
        $features = $repo->listWithinBounds($minLon, $minLat, $maxLon, $maxLat);

        echo json_encode(['type' => 'FeatureCollection', 'features' => $features], JSON_PRETTY_PRINT);
        exit;
    }

    if ($uri === '/api/parcel' || $uri === '/api/parcel/') {
        $id = trim((string) ($_GET['id'] ?? ''));
        if ($id === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Parcel id is required.']);
            exit;
        }

        $feature = $repo->findById($id);
        if ($feature === null) {
            http_response_code(404);
            echo json_encode(['error' => 'Parcel not found.']);
            exit;
        }

        echo json_encode($feature, JSON_PRETTY_PRINT);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found.']);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Unexpected server error.',
        'message' => $exception->getMessage(),
    ]);
}
