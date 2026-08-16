import { ImageIcon } from "lucide-react";

import { optimizedImageUrl } from "@/lib/image-urls";
import type { ResortRoomRecord } from "@/lib/services/resort-service";

type PropertyRoomCardProps = {
  room: ResortRoomRecord;
  eyebrow?: string;
  fallbackCopy?: string;
  imageAltPrefix?: string;
  meta?: string[];
};

const visibleAmenityCount = 4;

export function PropertyRoomCard({
  room,
  eyebrow = "Room Type",
  fallbackCopy = "Room details coming soon.",
  imageAltPrefix = "",
  meta = []
}: PropertyRoomCardProps) {
  const copy = room.description || room.seoDescription || fallbackCopy;
  const amenities = room.amenities.filter(Boolean);
  const visibleAmenities = amenities.slice(0, visibleAmenityCount);
  const hiddenAmenities = amenities.slice(visibleAmenityCount);
  const imageAlt = [imageAltPrefix, room.name].filter(Boolean).join(" ");

  return (
    <article className="resort-story-room-card--property">
      <div className="resort-story-room-card__media">
        {room.photoUrl ? (
          <img
            src={optimizedImageUrl(room.photoUrl, { width: 1400, height: 980, quality: 92 })}
            alt={imageAlt}
            loading="lazy"
          />
        ) : (
          <div className="resort-story-room-card__media-placeholder" aria-label={`${room.name} image placeholder`}>
            <ImageIcon aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="resort-story-room-card__body">
        <div className="resort-story-room-card__header">
          <p className="eyebrow">{eyebrow}</p>
          <h3>{room.name}</h3>
        </div>

        {meta.length ? (
          <div className="resort-story-room-facts">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}

        <p>{copy}</p>

        {amenities.length ? (
          <div className="resort-story-room-amenities">
            <p className="eyebrow">Room Amenities</p>
            <ul className="resort-story-room-amenities__list">
              {visibleAmenities.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            {hiddenAmenities.length ? (
              <details className="resort-story-room-amenities__more">
                <summary>view more amenities</summary>
                <ul className="resort-story-room-amenities__list">
                  {hiddenAmenities.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
