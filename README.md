# Parcelní mapa Jičín

Jedná se o demo projekt pro zobrazení parcel v mapě okresu Jičín. Frontend je postaven na React + TypeScript, backend využívá čisté PHP a vrstvu API nad GeoJSON cache souborem. Aplikace zobrazuje parcely podle aktuálního rozsahu mapy a po výběru parcely vykresluje základní informace o daném objektu.

## Co je součástí projektu

- Frontend v adresáři `frontend/` na React + Vite + TypeScript
- Backend v adresáři `backend/` v čistém PHP
- Datová vrstva v `backend/data/parcels.geojson`
- API endpointy v `backend/public/index.php`
- Mapová vrstva pomocí Leaflet a OpenStreetMap tiles

## Předpoklady

- Node.js 18+
- npm
- PHP 8.1+ (pro běh built-in serveru)
- žádná databáze není potřeba; data jsou ukládána v GeoJSON souboru

> Projekt nepoužívá žádný databázový systém. Data se načítají přímo z lokálního GeoJSON souboru, který slouží jako demo datová vrstva.

## Jak projekt spustit

### 1) Instalace frontend závislostí

```bash
cd frontend
npm install
```

### 2) Spuštění PHP backendu

V kořeni projektu spusťte:

```bash
php -S 127.0.0.1:8000 -t backend/public
```

Pokud máte PHP nainstalované mimo PATH, lze použít například:

```bash
/opt/homebrew/opt/php@8.3/bin/php -S 127.0.0.1:8000 -t backend/public
```

### 3) Spuštění frontend aplikace

V druhém terminálu:

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

Poté otevřete v prohlížeči:

- http://127.0.0.1:5173

### 4) Kontrola API

```bash
curl 'http://127.0.0.1:8000/api/parcels?bbox=15.28,50.42,15.41,50.47'
```

Mělo by se vrátit JSON ve formátu GeoJSON FeatureCollection.

## API

- `GET /api/parcels?bbox=minLon,minLat,maxLon,maxLat`
  - vrací parcely v zobrazeném rozsahu mapy
  - parametr `bbox` je volitelný; bez něj API vrátí data pro výchozí oblast okresu Jičín
- `GET /api/parcel?id=parcel-id`
  - vrací jednu parcelu podle ID
- `GET /api/refresh`
  - stáhne zdrojová data, normalizuje je a obnoví lokální GeoJSON cache

## Struktura projektu

- `backend/public/index.php` — vstupní bod API
- `backend/src/ParcelRepository.php` — načítání a filtrování parcel
- `backend/data/parcels.geojson` — demo data parcel
- `frontend/src/` — React komponenty, mapové vrstvy a typy

## Krátký zápisník rozhodnutí

### Co jsem zvolila a proč

- Zvolila jsem čisté PHP bez frameworku, protože projekt je relativně malý a přehledná implementace je rychlejší a snadněji udržovatelná.
- Použila jsem GeoJSON jako lokální zdroj dat, protože je ideální pro demo a jednoduché filtrování podle bounding boxu.
- Pro mapu jsem zvolila Leaflet, protože má nízkou složitost, velmi dobré API pro GeoJSON a rychle se do něj implemetuje interaktivní mapová vrstva.

### Co mě překvapilo

- Největší překvapení pro mě bylo, jak velký vliv má přesné formátování a validace dat v GeoJSON. I drobné odchylky v datech mohou ovlivnit filtrování nebo vykreslování parcel.
- Také mě zajímavě překvapilo, že jednoduchý bbox filtr vypadá na první pohled snadno, ale ve skutečnosti je potřeba dobře definovat, jak se přepínají data při pohybu mapy a jak se počítají rozsahy geometrie.

### Co bych řešila jinak s více časem

- Přidala bych real-time data z ČÚZK nebo WFS zdroje a doplnila cache na backendu.
- Rozšířila bych API o lepší filtraci podle katastrálního území, druhu pozemku a dalších atributů.
- Přidala bych lepší stavové zobrazení načítání, detail parcel a robustnější validaci vstupních parametrů.
- V produkční verzi bych oddělila datovou vrstvu od frontendu a použila databázi nebo cache, které lépe zvládnou větší objem dat.

## Ověření v tomto prostředí

Frontend byl ověřen příkazem:

```bash
cd frontend
npm run lint && npm run build
```

Backend API bylo ověřeno přes built-in PHP server a dotazem:

```bash
curl 'http://127.0.0.1:8000/api/parcels?bbox=15.28,50.42,15.41,50.47'
```

Výsledkem je validní GeoJSON FeatureCollection, které je kompatibilní s mapovou vrstvou v frontendu.

## Nasazení (Render + Netlify)

Projekt může zůstat v jednom GitHub repozitáři (frontend i backend pohromadě).

### 1) Backend na Render

- Přihlaste se na Render přes GitHub a vytvořte `New Web Service`.
- Vyberte tento repozitář.
- Pokud Render nenabízí PHP runtime, zvolte `Docker` runtime.
- Render načte soubor `render.yaml` z kořene projektu a použije `backend/Dockerfile`.
- Po deploy získáte URL backendu, například `https://your-api-name.onrender.com`.

Ověření API:

```bash
curl 'https://your-api-name.onrender.com/api/parcels?bbox=15.3,50.42,15.41,50.47'
```

### 2) Frontend na Netlify

- V Netlify zvolte `Add new site` -> `Import an existing project`.
- Vyberte stejný GitHub repozitář.
- Nastavte:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `dist`
- V proměnných prostředí na Netlify nastavte:
  - `VITE_API_BASE_URL=https://your-api-name.onrender.com`

Frontend používá proměnnou `VITE_API_BASE_URL` pro produkční volání API. Lokálně zůstává zachováno volání přes `/api` a Vite proxy.
