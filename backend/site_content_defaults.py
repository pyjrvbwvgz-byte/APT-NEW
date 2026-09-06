"""Default editable content for the public site. Admin can override via /api/admin/site."""

SITE_CONTENT_DEFAULTS = {
    "announcement": "NO MORE EXCUSES · GET IN SHAPE",
    "nav": {
        "links": [
            {"label": "Home", "href": "/"},
            {"label": "Plans", "href": "/#plans"},
            {"label": "Meals", "href": "/#meals"},
            {"label": "About", "href": "/#about"},
            {"label": "Portal", "href": "/auth"},
        ]
    },
    "landing": {
        "hero": {
            "kicker": "FUEL YOUR AMBITION",
            "title_prefix": "Eat Strong. Train",
            "title_highlight": "Stronger",
            "subtitle": "Optimize your performance with 28 weekly macro-calculated meal blueprints, complete with calorie breakdowns and prep times. Instant PDF downloads for kitchen execution, engineered directly from Abraham's training methodology.",
            "bg_image_url": "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg",
            "primary_cta": "Subscribe for €14.99/mo",
            "secondary_cta": "Enter Client Code",
        },
        "stats": {
            "kicker": "BY THE NUMBERS",
            "title": "Precision Fuel for Performance",
            "items": [
                {"value": "28", "label": "Meals/Week"},
                {"value": "€14.99", "label": "Monthly Rate"},
                {"value": "99.9%", "label": "Generated Client Results"},
                {"value": "100%", "label": "Macro Precision"},
            ],
        },
        "features": {
            "kicker": "ENGINEERED NUTRITION",
            "title": "The APT System",
            "items": [
                {
                    "kicker": "STRUCTURED EATING",
                    "title": "28 Weekly Meal Rosters",
                    "description": "Receive a complete blueprint for your week, removing all guesswork from your nutrition. Every meal is accounted for, aligning with your training goals.",
                    "image_url": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
                    "shape": "circle",
                },
                {
                    "kicker": "INSTANT ACCESS",
                    "title": "Downloadable PDF Blueprints",
                    "description": "Your weekly plan arrives as a detailed PDF, ready for immediate download. Print it, save it, or access it on your device for kitchen execution.",
                    "image_url": "https://images.pexels.com/photos/4021983/pexels-photo-4021983.jpeg",
                    "shape": "rounded",
                },
                {
                    "kicker": "COACH INTEGRATION",
                    "title": "Personal Coach Alignment",
                    "description": "Existing Abraham's Personal Training clients unlock custom plans instantly with a 4-digit code, ensuring seamless integration with your 1:1 coaching.",
                    "image_url": "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg",
                    "shape": "skew",
                },
            ],
        },
        "how": {
            "kicker": "EXECUTION FLOW",
            "title": "Your Path to Caloric Precision",
            "steps": [
                {"n": "01", "t": "Pick Your Plan", "d": "Select the meal plan that aligns with your training intensity and dietary needs. Our system adjusts to you."},
                {"n": "02", "t": "View Macro Metrics", "d": "Each meal comes with precise macro breakdowns and calorie counts, ensuring you hit your numbers every time."},
                {"n": "03", "t": "Download PDF Blueprint", "d": "Receive your detailed weekly roster as an instant PDF. Your kitchen execution guide, ready for action."},
                {"n": "04", "t": "Execute & Conquer", "d": "Follow your blueprint, eliminate guesswork, and focus on your training knowing your nutrition is dialed in."},
            ],
        },
        "cta": {
            "title": "Unlock Your Performance Fuel",
            "subtitle": "Join APT today for €14.99/month, or enter your exclusive 4-digit client code for immediate access.",
            "primary": "Subscribe Now",
            "secondary": "Enter Client Code",
        },
    },
    "footer": {
        "brand": ".VPT WETRAIN",
        "tagline": "28 macro-calculated weekly meals engineered for heavy lifting.",
        "support_label": "Direct Support",
        "support_email": "support@apttrains.com",
        "lines": ["Client Code Portal Active", "Abraham's Personal Training Studio"],
        "copyright": "Engineered by Abraham's Personal Training. €14.99/mo.",
        "strapline": "28 MEALS · MACROS BUILT IN · PDF BLUEPRINTS",
    },
    "extras": [],  # list of {title, caption, image_url} cards
}


def deep_merge(defaults, override):
    """Merge override into defaults non-destructively. Lists are replaced."""
    if not isinstance(defaults, dict) or not isinstance(override, dict):
        return override if override is not None else defaults
    out = dict(defaults)
    for k, v in override.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out
