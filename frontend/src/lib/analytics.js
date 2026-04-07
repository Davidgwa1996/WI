let posthogInstance = null;

export const initAnalytics = async () => {
  if (posthogInstance || !import.meta.env.VITE_POSTHOG_KEY) return;

  try {
    const posthogModule = await import("posthog-js");
    const posthog = posthogModule.default;

    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });

    posthogInstance = posthog;
  } catch (error) {
    console.error("Analytics init failed:", error);
  }
};

export const trackEvent = (eventName, properties = {}) => {
  try {
    if (posthogInstance) {
      posthogInstance.capture(eventName, properties);
    }
  } catch (error) {
    console.error("Analytics track failed:", error);
  }
};

export const identifyUser = (userId, properties = {}) => {
  try {
    if (posthogInstance) {
      posthogInstance.identify(String(userId), properties);
    }
  } catch (error) {
    console.error("Analytics identify failed:", error);
  }
};