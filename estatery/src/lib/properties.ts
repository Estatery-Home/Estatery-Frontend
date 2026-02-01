export type Property = {
  id: string;
  name: string;
  location: string;
  price: string;
  period: string;
  image: string;
  description?: string;
  beds?: number;
  baths?: number;
  sqft?: string;
};

export const properties: Property[] = [
  {
    id: "1",
    name: "Sierra Lakeview Estate",
    location: "Lake Tahoe, California, USA",
    price: "$625,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    description: "Stunning lakefront estate with panoramic views. Modern finishes, open floor plan, and direct lake access. Perfect for families or retreats.",
    beds: 5,
    baths: 4,
    sqft: "4,200",
  },
  {
    id: "2",
    name: "Coastal Modern Villa",
    location: "Malibu, California, USA",
    price: "$1,200,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop",
    description: "Architectural masterpiece on the coast. Floor-to-ceiling windows, infinity pool, and private beach access.",
    beds: 6,
    baths: 5,
    sqft: "6,500",
  },
  {
    id: "3",
    name: "Downtown Penthouse",
    location: "San Francisco, CA, USA",
    price: "$890,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    description: "Luxury penthouse in the heart of the city. Rooftop terrace, concierge, and bay views.",
    beds: 4,
    baths: 3,
    sqft: "3,800",
  },
  {
    id: "4",
    name: "Urban Loft Living",
    location: "New York, NY, USA",
    price: "$450,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=500&fit=crop",
    description: "Industrial-chic loft with exposed brick and high ceilings. Prime Manhattan location.",
    beds: 2,
    baths: 2,
    sqft: "2,100",
  },
  {
    id: "5",
    name: "Canyon Ridge Retreat",
    location: "Sedona, Arizona, USA",
    price: "$780,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=500&fit=crop",
    description: "Desert oasis with red rock views. Spa-inspired bathrooms, outdoor living spaces.",
    beds: 4,
    baths: 4,
    sqft: "3,600",
  },
  {
    id: "6",
    name: "Oceanfront Paradise",
    location: "Miami Beach, Florida, USA",
    price: "$1,450,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=500&fit=crop",
    description: "Direct oceanfront with private dock. Resort-style pool and outdoor kitchen.",
    beds: 7,
    baths: 6,
    sqft: "8,200",
  },
  {
    id: "7",
    name: "Mountain View Lodge",
    location: "Aspen, Colorado, USA",
    price: "$920,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop",
    description: "Ski-in/ski-out luxury lodge. Stone fireplaces, hot tub, and mountain views.",
    beds: 5,
    baths: 5,
    sqft: "5,400",
  },
  {
    id: "8",
    name: "Garden District Home",
    location: "New Orleans, LA, USA",
    price: "$565,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=500&fit=crop",
    description: "Historic charm with modern updates. Wraparound porch and lush gardens.",
    beds: 4,
    baths: 3,
    sqft: "3,200",
  },
  {
    id: "9",
    name: "Desert Oasis Estate",
    location: "Scottsdale, Arizona, USA",
    price: "$1,100,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=500&fit=crop",
    description: "Contemporary desert estate with courtyard pool and mountain views.",
    beds: 5,
    baths: 4,
    sqft: "4,800",
  },
  {
    id: "10",
    name: "Historic Brownstone",
    location: "Brooklyn, New York, USA",
    price: "$735,000",
    period: "/month",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
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
