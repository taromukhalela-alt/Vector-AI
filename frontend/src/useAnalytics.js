import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyRouteMeta, getRouteMeta } from "./seo";

const GA_ID = "G-SKRLQ4J4RD";

export default function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    applyRouteMeta(location.pathname);

    if (window.gtag) {
      const pagePath = `${location.pathname}${location.search}`;
      const pageMeta = getRouteMeta(location.pathname);

      window.gtag("config", GA_ID, {
        page_path: pagePath,
        page_title: pageMeta.title,
      });
    }
  }, [location.pathname, location.search]);
}

export const trackEvent = (eventName, parameters = {}) => {
  if (!window.gtag) return;

  window.gtag("event", eventName, {
    app_name: "Vector AI",
    ...parameters,
  });
};
