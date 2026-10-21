# Frontend parcelní mapy

Tento adresář obsahuje React frontend pro parcelní mapu Jičín. Aplikace zobrazuje parcely na mapě, načítá je podle aktuálního rozsahu a detail parcely lze otevřít kliknutím v mapě nebo výběrem ve filtrech v levém panelu.

## Předpoklady

- Node.js 18+
- npm
- běžící PHP backend na adrese `http://127.0.0.1:8000`

## Spuštění frontendu

V tomto adresáři spusť:

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Poté otevři:

- http://127.0.0.1:5173

## Spuštění backendu

V kořeni projektu:

```bash
php -S 127.0.0.1:8000 -t backend/public
```

Pokud PHP není v PATH, použijte plnou cestu, například:

```bash
/opt/homebrew/opt/php@8.3/bin/php -S 127.0.0.1:8000 -t backend/public
```

## Ověření

```bash
npm run lint
npm run build
```

## Zápisník

- Frontend je postaven na React + Vite, protože umožňuje rychlý vývoj a jednoduché iterování UI.
- Pro mapu jsem zvolila Leaflet, protože dobře pracuje s GeoJSON a je vhodný pro jednoduché interaktivní zobrazení parcel.
- Data se načítají podle `bbox`, aby aplikace nevyžadovala jedno velké množství dat najednou.
- S více časem bych přidala lepší filtry, detail parcel a robustnější zpracování chyb na backendu.
