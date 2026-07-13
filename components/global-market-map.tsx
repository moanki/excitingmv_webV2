"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useMemo, useState } from "react";
import { Map, Marker, Popup } from "react-map-gl/maplibre";

import type { MarketOption } from "@/lib/site-content";

type GlobalMarketMapProps = {
  markets: MarketOption[];
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  labelledMap?: boolean;
};

const mapStyle = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";
const labelledMapStyle = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const maldivesHeadquarters = { longitude: 73.2207, latitude: 3.2028 };

export function GlobalMarketMap({ markets, initialViewState, labelledMap = false }: GlobalMarketMapProps) {
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
          initialViewState={initialViewState ?? {
            longitude: 28,
            latitude: 18,
            zoom: 1.18,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={labelledMap ? labelledMapStyle : mapStyle}
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

          <Marker
            longitude={maldivesHeadquarters.longitude}
            latitude={maldivesHeadquarters.latitude}
            anchor="left"
          >
            <div className="market-map-hq" aria-label="Headquarters in Maldives" title="HQ · Maldives">
              <span className="market-map-hq__pin" aria-hidden="true" />
              <span className="market-map-hq__line" aria-hidden="true" />
              <strong>
                <span className="market-map-hq__full">HQ · Maldives</span>
                <span className="market-map-hq__compact">HQ</span>
              </strong>
            </div>
          </Marker>

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
