"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { MapPin } from "lucide-react";
import { Map, Marker } from "react-map-gl/maplibre";

import { normalizeGoogleMapsEmbedUrl } from "@/lib/resort-map";

type ResortLocationMapProps = {
  name: string;
  mapEmbedUrl: string;
  latitude: number | null;
  longitude: number | null;
};

export function ResortLocationMap({ name, mapEmbedUrl, latitude, longitude }: ResortLocationMapProps) {
  let safeEmbedUrl = "";
  try {
    safeEmbedUrl = normalizeGoogleMapsEmbedUrl(mapEmbedUrl);
  } catch {
    // Ignore an invalid stored URL and use coordinates when available.
  }

  if (safeEmbedUrl) {
    return (
      <iframe
        className="resort-location-map"
        src={safeEmbedUrl}
        title={`${name} location on Google Maps`}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (latitude === null || longitude === null) return null;

  return (
    <div className="resort-location-map" aria-label={`${name} location map`}>
      <Map
        initialViewState={{ latitude, longitude, zoom: 11 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%" }}
        cooperativeGestures
      >
        <Marker latitude={latitude} longitude={longitude} anchor="bottom">
          <span className="resort-location-map__pin" aria-label={name}>
            <MapPin aria-hidden="true" />
          </span>
        </Marker>
      </Map>
    </div>
  );
}
