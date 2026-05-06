"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useMemo, useState } from "react";
import { Map, Marker, Popup } from "react-map-gl/maplibre";

import type { MarketOption } from "@/lib/site-content";

type GlobalMarketMapProps = {
  markets: MarketOption[];
};

const mapStyle = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

export function GlobalMarketMap({ markets }: GlobalMarketMapProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketOption | null>(null);

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

  return (
    <div className="market-map">
      <div className="market-map__fallback" aria-hidden="true" />
      <div className="market-map__canvas" aria-label="Global market reach map">
        <Map
          initialViewState={{
            longitude: 28,
            latitude: 18,
            zoom: 1.18,
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
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                handleMarkerClick(market);
              }}
            >
              <div className="market-map-marker">
                <span />
                <strong>{market.label}</strong>
              </div>
            </Marker>
          ))}

          {selectedMarket ? (
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
          ) : null}
        </Map>
      </div>

      <div className="market-map__summary">
        <strong>{activeMarkets.length || markets.length}</strong>
        <span>active partner markets</span>
      </div>
    </div>
  );
}
