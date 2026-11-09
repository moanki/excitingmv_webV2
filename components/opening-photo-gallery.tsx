"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

type OpeningPhoto = {
  id: string;
  name: string;
  details: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  objectPosition: string;
};

export function OpeningPhotoGallery({ photos }: { photos: OpeningPhoto[] }) {
  if (!photos.length) return null;

  const rowSize = Math.ceil(photos.length / Math.ceil(photos.length / 6));
  const rows = Array.from({ length: Math.ceil(photos.length / rowSize) }, (_, index) => (
    photos.slice(index * rowSize, (index + 1) * rowSize)
  ));

  return <div className="opening-home__gallery">
    {rows.map((row) => <OpeningPhotoRow key={row[0].id} photos={row} />)}
  </div>;
}

function OpeningPhotoRow({ photos }: { photos: OpeningPhoto[] }) {
  const rowId = useId();
  const [activeId, setActiveId] = useState(photos[0].id);
  const active = photos.some((photo) => photo.id === activeId) ? activeId : photos[0].id;

  return <div className="opening-home__row" data-single={photos.length === 1}>
    {photos.map((photo) => {
      const expanded = photo.id === active;
      const captionId = `${rowId}-${photo.id}`;

      return <article key={photo.id} className="opening-home__photo" data-active={expanded}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && !event.currentTarget.parentElement?.querySelector("a:focus-visible")) {
            setActiveId(photo.id);
          }
        }}
      >
        {photo.imageUrl && <img className="opening-home__image" src={photo.imageUrl} alt={photo.imageAlt}
          loading="lazy" decoding="async" style={{ objectPosition: photo.objectPosition }} />}
        {photos.length > 1 && <button
          className="opening-home__select"
          type="button"
          aria-label={`Show ${photo.name}`}
          aria-expanded={expanded}
          aria-controls={captionId}
          onFocus={() => setActiveId(photo.id)}
          onClick={() => setActiveId(photo.id)}
        >
          <span>{photo.name}</span>
          <Plus size={17} aria-hidden="true" />
        </button>}
        <div id={captionId} className="opening-home__caption" hidden={!expanded}>
          <h3><Link href={photo.href}>{photo.name} <ArrowUpRight size={19} aria-hidden="true" /></Link></h3>
          {photo.details && <p>{photo.details}</p>}
        </div>
      </article>;
    })}
  </div>;
}
