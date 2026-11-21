export type PharmacyLocation = {
  id: string;
  name: string;
  city: string;
};

export const PHARMACY_LOCATIONS: PharmacyLocation[] = [
  {
    id: "toronto-downtown",
    name: "Downtown Toronto",
    city: "Toronto, ON",
  },
  {
    id: "north-york",
    name: "North York",
    city: "Toronto, ON",
  },
  {
    id: "ottawa-central",
    name: "Ottawa Central",
    city: "Ottawa, ON",
  },
];

export function getLocationById(id: string): PharmacyLocation | undefined {
  return PHARMACY_LOCATIONS.find((location) => location.id === id);
}
