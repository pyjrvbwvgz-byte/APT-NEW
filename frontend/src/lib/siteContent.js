import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "./api";

const fallback = {
  announcement: "NO MORE EXCUSES · GET IN SHAPE",
  nav: {
    links: [
      { label: "Home", href: "/" },
      { label: "Plans", href: "/#plans" },
      { label: "Meals", href: "/#meals" },
      { label: "About", href: "/#about" },
      { label: "Portal", href: "/auth" },
    ],
  },
  landing: {
    hero: {
      kicker: "FUEL YOUR AMBITION",
      title_prefix: "Eat Strong. Train",
      title_highlight: "Stronger",
      subtitle: "",
      bg_image_url: "",
      primary_cta: "Subscribe for €14.99/mo",
      secondary_cta: "Enter Client Code",
    },
    stats: { kicker: "BY THE NUMBERS", title: "Precision Fuel for Performance", items: [] },
    features: { kicker: "ENGINEERED NUTRITION", title: "The APT System", items: [] },
    how: { kicker: "EXECUTION FLOW", title: "Your Path to Caloric Precision", steps: [] },
    cta: { title: "Unlock Your Performance Fuel", subtitle: "", primary: "Subscribe Now", secondary: "Enter Client Code" },
  },
  footer: {
    brand: ".VPT WETRAIN",
    tagline: "",
    support_label: "Direct Support",
    support_email: "",
    lines: [],
    copyright: "",
    strapline: "",
  },
  extras: [],
};

let cached = null;

export function useSiteContent() {
  const [content, setContent] = useState(cached || fallback);
  const [loading, setLoading] = useState(!cached);
  useEffect(() => {
    if (cached) return;
    axios
      .get(`${API}/site`)
      .then((r) => {
        cached = r.data || fallback;
        setContent(cached);
      })
      .catch(() => setContent(fallback))
      .finally(() => setLoading(false));
  }, []);
  return { content, loading };
}
