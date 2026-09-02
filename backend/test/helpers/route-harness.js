function createExpressMock() {
  const routes = [];
  const router = {};

  for (const method of ["get", "post", "patch", "delete"]) {
    router[method] = (routePath, ...handlers) => {
      routes.push({ method: method.toUpperCase(), path: routePath, handlers });
      return router;
    };
  }

  return {
    express: { Router: () => router },
    findRoute(method, routePath) {
      const route = routes.find(
        (candidate) =>
          candidate.method === method.toUpperCase() && candidate.path === routePath
      );

      if (!route) {
        throw new Error(`Route not registered: ${method} ${routePath}`);
      }

      return route;
    },
  };
}

function createResponse() {
  return {
    body: undefined,
    headers: {},
    statusCode: 200,
    json(body) {
      this.body = body;
      return this;
    },
    set(name, value) {
      this.headers[name.toLowerCase()] = String(value);
      return this;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
  };
}

module.exports = { createExpressMock, createResponse };
