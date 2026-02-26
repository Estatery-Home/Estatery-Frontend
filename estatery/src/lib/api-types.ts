/**
 * API types – match backend API documentation exactly.
 * Base URL: /api (Auth: /api/auth)
 * Use these types when calling the API or handling responses.
 */

/* ---- Auth ---- */

/** user_type for register: customer | owner | admin */
export type UserType = "customer" | "owner" | "admin";

export type User = {
  id: number;
  username: string;
  email: string;
  phone: string;
  avatar: string | null;
  user_type: UserType;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  phone?: string;
  user_type: UserType;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  refresh: string;
  access: string;
  message: string;
};

export type ProfileUpdateRequest = Partial<Pick<User, "username" | "email" | "phone" | "avatar">>;

/* ---- Property ---- */

/** property_type: apartment | house | condo | villa | studio */
export type PropertyTypeApi = "apartment" | "house" | "condo" | "villa" | "studio";

/** status: available | rented | maintenance */
export type PropertyStatusApi = "available" | "rented" | "maintenance";

export type PropertyImage = {
  id?: number;
  image: string;
  is_primary?: boolean;
};

export type Property = {
  id: number;
  title: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zip_code?: string;
  description: string;
  daily_price: string;
  monthly_price: string;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  property_type: PropertyTypeApi;
  status: PropertyStatusApi;
  has_wifi: boolean;
  has_parking: boolean;
  has_pool: boolean;
  has_gym: boolean;
  is_furnished: boolean;
  has_kitchen: boolean;
  min_stay_months?: number;
  max_stay_months?: number;
  monthly_cycle_start?: number;
  security_deposit_months?: string;
  latitude?: number | null;
  longitude?: number | null;
  images?: PropertyImage[];
  primary_image?: PropertyImage | null;
  owner?: User;
  amenities?: string[];
  created_at?: string;
  updated_at?: string;
};

export type PropertyCreateRequest = Omit<
  Partial<Property>,
  "id" | "owner" | "created_at" | "updated_at"
> & {
  title: string;
  description: string;
  property_type: PropertyTypeApi;
  address: string;
  city: string;
  country: string;
  daily_price: string;
  area: number;
};

/* ---- Booking ---- */

/** status: pending | confirmed | active | cancelled | completed | rejected */
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "cancelled"
  | "completed"
  | "rejected";

export type Booking = {
  id: number;
  property: number;
  property_title?: string;
  property_address?: string;
  property_image?: string;
  user?: number;
  user_name?: string;
  user_email?: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: BookingStatus;
  deposit_paid?: boolean;
  deposit_paid_at?: string | null;
  deposit_refunded?: boolean;
  deposit_refunded_at?: string | null;
  created_at?: string;
  updated_at?: string;
  payments?: BookingPayment[];
};

export type BookingCreateRequest = {
  property: number;
  check_in: string;
  check_out: string;
  guests?: number;
  emergency_contact?: string;
  occupation?: string;
  special_requests?: string;
};

/* ---- Payment ---- */

/** payment_type: deposit | rent | late_fee | utility | damage | refund */
export type PaymentTypeApi =
  | "deposit"
  | "rent"
  | "late_fee"
  | "utility"
  | "damage"
  | "refund";

/** status: pending | paid | overdue | refunded | cancelled */
export type PaymentStatusApi =
  | "pending"
  | "paid"
  | "overdue"
  | "refunded"
  | "cancelled";

export type BookingPayment = {
  id: number;
  booking: number;
  payment_type: PaymentTypeApi;
  month_number: number;
  amount: string;
  due_date: string;
  status: PaymentStatusApi;
  paid_date?: string | null;
  transaction_id?: string;
  notes?: string;
  is_overdue?: boolean;
  created_at?: string;
  updated_at?: string;
};

/* ---- Review ---- */

export type PropertyReview = {
  id: number;
  property: number;
  booking: number;
  user: number;
  rating: number;
  comment: string;
  host_response?: string;
  host_responded_at?: string | null;
  user_name?: string;
  user_avatar?: string;
  created_at?: string;
  updated_at?: string;
};

export type ReviewCreateRequest = {
  rating: number;
  comment: string;
};

/* ---- Availability ---- */

export type CheckAvailabilityRequest = {
  check_in: string;
  check_out: string;
};

export type CheckAvailabilityResponse = {
  property_id: number;
  property_title: string;
  available: boolean;
  months?: number;
  monthly_rate?: string;
  total_price?: string;
  discount?: number;
  security_deposit?: string;
};

/* ---- Host Confirm/Reject ---- */

export type HostBookingConfirmRequest = {
  action: "confirm" | "reject";
  reason?: string;
};
