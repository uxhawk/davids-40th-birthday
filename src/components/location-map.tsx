type Props = { name: string; query: string; zoom?: number };

// Google Maps embed. Uses the Embed API when a key is configured, otherwise the
// keyless embed URL, which needs no setup.
export function LocationMap({ name, query, zoom = 12 }: Props) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const q = encodeURIComponent(query);
  const src = key
    ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=${zoom}`
    : `https://www.google.com/maps?q=${q}&z=${zoom}&output=embed`;
  return (
    <iframe
      title={`Map of ${name}`}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      className="block aspect-[4/3] w-full rounded-xl border-2 border-haze sm:aspect-video"
    />
  );
}
