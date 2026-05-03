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
                  "line-color": "rgba(248,241,220,0.78)",
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
                  "line-color": "rgba(248,241,220,0.2)",
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
                  "text-color": "rgba(255,250,235,0.88)",
                  "text-halo-color": "rgba(7,19,31,0.72)",
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
                  "text-color": "rgba(255,250,235,0.58)",
                  "text-halo-color": "rgba(7,19,31,0.62)",
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
            "fill-color": "rgba(248,241,220,0.26)",
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
            "fill-color": "rgba(248,241,220,0.18)",
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
