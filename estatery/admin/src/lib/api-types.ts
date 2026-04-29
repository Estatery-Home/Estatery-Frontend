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
  country?: string;
  avatar: string | null;
  user_type: UserType;
  email_verified?: boolean;
  /** Profile social links — shown on all properties this user owns (customer site). */
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  youtube_url?: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
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

export type ProfileUpdateRequest = Partial<Pick<User, "username" | "email" | "phone" | "country" | "avatar">>;

/* ---- Property ---- */

/** property_type: apartment | house | condo | villa | studio */
export type PropertyTypeApi = "apartment" | "house" | "condo" | "villa" | "studio";

/** listing_type: rent | sale */
export type ListingTypeApi = "rent" | "sale";

/** status: available | rented | maintenance */
export type PropertyStatusApi = "available" | "rented" | "maintenance";

export type PropertyConditionApi = "newly_built" | "fairly_used" | "used";

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
  listing_type?: ListingTypeApi;
  property_condition?: PropertyConditionApi;
  status: PropertyStatusApi;
  has_wifi: boolean;
  has_parking: boolean;
  has_pool: boolean;
  has_gym: boolean;
  is_furnished: boolean;
  has_kitchen: boolean;
  has_prepaid_meter?: boolean;
  has_postpaid_meter?: boolean;
  has_24h_electricity?: boolean;
  has_kitchen_cabinets?: boolean;
  has_dining_area?: boolean;
  custom_facilities?: string[];
  times_booked?: number;
  upload_timestamp?: string;
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
  area?: number | null;
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

/** GET /api/admin/bookings/ — platform-wide row (staff or user_type admin). */
export type AdminBookingRow = {
  id: number;
  property: number;
  user?: number;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  booking_type?: string;
  total_price: string;
  agreed_monthly_rate?: string;
  months_booked?: number;
  discount_applied?: string;
  security_deposit?: string;
  applied_promo_code?: string | null;
  property_title?: string;
  property_address?: string;
  property_city?: string;
  property_image?: string | null;
  user_name?: string;
  user_email?: string;
  host_name?: string;
  host_email?: string;
  emergency_contact?: string;
  occupation?: string;
  special_requests?: string;
  rejection_reason?: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  deposit_paid?: boolean;
  deposit_paid_at?: string | null;
  /** momo_card | offline — MoMo/card only after booking is approved */
  tenant_payment_channel?: string;
  created_at?: string;
  updated_at?: string;
};

export type PaginatedAdminBookings = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminBookingRow[];
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
  action: "confirm" | "reject" | "cancel";
  reason?: string;
};

/* ---- Messaging (1:1 conversations) ---- */

export type MessageParticipant = {
  id: number;
  username: string;
  email: string;
  phone?: string;
};

export type ConversationLastMessage = {
  body: string;
  created_at: string;
  sender_id: number;
};

export type ConversationSummary = {
  id: number;
  other_user: MessageParticipant | null;
  last_message: ConversationLastMessage | null;
  updated_at: string;
};

export type ThreadMessage = {
  id: number;
  conversation: number;
  sender_id: number;
  sender_username: string;
  body: string;
  created_at: string;
};

/* ---- Host dashboard (GET /api/dashboard/host/) ---- */

export type HostDashboardProperties = {
  total: number;
  active: number;
  rent_listings: number;
  sale_listings: number;
};

export type HostDashboardBookings = {
  total: number;
  pending: number;
  active: number;
};

export type HostDashboardRevenue = {
  total: string;
  upcoming: string;
  last_30_days: string;
  prior_30_days: string;
};

export type HostListingsChartPoint = {
  label: string;
  rent: number;
  sale: number;
};

export type HostListingsChart = {
  weekly: HostListingsChartPoint[];
  monthly: HostListingsChartPoint[];
  yearly: HostListingsChartPoint[];
};

export type HostActivityPoint = {
  date: string;
  dateLabel: string;
  views: number;
  property: number;
};

export type HostActivityChart = {
  Daily: HostActivityPoint[];
  Weekly: HostActivityPoint[];
  Monthly: HostActivityPoint[];
  Yearly: HostActivityPoint[];
};

export type HostDashboardComparison = {
  revenue_pct: number | null;
  rent_listings_pct: number | null;
  sale_listings_pct: number | null;
};

