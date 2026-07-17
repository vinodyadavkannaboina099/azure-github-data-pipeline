import { app, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function health(_request: unknown, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Portfolio API health check");

  return {
    status: 200,
    jsonBody: {
      status: "ok",
      service: "vinod-portfolio-api",
      timestamp: new Date().toISOString()
    }
  };
}

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: health
});
