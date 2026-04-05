"""
Curated locale choices for public GET /api/languages/ and /api/timezones/.
Extend these tuples to add more options without frontend deploys.
"""

LANGUAGE_CHOICES = (
    ("en-US", "English (United States)"),
    ("en-GB", "English (United Kingdom)"),
    ("fr-FR", "French (France)"),
    ("fr-CA", "French (Canada)"),
    ("es-ES", "Spanish (Spain)"),
    ("es-MX", "Spanish (Mexico)"),
)

TIMEZONE_CHOICES = (
    ("Africa/Accra", "GMT (Africa/Accra)"),
    ("America/New_York", "EST (America/New_York)"),
    ("Europe/London", "GMT (Europe/London)"),
    ("Europe/Paris", "CET (Europe/Paris)"),
    ("America/Los_Angeles", "Pacific Time (PST / PDT)"),
    ("Asia/Dubai", "GST (Asia/Dubai)"),
    ("Asia/Kolkata", "IST (Asia/Kolkata)"),
    ("Asia/Tokyo", "JST (Asia/Tokyo)"),
    ("Australia/Sydney", "AEST (Australia/Sydney)"),
)
