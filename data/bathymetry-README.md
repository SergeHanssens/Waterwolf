# Rijkswaterstaat historical bathymetry

Deploy `bathymetry-ijsselmeer.json.gz`, `bathymetry-metadata.json` and optionally `bathymetry-projection-controls.json`. Raw `bathymetry-source-*` files and `.bathymetry-tools/` are build inputs, not PWA assets.

Source: https://downloads.rijkswaterstaatdata.nl/bodemhoogte_ijsselmeergebied/bodemhoogte_ijg_2022.tif
Source metadata: https://downloads.rijkswaterstaatdata.nl/bodemhoogte_ijsselmeergebied/bodemhoogte_ijg_2022.tif.xml
License: CC0-1.0; publisher Rijkswaterstaat.

The source is a 20 m raster in EPSG:28992, vertical EPSG:5709 (NAP height in metres). The browser grid is 100 m. A cell is populated only if all 25 source pixels are known. Its bottom is the highest (shallowest) source elevation rounded upward to 1 cm. Unknown edges remain unknown. Browser lookup also checks neighbouring cells within 3 m of a boundary to cover projection/position uncertainty. This does not make a historical/interpolated grid a current navigation chart.

The dataset label is 2022. Metadata lineage contains inherited text about the 2013 model, so it must not be represented as all measurements being from 2022. Current station water level minus bottom NAP elevation is an estimate; local setup, dredging, siltation and unseen hazards remain unresolved.

Build environment: Python 3.11; `numpy==2.4.6 rasterio==1.4.4 pyproj==3.7.2` were used. Normal installed dependencies work; a local `.bathymetry-tools/` folder is optional.

Run `python scripts/build-bathymetry.py --check` to inspect the official listing, download the newest raster, compare its SHA-256 even when the year is unchanged, and rebuild only if changed. Publication follows CRS/NAP/resolution/range/nodata validation. Unchanged checks update `checkedAt` and `sourceLastModified` metadata without rewriting the compressed raster. Network/schema/validation errors leave the published grid in place. Newer and revised data must still be reviewed; a successful update never certifies navigation.

Browser: `await loadBathymetry()`, then `depthAt({lat,lon}, [{lat,lon,valueM,time,station,basin}])`. `valueM` is metres NAP, `time` ISO or milliseconds; `basin` is `ijsselmeer` or `markermeer`. Missing basin uses the Houtribdijk geographic divider, not a comprehensive hydrographic polygon. The lowest fresh same-basin station value within 50 km is used; missing/stale/outside/no-data cases return `unknown: true`. Unsupported gzip decompression also remains unavailable rather than inventing depths.

On the production `sergehanssens.github.io` site, browser and worker read compressed grids and check metadata from `https://raw.githubusercontent.com/SergeHanssens/Waterwolf/main/data/`, so validated workflow commits are available without a Pages rebuild. Local development uses local assets. `refreshBathymetry()` rechecks metadata with `no-store` and a minute query key, downloads a changed grid only when its source hash changes, validates format and matching source hash, then replaces the model. Failure preserves the previous grid and its successful check date. Call it alongside the water-level refresh and show the last check time.
