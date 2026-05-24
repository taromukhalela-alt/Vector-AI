import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = "G-SKRLQ4J4RD";

export default function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", GA_ID, {
        page_path: location.pathname,
      });
    }
  }, [location]);
}