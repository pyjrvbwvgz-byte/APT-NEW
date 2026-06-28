"""Default editable content for the public site. Admin can override via /api/admin/site."""

SITE_CONTENT_DEFAULTS = {
    "landing": {
        "hero": {
            "badge": "Weekly meal prep · made simple",
            "title_line1": "Eat strong.",
            "title_line2": "Train stronger.",
            "subtitle_html": "APT · <em>bruddatrain</em> — weekly meal plans from <strong>Abraham's Personal Training</strong>. Simple recipes, an auto shopping list, macros and a downloadable PDF you can take to the shop.",
            "image_url": "https://images.pexels.com/photos/5794779/pexels-photo-5794779.jpeg",
            "subscribe_cta": "Subscribe · €14.99 / mo",
            "code_cta": "I have a 4-digit code",
        },
        "weekly_tile": {
            "label": "THIS WEEK",
            "title": "21 meals · macros built in",
            "subtitle": "Real food. Real progress.",
        },
        "pricing": {
            "kicker": "Two ways in",
            "title": "Pick your path.",
            "subtitle": "Subscribe and access your plan anytime — or get a weekly 4-digit code from your APT coach.",
            "subscription": {
                "label": "Monthly subscription",
                "price": "€14.99",
                "period": "/ month",
                "bullets": [
                    "Instant access to the weekly Mon–Sun plan",
                    "Full recipes with kcal & macros",
                    "Auto shopping list + PDF download",
                    "Cancel anytime — access ends at period end",
                ],
                "cta": "Subscribe now",
                "badge": "Recommended",
            },
            "code": {
                "label": "Coaching clients",
                "title": "4-digit code",
                "subtitle": "From your APT coach. Rotates every Monday.",
                "bullets": [
                    "Active 1:1 coaching clients only",
                    "New code every Monday, hand-delivered by Abraham",
                    "Access stops the week your coaching ends",
                    "Want to stay after coaching? Switch to a subscription",
                ],
                "cta": "Enter my code",
            },
        },
        "how": {
            "kicker": "How it works",
            "title": "Three steps. No excuses.",
            "steps": [
                {"n": "01", "t": "Get access", "d": "Subscribe for €14.99/month — or use the weekly code from your coach."},
                {"n": "02", "t": "Get your week", "d": "Open the dashboard for a full Mon–Sun plan with kcal & macros."},
                {"n": "03", "t": "Prep & eat", "d": "Download one PDF with meals, recipes and a generated shopping list."},
            ],
        },
        "cta": {
            "title": "Ready to train like a bruddha?",
            "subtitle": "Subscribe in two minutes. Cancel anytime.",
            "primary": "Subscribe · €14.99 / mo",
            "secondary": "I have a code",
        },
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
