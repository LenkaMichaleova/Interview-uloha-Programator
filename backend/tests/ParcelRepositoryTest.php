<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/ParcelRepository.php';

$dataFile = dirname(__DIR__) . '/data/parcels.geojson';
$sourceUrl = 'https://services.cuzk.gov.cz/wfs/local-zpmz-wfs.asp?service=WFS&version=2.0.0&request=GetFeature&typenames=zpmz:ZPMZRecord&outputFormat=application/json&srsName=EPSG:4326&count=5';
$repo = new ParcelRepository($dataFile, $sourceUrl, 3600);

$allFeatures = $repo->getAll();
if ($allFeatures === []) {
    fwrite(STDERR, "Expected demo data to be loaded.\n");
    exit(1);
}

$sampleId = (string) ($allFeatures[0]['properties']['id'] ?? '');
if ($sampleId === '') {
    fwrite(STDERR, "Expected first feature to have an id.\n");
    exit(1);
}

$feature = $repo->findById($sampleId);
if ($feature === null || !isset($feature['properties']['parcelNumber'])) {
    fwrite(STDERR, "Expected fetched feature to have normalized parcel metadata.\n");
    exit(1);
}

$filtered = $repo->listWithinBounds(14.14, 49.26, 14.18, 49.29);
if (count($filtered) < 1) {
    fwrite(STDERR, "Expected bbox filter to return at least one parcel.\n");
    exit(1);
}

$offlineRepo = new ParcelRepository($dataFile, 'https://127.0.0.1:1/invalid', 3600);
$refreshed = $offlineRepo->refreshFromSource();
if (!is_array($refreshed) || count($refreshed) < 1) {
    fwrite(STDERR, "Expected refreshFromSource to fall back to cached data when the source is unreachable.\n");
    exit(1);
}

echo "ParcelRepository test passed\n";
