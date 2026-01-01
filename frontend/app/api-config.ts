// API configuration for public pages
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchPlans() {
  const res = await fetch(`${API_BASE_URL}/api/subscription/plans`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch plans");
  }
  return res.json();
}

export interface Plan {
  id: string;
  plan_name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  posts_limit: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}
