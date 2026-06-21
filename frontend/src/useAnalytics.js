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
      const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.hostname.endsWith('.local') ||
                            window.location.protocol === 'file:';

      window.gtag("config", GA_ID, {
        page_path: pagePath,
        page_title: pageMeta.title,
        cookie_flags: 'SameSite=None;Secure',
        cookie_domain: isLocalhost ? 'none' : 'auto'
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
