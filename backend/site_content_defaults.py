"""Default editable public-site copy. Admin overrides remain supported."""
SITE_CONTENT_DEFAULTS = {
    'announcement': 'Weekly meal plans, made doable. Your next week of food is already thought through.',
    'nav': {'links': [{'label': 'Home', 'href': '/'}, {'label': 'Plans', 'href': '/#plans'}, {'label': 'Meals', 'href': '/#meals'}, {'label': 'About', 'href': '/#about'}, {'label': 'Client code', 'href': '/auth'}]},
    'landing': {
        'hero': {'kicker': 'A calmer kind of meal prep', 'title_prefix': 'No more stress.', 'title_highlight': 'Just eat.', 'subtitle': 'Make your week feel easier with a practical macro meal plan, made for real life and ready to take to the kitchen.', 'bg_image_url': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=85', 'primary_cta': 'Get your weekly plan', 'secondary_cta': 'Enter client code'},
        # Preserve the admin content schema, but never display unverified outcome statistics.
        'stats': {'kicker': 'What is included', 'title': 'Your week, made easier', 'items': []},
        'features': {'kicker': 'A plan that works harder', 'title': 'Good food, with the thinking done.', 'items': [
            {'kicker': 'Meal ideas', 'title': '28 weekly meals', 'description': 'Plenty of choices to make the menu feel flexible.', 'image_url': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=85', 'shape': 'rounded'},
            {'kicker': 'The details', 'title': 'Macros alongside every meal', 'description': 'See the numbers so you can make informed choices.', 'image_url': '', 'shape': 'rounded'},
            {'kicker': 'Take it with you', 'title': 'A downloadable PDF and shopping list', 'description': 'Keep the plan close in the kitchen or at the shop.', 'image_url': '', 'shape': 'rounded'}]},
        'how': {'kicker': 'Four easy steps', 'title': 'Less planning. More getting on with it.', 'steps': [
            {'n': '01', 't': 'Choose your plan', 'd': 'Subscribe for €14.99 a month and get the latest weekly plan.'},
            {'n': '02', 't': 'Find your meals', 'd': 'Explore meal ideas with macros to suit your routine.'},
            {'n': '03', 't': 'Download the PDF', 'd': 'Take your weekly meals and shopping list into the kitchen.'},
            {'n': '04', 't': 'Make it your week', 'd': 'Pick what works for you, prep what you can, and enjoy more headspace.'}]},
        'cta': {'title': 'Make one less decision this week.', 'subtitle': '28 meals, macros and a shopping list, all in one downloadable weekly plan. €14.99 per month.', 'primary': 'Subscribe for €14.99 / month', 'secondary': 'Enter client code'}},
    'footer': {'brand': "Abraham's Personal Training", 'tagline': 'Weekly meal plans made practical.', 'support_label': 'Support', 'support_email': 'support@apttrains.com', 'lines': ["Abraham's Personal Training"], 'copyright': "Abraham's Personal Training", 'strapline': ''},
    'extras': [],
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
