import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "./api";

const fallback = {
  landing: {
    hero: {
      badge: "Weekly meal prep · made simple",
      title_line1: "Eat strong.",
      title_line2: "Train stronger.",
      subtitle_html: "APT · <em>bruddatrain</em>",
      image_url: "https://images.pexels.com/photos/5794779/pexels-photo-5794779.jpeg",
      subscribe_cta: "Subscribe · €14.99 / mo",
      code_cta: "I have a 4-digit code",
    },
    weekly_tile: { label: "THIS WEEK", title: "28 meals · macros built in", subtitle: "Real food. Real progress." },
    pricing: {
      kicker: "Two ways in", title: "Pick your path.",
      subtitle: "Subscribe and access your plan anytime — or get a weekly 4-digit code from your APT coach.",
      subscription: { label: "Monthly subscription", price: "€14.99", period: "/ month", bullets: [], cta: "Subscribe now", badge: "Recommended" },
      code: { label: "Coaching clients", title: "4-digit code", subtitle: "From your APT coach. Rotates every Monday.", bullets: [], cta: "Enter my code" },
    },
    how: { kicker: "How it works", title: "Three steps. No excuses.", steps: [] },
    cta: { title: "Ready to train like a bruddha?", subtitle: "Subscribe in two minutes. Cancel anytime.", primary: "Subscribe · €14.99 / mo", secondary: "I have a code" },
  },
  extras: [],
};

export function useSiteContent() {
  const [content, setContent] = useState(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(`${API}/site`)
      .then((r) => setContent(r.data || fallback))
      .catch(() => setContent(fallback))
      .finally(() => setLoading(false));
  }, []);
  return { content, loading };
}
