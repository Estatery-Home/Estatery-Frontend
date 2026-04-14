from decimal import Decimal

from django.db.models import F, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import PromoCode


def active_promos_for_property(property_obj, ref_date=None):
    """
    Promo codes the customer may use for this listing today: active, in validity window,
    not exhausted, global or scoped to this property.
    """
    ref_date = ref_date or timezone.now().date()
    return (
        PromoCode.objects.filter(is_active=True)
        .filter(Q(applies_to_property__isnull=True) | Q(applies_to_property_id=property_obj.id))
        .filter(Q(valid_from__isnull=True) | Q(valid_from__lte=ref_date))
        .filter(Q(valid_until__isnull=True) | Q(valid_until__gte=ref_date))
        .filter(Q(max_redemptions__isnull=True) | Q(times_redeemed__lt=F("max_redemptions")))
        .order_by("-created_at")
    )


def get_promo_by_code(code):
    if code is None:
        return None
    code = str(code).strip()
    if not code:
        return None
    try:
        return PromoCode.objects.get(code__iexact=code)
    except PromoCode.DoesNotExist:
        return None


def validate_promo_for_booking(promo, property_obj, months, ref_date=None, field="promo_code"):
    """Raise ValidationError if promo cannot be used."""
    ref_date = ref_date or timezone.now().date()
    if not promo:
        raise ValidationError({field: "Invalid promotion code."})
    if not promo.is_active:
        raise ValidationError({field: "This promotion is not active."})
    if promo.valid_from and ref_date < promo.valid_from:
        raise ValidationError({field: "This promotion is not yet valid."})
    if promo.valid_until and ref_date > promo.valid_until:
        raise ValidationError({field: "This promotion has expired."})
    if promo.max_redemptions is not None and promo.times_redeemed >= promo.max_redemptions:
        raise ValidationError({field: "This promotion has reached its usage limit."})
    if promo.applies_to_property_id and promo.applies_to_property_id != property_obj.id:
        raise ValidationError({field: "This promotion does not apply to this property."})
    if promo.min_booking_months and months < promo.min_booking_months:
        raise ValidationError({
            field: f"This promotion requires at least {promo.min_booking_months} months booked."
        })
    if promo.discount_type == "percent" and (
        promo.discount_value < 0 or promo.discount_value > 100
    ):
        raise ValidationError({field: "Invalid promotion configuration (percent)."})
    return promo


def long_stay_fraction_off(months):
    if months >= 12:
        return Decimal("0.15")
    if months >= 6:
        return Decimal("0.10")
    if months >= 3:
        return Decimal("0.05")
    return Decimal("0")


def amount_after_long_stay(property_obj, months):
    base_total = property_obj.effective_monthly_price * months
    return base_total * (Decimal("1") - long_stay_fraction_off(months))


def final_total_with_promo(property_obj, months, promo=None):
    after_ls = amount_after_long_stay(property_obj, months)
    return apply_promo_to_amount(after_ls, promo)


def combined_discount_percent(property_obj, months, promo=None):
    base_total = property_obj.effective_monthly_price * months
    if base_total <= 0:
        return Decimal("0")
    final_total = final_total_with_promo(property_obj, months, promo)
    return ((Decimal("1") - final_total / base_total) * Decimal("100")).quantize(Decimal("0.01"))


def apply_promo_to_amount(amount_after_long_stay, promo):
    """Apply promo on top of amount already adjusted for long-stay tiers."""
    if not promo:
        return amount_after_long_stay
    amt = amount_after_long_stay
    if promo.discount_type == "percent":
        out = amt * (Decimal("100") - promo.discount_value) / Decimal("100")
    else:
        out = amt - promo.discount_value
        if out < 0:
            out = Decimal("0")
    return out.quantize(Decimal("0.01"))