export type HostRecentPaymentRow = {
  id: number;
  booking: number;
  payment_type: string;
  month_number: number;
  amount: string;
  due_date: string;
  status: string;
  paid_date?: string | null;
  transaction_id?: string;
  property_title?: string;
  customer?: string;
};

export type HostPaymentsSummary = {
  count: number;
  paid: number;
  pending: number;
  overdue: number;
  cancelled: number;
  refunded: number;
};

export type HostPaymentsListResponse = {
  payments: HostRecentPaymentRow[];
  summary: HostPaymentsSummary;
};

/** Admin promo codes — GET/POST /api/admin/discounts/, PATCH/DELETE /api/admin/discounts/:id/ */
export type PromoDiscountType = "percent" | "fixed";

export type PromoCode = {
  id: number;
  code: string;
  description: string;
  discount_type: PromoDiscountType;
  discount_value: string;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  is_active: boolean;
  min_booking_months: number | null;
  applies_to_property: number | null;
  created_at: string;
  updated_at: string;
};

export type PromoCodeCreateInput = {
  code: string;
  description?: string;
  discount_type: PromoDiscountType;
  discount_value: string;
  valid_from?: string | null;
  valid_until?: string | null;
  max_redemptions?: number | null;
  is_active?: boolean;
  min_booking_months?: number | null;
  applies_to_property?: number | null;
};

/** GET/POST/PATCH /api/calendar/events/ — shared customer + admin schedules */
export type ScheduleEvent = {
  id: number;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  created_by: number;
  participant_user_ids: number[];
  created_at: string;
  updated_at: string;
};

export type HostAnalyticsSummary = {
  properties_total: number;
  properties_available: number;
  clients: number;
  occupancy_rate: number;
  active_discounts: number;
};

export type HostAnalyticsListingMix = {
  rent: number;
  sale: number;
  reserved: number;
  total: number;
  percent: { rent: number; sale: number; reserved: number };
};

export type HostAnalyticsTopProperty = {
  id: number;
  title: string;
  location: string;
  bookings_in_period: number;
  leads: number;
  updated_at: string;
};

export type HostAnalyticsResponse = {
  range: string;
  summary: HostAnalyticsSummary;
  traffic: {
    metric: string;
    labels: string[];
    series: number[];
  };
  listing_mix: HostAnalyticsListingMix;
  top_properties: HostAnalyticsTopProperty[];
};

export type HostCalendarEventApi = {
  id: string;
  booking_id: number;
  title: string;
  date: string;
  status: string;
  property_id: number;
  property_title: string;
  all_day: boolean;
  /** ISO date strings — same on every night row for this booking */
  check_in?: string;
  check_out?: string;
  guests?: number;
};

export type HostCalendarResponse = {
  events: HostCalendarEventApi[];
};

export type HostClientsSummary = {
  total: number;
  ongoing: number;
  completed: number;
};

export type HostClientListRowApi = {
  id: string;
  clientId: string;
  tenant_user_id: number;
  name: string;
  avatarInitials: string;
  propertyName: string;
  propertyAddress: string;
  type: "Rent" | "Buy";
  amount: string;
  currency: string;
  nextPayment: string;
  status: "On Going" | "Completed" | "Overdue";
  user_type: string;
};

export type HostClientsListResponse = {
  summary: HostClientsSummary;
  clients: HostClientListRowApi[];
};

export type HostClientDetailBlock = {
  clientId: string;
  tenantUserId: number;
  name: string;
  avatarInitials: string;
  email: string;
  phone: string;
  bio: string;
  user_type: string;
  propertyName: string;
  propertyAddress: string;
  propertyType: string;
  transactionDate: string;
  transactionType: string;
  rentDuration: string;
};

export type HostClientTransactionApi = {
  id: string;
  paymentType: string;
  dueDate: string;
  amount: number;
  status: "Pending" | "Paid";
};

export type HostClientDetailResponse = {
  tenant: User;
  detail: HostClientDetailBlock;
  bookings: unknown[];
  transactions: HostClientTransactionApi[];
};

export type HostDashboardResponse = {
  properties: HostDashboardProperties;
  bookings: HostDashboardBookings;
  revenue: HostDashboardRevenue;
  recent_bookings: unknown[];
  recent_payments: HostRecentPaymentRow[];
  listings_chart: HostListingsChart;
  activity_chart: HostActivityChart;
  comparison: HostDashboardComparison;
  currency: string;
};
