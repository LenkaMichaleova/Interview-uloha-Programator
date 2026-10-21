<?php

declare(strict_types=1);

final class ParcelRepository
{
    public function __construct(private readonly string $dataFile)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getAll(): array
    {
        return $this->loadFeatures();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listWithinBounds(float $minLon, float $minLat, float $maxLon, float $maxLat): array
    {
        $features = $this->loadFeatures();
        $result = [];

        foreach ($features as $feature) {
            $geometry = $feature['geometry'] ?? [];
            if (($geometry['type'] ?? null) !== 'Polygon') {
                continue;
            }

            $coordinates = $geometry['coordinates'][0] ?? [];
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
        foreach ($this->loadFeatures() as $feature) {
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
    private function loadFeatures(): array
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
