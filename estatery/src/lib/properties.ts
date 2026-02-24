export type PropertyType = "Rent" | "Sale";
export type PropertyStatus = "Available" | "Rented" | "Sold";

export type Property = {
  id: string;
  name: string;
  location: string;
  price: string;
  period: string;
  /** Lease duration e.g. "6 months", "1 year", "2 years" */
  rentalPeriod?: string;
  image: string;
  description?: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  views?: number;
  lastUpdated?: string;
};

export const properties: Property[] = [
  {
    id: "03483",
    name: "Seaside Retreat",
    location: "258 Coastline Dr, Springfield, USA",
    price: "₵575.00",
    period: "/month",
    rentalPeriod: "1 year",
    image: "/images/property-1.webp",
    description: "Stunning lakefront estate with panoramic views.",
    beds: 5,
    baths: 4,
    sqft: "4,200",
    type: "Rent",
    status: "Available",
    views: 804,
    lastUpdated: "July 08, 2025",
  },
  {
    id: "03484",
    name: "Mountain Escape",
    location: "123 Summit Ave, Denver, USA",
    price: "₵1,200.00",
    period: "/month",
    rentalPeriod: "6 months",
    image: "/images/property-2.webp",
    description: "Architectural masterpiece on the coast.",
    beds: 6,
    baths: 5,
    sqft: "6,500",
    type: "Rent",
    status: "Available",
    views: 605,
    lastUpdated: "August 15, 2025",
  },
  {
    id: "03485",
    name: "Urban Loft",
    location: "456 City Center, New York, USA",
    price: "₵2,500.00",
    period: "/month",
    rentalPeriod: "2 years",
    image: "/images/property-3.webp",
    description: "Luxury penthouse in the heart of the city.",
    beds: 4,
    baths: 3,
    sqft: "3,800",
    type: "Rent",
    status: "Available",
    views: 302,
    lastUpdated: "September 01, 2025",
  },
  {
    id: "03486",
    name: "Countryside Villa",
    location: "789 Farm Rd, Austin, USA",
    price: "₵850.00",
    period: "/month",
    rentalPeriod: "1 year",
    image: "/images/property-4.webp",
    description: "Industrial-chic loft with exposed brick.",
    beds: 2,
    baths: 2,
    sqft: "2,100",
    type: "Rent",
    status: "Available",
    views: 201,
    lastUpdated: "July 20, 2025",
  },
  {
    id: "03487",
    name: "Cozy Cabin",
    location: "321 Woodland Way, Seattle, USA",
    price: "₵650.00",
    period: "/month",
    rentalPeriod: "6 months",
    image: "/images/property-5.webp",
    description: "Desert oasis with red rock views.",
    beds: 4,
    baths: 4,
    sqft: "3,600",
    type: "Rent",
    status: "Available",
    views: 450,
    lastUpdated: "June 30, 2025",
  },
  {
    id: "6",
    name: "Oceanfront Paradise",
    location: "Miami Beach, Florida, USA",
    price: "₵1,450,000",
    period: "/month",
    rentalPeriod: "1 year",
    image: "/images/property-6.webp",
    description: "Direct oceanfront with private dock. Resort-style pool and outdoor kitchen.",
    beds: 7,
    baths: 6,
    sqft: "8,200",
  },
  {
    id: "7",
    name: "Mountain View Lodge",
    location: "Aspen, Colorado, USA",
    price: "₵920,000",
    period: "/month",
    rentalPeriod: "2 years",
    image: "/images/property-7.webp",
    description: "Ski-in/ski-out luxury lodge. Stone fireplaces, hot tub, and mountain views.",
    beds: 5,
    baths: 5,
    sqft: "5,400",
  },
  {
    id: "8",
    name: "Garden District Home",
    location: "New Orleans, LA, USA",
    price: "₵565,000",
    period: "/month",
    rentalPeriod: "1 year",
    image: "/images/property-8.webp",
    description: "Historic charm with modern updates. Wraparound porch and lush gardens.",
    beds: 4,
    baths: 3,
    sqft: "3,200",
  },
  {
    id: "9",
    name: "Desert Oasis Estate",
    location: "Scottsdale, Arizona, USA",
    price: "₵1,100,000",
    period: "/month",
    rentalPeriod: "2 years",
    image: "/images/property-9.webp",
    description: "Contemporary desert estate with courtyard pool and mountain views.",
    beds: 5,
    baths: 4,
    sqft: "4,800",
  },
  {
    id: "10",
    name: "Historic Brownstone",
    location: "Brooklyn, New York, USA",
    price: "₵735,000",
    period: "/month",
    rentalPeriod: "1 year",
    image: "/images/property-10.webp",
    description: "Restored brownstone with original details. Garden and roof deck.",
    beds: 3,
    baths: 3,
    sqft: "2,800",
  },
];

export function getPropertyById(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function getOtherProperties(excludeId: string, limit = 6): Property[] {
  return properties.filter((p) => p.id !== excludeId).slice(0, limit);
}
