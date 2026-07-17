import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext
} from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

type GitHubRepository = {
  name?: string;
  html_url?: string;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  updated_at?: string;
  fork?: boolean;
  archived?: boolean;
};

function createBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }

  const accountUrl = process.env.AZURE_STORAGE_ACCOUNT_URL;
  if (!accountUrl) {
    throw new Error("Set AZURE_STORAGE_ACCOUNT_URL or AZURE_STORAGE_CONNECTION_STRING.");
  }

  return new BlobServiceClient(accountUrl, new DefaultAzureCredential());
}

export async function projects(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const containerName = process.env.PORTFOLIO_CONTAINER ?? "portfolio";
    const blobName = process.env.PROJECTS_BLOB ?? "raw/github/repos.json";
    const blob = createBlobServiceClient()
      .getContainerClient(containerName)
      .getBlockBlobClient(blobName);

    const content = await blob.downloadToBuffer();
    const repositories = JSON.parse(content.toString("utf8")) as GitHubRepository[];

    const curatedProjects = repositories
      .filter((repository) => !repository.fork && !repository.archived && repository.name)
      .sort((a, b) => Date.parse(b.updated_at ?? "") - Date.parse(a.updated_at ?? ""))
      .slice(0, 6)
      .map((repository) => ({
        name: repository.name,
        url: repository.html_url,
        description: repository.description ?? "Data engineering project",
        language: repository.language ?? "Data Engineering",
        stars: repository.stargazers_count ?? 0,
        updatedAt: repository.updated_at
      }));

    return {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=900"
      },
      jsonBody: {
        projects: curatedProjects,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    context.error("Unable to load portfolio projects", error);

    return {
      status: 503,
      jsonBody: {
        projects: [],
        error: "Project data is temporarily unavailable."
      }
    };
  }
}

app.http("projects", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "projects",
  handler: projects
});
