(function () {
  const CSRF_HEADER = "X-CSRF-Token";
  const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  const originalFetch = window.fetch.bind(window);

  function csrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") : "";
  }

  window.fetch = function secureFetch(input, init) {
    const options = init ? { ...init } : {};
    const requestMethod = input instanceof Request ? input.method : "GET";
    const method = (options.method || requestMethod || "GET").toUpperCase();

    if (MUTATING_METHODS.has(method)) {
      const headers = new Headers(
        options.headers || (input instanceof Request ? input.headers : undefined)
      );
      const token = csrfToken();
      if (token && !headers.has(CSRF_HEADER)) {
        headers.set(CSRF_HEADER, token);
      }
      options.headers = headers;
    }

    return originalFetch(input, options);
  };

  window.VectorSecurity = { csrfToken };
})();
