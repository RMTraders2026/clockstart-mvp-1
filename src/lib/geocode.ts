export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

export async function lookupAddress(address: string): Promise<GeocodeResult> {
  const query = address.trim();
  if (query.length < 5) {
    throw new Error("Enter a full address before looking up coordinates.");
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Address lookup failed. Try again or enter coordinates manually.");
  }

  const results = (await response.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  const first = results[0];
  if (!first) {
    throw new Error("No coordinate match found for that address.");
  }

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    displayName: first.display_name
  };
}
