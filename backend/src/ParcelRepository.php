<?php

declare(strict_types=1);

final class ParcelRepository
{
    public function __construct(
        private readonly string $dataFile,
        private readonly string $sourceUrl = 'https://services.cuzk.gov.cz/wfs/local-zpmz-wfs.asp?service=WFS&version=2.0.0&request=GetFeature&typenames=zpmz:ZPMZRecord&outputFormat=application/json&srsName=EPSG:4326',
        private readonly int $cacheTtlSeconds = 86400
    ) {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAll(): array
    {
        $this->ensureCacheFresh();
        return $this->loadFeaturesFromCache();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listWithinBounds(float $minLon, float $minLat, float $maxLon, float $maxLat): array
    {
        $features = $this->getAll();
        $result = [];

        foreach ($features as $feature) {
            $geometry = $feature['geometry'] ?? [];
            if (($geometry['type'] ?? null) !== 'Polygon') {
                continue;
            }

            $coordinates = $geometry['coordinates'][0] ?? [];
            if ($coordinates === []) {
                continue;
            }

            $bbox = $this->calculatePolygonBounds($coordinates);
            if (
                $bbox['west'] <= $maxLon
                && $bbox['east'] >= $minLon
                && $bbox['south'] <= $maxLat
                && $bbox['north'] >= $minLat
            ) {
                $result[] = $feature;
            }
        }

        return $result;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(string $id): ?array
    {
        foreach ($this->getAll() as $feature) {
            $propertyId = (string) ($feature['properties']['id'] ?? '');
            if ($propertyId === $id) {
                return $feature;
            }
        }

        return null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function refreshFromSource(): array
    {
        $payload = $this->downloadSourceData();
        $features = $this->normalizeFeatures($payload['features'] ?? []);

        $directory = dirname($this->dataFile);
        if (!is_dir($directory) && !mkdir($directory, 0777, true) && !is_dir($directory)) {
            throw new RuntimeException('Unable to create cache directory: ' . $directory);
        }

        $json = json_encode(
            ['type' => 'FeatureCollection', 'features' => $features],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
        if ($json === false) {
            throw new RuntimeException('Failed to encode parcel cache payload.');
        }

        if (file_put_contents($this->dataFile, $json) === false) {
            throw new RuntimeException('Failed to save parcel cache file.');
        }

        return $features;
    }

    public function ensureCacheFresh(): void
    {
        if ($this->sourceUrl === '') {
            return;
        }

        if (!is_file($this->dataFile)) {
            $this->refreshFromSource();
            return;
        }

        $lastModified = @filemtime($this->dataFile);
        if ($lastModified === false || (time() - $lastModified) > $this->cacheTtlSeconds) {
            $this->refreshFromSource();
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function loadFeaturesFromCache(): array
    {
        if (!is_file($this->dataFile)) {
            throw new RuntimeException('Parcel data file not found: ' . $this->dataFile);
        }

        $raw = file_get_contents($this->dataFile);
        if ($raw === false) {
            throw new RuntimeException('Failed to read parcel data.');
        }

        $data = json_decode($raw, true);
        if (!is_array($data) || !isset($data['features']) || !is_array($data['features'])) {
            throw new RuntimeException('Parcel data file is not valid GeoJSON.');
        }

        return $data['features'];
    }

    /**
     * @return array<string, mixed>
     */
    private function downloadSourceData(): array
    {
        $raw = null;

        if (function_exists('curl_init')) {
            $ch = curl_init($this->sourceUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_CONNECTTIMEOUT => 15,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_USERAGENT => 'Projekt-Programator/1.0',
                CURLOPT_HTTPHEADER => ['Accept: application/json'],
            ]);

            $raw = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($raw === false || $raw === '' || $httpCode >= 400) {
                throw new RuntimeException('Failed to download source data from ČÚZK WFS: ' . ($curlError !== '' ? $curlError : 'HTTP ' . $httpCode));
            }
        } else {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => 30,
                    'ignore_errors' => true,
                    'header' => "Accept: application/json\r\nUser-Agent: Projekt-Programator/1.0\r\n",
                ],
            ]);

            $raw = @file_get_contents($this->sourceUrl, false, $context);
            if ($raw === false || $raw === '') {
                throw new RuntimeException('Failed to download source data from ČÚZK WFS.');
            }
        }

        $data = json_decode($raw, true);
        if (!is_array($data) || !isset($data['features']) || !is_array($data['features'])) {
            throw new RuntimeException('Downloaded ČÚZK data is not valid GeoJSON.');
        }

        return $data;
    }

    /**
     * @param array<int, array<string, mixed>> $features
     * @return array<int, array<string, mixed>>
     */
    private function normalizeFeatures(array $features): array
    {
        $normalized = [];

        foreach ($features as $feature) {
            $normalized[] = $this->normalizeFeature($feature);
        }

        return $normalized;
    }

    /**
     * @param array<string, mixed> $feature
     * @return array<string, mixed>
     */
    private function normalizeFeature(array $feature): array
    {
        $properties = $feature['properties'] ?? [];
        $geometry = $this->normalizeGeometry($feature['geometry'] ?? ['type' => 'Polygon', 'coordinates' => []]);

        $id = (string) ($properties['id'] ?? $properties['parcel_id'] ?? $properties['gid'] ?? 'parcel-' . uniqid());
        $cadastre = trim((string) ($properties['cadastre'] ?? $properties['cadastralArea'] ?? $properties['katastr'] ?? 'Jičín'));
        $parcelNumber = trim((string) ($properties['parcelNumber'] ?? $properties['parcela'] ?? $properties['parcel_number'] ?? $id));
        $landUse = trim((string) ($properties['landUse'] ?? $properties['druh'] ?? 'Záznam z WFS'));
        $owner = trim((string) ($properties['owner'] ?? $properties['vlastnik'] ?? 'ČÚZK'));
        $status = trim((string) ($properties['status'] ?? 'Aktivní'));
        $area = (float) ($properties['area'] ?? $this->estimateArea($geometry['coordinates'][0] ?? []));

        return [
            'type' => 'Feature',
            'properties' => [
                'id' => $id,
                'parcelNumber' => $parcelNumber,
                'cadastre' => $cadastre === '' ? 'Jičín' : $cadastre,
                'area' => max(0, $area),
                'landUse' => $landUse === '' ? 'Záznam z WFS' : $landUse,
                'owner' => $owner === '' ? 'ČÚZK' : $owner,
                'cadastralArea' => $cadastre === '' ? 'Jičín' : $cadastre,
                'status' => $status === '' ? 'Aktivní' : $status,
            ],
            'geometry' => $geometry,
        ];
    }

    /**
     * @param array<string, mixed> $geometry
     * @return array<string, mixed>
     */
    private function normalizeGeometry(array $geometry): array
    {
        $type = strtoupper((string) ($geometry['type'] ?? 'Polygon'));

        if ($type === 'MULTIPOLYGON' && isset($geometry['coordinates'][0][0])) {
            return ['type' => 'Polygon', 'coordinates' => $geometry['coordinates'][0]];
        }

        if ($type === 'POLYGON') {
            return ['type' => 'Polygon', 'coordinates' => $geometry['coordinates'] ?? []];
        }

        return ['type' => 'Polygon', 'coordinates' => []];
    }

    /**
     * @param array<int, array<int, float>> $ring
     */
    private function estimateArea(array $ring): float
    {
        if (count($ring) < 3) {
            return 0.0;
        }

        $area = 0.0;
        $length = count($ring);

        for ($index = 0; $index < $length; $index++) {
            $current = $ring[$index];
            $next = $ring[($index + 1) % $length];

            if (!isset($current[0], $current[1], $next[0], $next[1])) {
                continue;
            }

            $area += ($current[0] * $next[1]) - ($next[0] * $current[1]);
        }

        $area = abs($area) / 2.0;
        return $area * 111_320 * 111_320;
    }

    /**
     * @param array<int, array<int, float>> $coordinates
     * @return array<string, float>
     */
    private function calculatePolygonBounds(array $coordinates): array
    {
        $west = INF;
        $east = -INF;
        $south = INF;
        $north = -INF;

        foreach ($coordinates as $point) {
            if (!isset($point[0], $point[1])) {
                continue;
            }

            $lon = (float) $point[0];
            $lat = (float) $point[1];

            $west = min($west, $lon);
            $east = max($east, $lon);
            $south = min($south, $lat);
            $north = max($north, $lat);
        }

        return [
            'west' => $west,
            'east' => $east,
            'south' => $south,
            'north' => $north,
        ];
    }
}
