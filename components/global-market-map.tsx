"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Map, Marker, Popup } from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { MarketOption } from "@/lib/site-content";

type GlobalMarketMapProps = {
  markets: MarketOption[];
};

/**
 * Minimal luxury world map — countries only, no sea, English labels.
 * Uses a runtime-modified positron style from OpenFreeMap.
 */
export function GlobalMarketMap({ markets }: GlobalMarketMapProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketOption | null>(null);
  const [mapStyle, setMapStyle] = useState<StyleSpecification | string | null>(null);

  useEffect(() => {
    fetch("https://tiles.openfreemap.org/styles/positron")
      .then((res) => res.json())
      .then((style: StyleSpecification & { sources?: Record<string, unknown>; layers?: any[] }) => {
        // Remove the ne2_shaded raster source (satellite/topography imagery)
        if (style.sources?.ne2_shaded) {
          delete style.sources.ne2_shaded;
        }

        // IDs of layers we want to KEEP
        const keepIds = new Set([
          "background",
          "landcover_ice_shelf",
          "landcover_glacier",
          "boundary_state",
          "boundary_country_z0-4",
          "boundary_country_z5-",
          "place_country_other",
          "place_country_minor",
          "place_country_major",
          "place_state",
          "place_city_large",
          "place_city",
        ]);

        // Filter layers to only keep country-relevant ones, plus add a land fill
        style.layers = style.layers
          .filter((layer: any) => {
            // Remove the raster hillshade layer
            if (layer.source === "ne2_shaded") return false;
            return keepIds.has(layer.id);
          })
          .map((layer: any) => {
            // Make background the section bg color (transparent so CSS bg shows)
            if (layer.id === "background") {
              return {
                ...layer,
                paint: { "background-color": "rgba(0,0,0,0)" },
              };
            }

            // Style country boundaries — thin, elegant
            if (layer.id.startsWith("boundary_country")) {
              return {
                ...layer,
                paint: {
                  ...layer.paint,
                  "line-color": "rgba(19,32,43,0.34)",
                  "line-width": 1.25,
                  "line-blur": 0,
                },
              };
            }

            // State boundaries — very subtle
            if (layer.id === "boundary_state") {
              return {
                ...layer,
                paint: {
                  ...layer.paint,
                  "line-color": "rgba(19,32,43,0.16)",
                  "line-width": 0.5,
                  "line-dasharray": [2, 2],
                },
              };
            }

            // Country labels — light, elegant, uppercase
            if (layer.id.startsWith("place_country") || layer.id === "place_state") {
              return {
                ...layer,
                layout: {
                  ...layer.layout,
                  // Only show English name
                  "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                  "text-transform": "uppercase",
                  "text-font": ["Noto Sans Regular"],
                  "text-letter-spacing": 0.15,
                },
                paint: {
                  ...layer.paint,
                  "text-color": "rgba(19,32,43,0.68)",
                  "text-halo-color": "rgba(255,255,255,0.86)",
                  "text-halo-width": 1.4,
                },
              };
            }

            // City labels
            if (layer.id.startsWith("place_city")) {
              return {
                ...layer,
                layout: {
                  ...layer.layout,
                  "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                  "text-transform": "uppercase",
                  "text-font": ["Noto Sans Regular"],
                  "text-letter-spacing": 0.08,
                },
                paint: {
                  ...layer.paint,
                  "text-color": "rgba(19,32,43,0.46)",
                  "text-halo-color": "rgba(255,255,255,0.78)",
                  "text-halo-width": 1,
                },
              };
            }

            return layer;
          });

        // Insert a land-fill layer right after the background
        // This renders all land polygons with a subtle fill
        style.layers.splice(1, 0, {
          id: "land-fill",
          type: "fill",
          source: "openmaptiles",
          "source-layer": "landcover",
          minzoom: 0,
          maxzoom: 24,
          paint: {
            "fill-color": "rgba(19,32,43,0.08)",
          },
        });

        // Add country fills using admin boundaries
        style.layers.splice(2, 0, {
          id: "country-fill",
          type: "fill",
          source: "openmaptiles",
          "source-layer": "boundary",
          filter: ["all", ["==", ["get", "admin_level"], 2], ["==", ["get", "maritime"], 0]],
          paint: {
            "fill-color": "rgba(19,32,43,0.05)",
          },
        });

        setMapStyle(style);
      })
      .catch(() => {
        setMapStyle("https://tiles.openfreemap.org/styles/positron");
      });
  }, []);

  const activeMarkets = useMemo(
    () => markets.filter((market) => market.enabled && market.label && market.latitude && market.longitude),
    [markets]
  );

  const handleMarkerClick = useCallback((market: MarketOption) => {
    setSelectedMarket((prev) => (prev?.id === market.id ? null : market));
  }, []);

  const handlePopupClose = useCallback(() => {
    setSelectedMarket(null);
  }, []);

  if (!mapStyle) {
    return (
      <div className="market-map">
        <div className="market-map__fallback" aria-hidden="true" />
        <div className="market-map__canvas" aria-label="Global market reach map" />
        <div className="market-map__summary">
          <strong>{activeMarkets.length || markets.length}</strong>
          <span>active partner markets</span>
        </div>
      </div>
    );
  }

  return (
    <div className="market-map">
      <div className="market-map__fallback" aria-hidden="true" />
      <svg className="market-map__world" viewBox="0 0 1000 520" role="img" aria-label="World map silhouette">
        <path d="M143 154 206 114l69 17 51 42-24 49-67 12-21 44-68-14-38-52z" />
        <path d="m288 258 55 30 36 72-21 80-45 40-40-54-18-87z" />
        <path d="m426 126 92-20 89 26 52 58-37 52-82-16-46 39-88-24-30-63z" />
        <path d="m570 266 50 30 32 72-34 68-52-29-24-88z" />
        <path d="m654 153 86-34 92 16 82 55-34 54-91-2-52 47-106-26-54-54z" />
        <path d="m786 312 73 16 42 46-30 52-66-16-40-50z" />
        <path d="m216 76 68-28 70 18-38 42-76-3z" />
        <path d="m476 70 94-26 118 30-42 36-100-8z" />
      </svg>
      <div className="market-map__canvas" aria-label="Global market reach map">
        <Map
          initialViewState={{
            longitude: 28,
            latitude: 18,
            zoom: 1.25,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          attributionControl={false}
          cooperativeGestures
        >
          {activeMarkets.map((market) => (
            <Marker
              key={market.id}
              longitude={market.longitude}
              latitude={market.latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(market);
              }}
            >
              <div className="market-map-marker">
                <span />
                <strong>{market.label}</strong>
              </div>
            </Marker>
          ))}

          {selectedMarket && (
            <Popup
              longitude={selectedMarket.longitude}
              latitude={selectedMarket.latitude}
              anchor="bottom"
              offset={18}
              closeButton={false}
              onClose={handlePopupClose}
              className="market-map-popup"
            >
              <strong>{selectedMarket.label}</strong>
              {selectedMarket.region ? <span>{selectedMarket.region}</span> : null}
            </Popup>
          )}
        </Map>
      </div>

      <div className="market-map__summary">
        <strong>{activeMarkets.length || markets.length}</strong>
        <span>active partner markets</span>
      </div>
    </div>
  );
}
