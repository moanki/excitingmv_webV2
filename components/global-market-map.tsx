"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef } from "react";

import type { MarketOption } from "@/lib/site-content";

type GlobalMarketMapProps = {
  markets: MarketOption[];
};

export function GlobalMarketMap({ markets }: GlobalMarketMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const configuredToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const token =
    configuredToken && !/replace|placeholder/i.test(configuredToken) ? configuredToken : undefined;
  const activeMarkets = useMemo(
    () => markets.filter((market) => market.enabled && market.label && market.latitude && market.longitude),
    [markets]
  );

  useEffect(() => {
    if (!token || !mapContainerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [28, 18],
      zoom: 1.25,
      attributionControl: false,
      cooperativeGestures: true,
      projection: "globe"
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(7, 15, 28)",
        "high-color": "rgb(18, 45, 70)",
        "horizon-blend": 0.08
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const markers: mapboxgl.Marker[] = activeMarkets.map((market) => {
      const markerElement = document.createElement("div");
      markerElement.className = "market-map-marker";
      const dot = document.createElement("span");
      const label = document.createElement("strong");
      label.textContent = market.label;
      markerElement.append(dot, label);

      const popup = document.createElement("div");
      const popupTitle = document.createElement("strong");
      popupTitle.textContent = market.label;
      popup.append(popupTitle);

      if (market.region) {
        const popupRegion = document.createElement("span");
        popupRegion.textContent = market.region;
        popup.append(popupRegion);
      }

      return new mapboxgl.Marker(markerElement)
        .setLngLat([market.longitude, market.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 18, closeButton: false }).setDOMContent(popup))
        .addTo(map);
    });

    if (activeMarkets.length) {
      const bounds = new mapboxgl.LngLatBounds();
      activeMarkets.forEach((market) => bounds.extend([market.longitude, market.latitude]));
      map.fitBounds(bounds, { padding: 90, maxZoom: 2.4, duration: 1100 });
    }

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [activeMarkets]);

  return (
    <div className="market-map">
      <div ref={mapContainerRef} className="market-map__canvas" aria-label="Global market reach map" />
      {!token ? (
        <div className="market-map__fallback">
          {activeMarkets.map((market, index) => (
            <span
              key={market.id}
              className="market-map__fallback-pin"
              style={{
                left: `${18 + ((index * 17) % 64)}%`,
                top: `${24 + ((index * 13) % 44)}%`
              }}
            >
              {market.label}
            </span>
          ))}
        </div>
      ) : null}
      <div className="market-map__summary">
        <strong>{activeMarkets.length || markets.length}</strong>
        <span>active partner markets</span>
      </div>
    </div>
  );
}
