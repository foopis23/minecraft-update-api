import { Elysia, redirect, t } from "elysia";
import { getVersionDetails, getVersionManifest } from "./version";
import { rateLimit } from "elysia-rate-limit";
import swagger from "@elysiajs/swagger";
import { errorResponse, errorResponseSchema } from "./error";

const REQUEST_PER_MINUTE = 20;

const app = new Elysia()
  .use(rateLimit({ max: REQUEST_PER_MINUTE, duration: 60000 }))
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Minecraft Version API",
          version: "1.0.0",
          description: `This is a simple API that allows you to keep your server up to date with the latest server jar. There is a rate limit of ${REQUEST_PER_MINUTE} requests per minute.`,
        },
        externalDocs: {
          description: "GitHub",
          url: "https://github.com/foopis23/minecraft-update-api",
        },
        ...(process.env.SERVER_URL
          ? {
              servers: [
                {
                  url: process.env.SERVER_URL,
                },
              ],
            }
          : {}),
      },
    })
  )
  .group("/vanilla", (app) =>
    app
      .get("", async ({ set }) => {
        const [error, manifest] = await getVersionManifest();
        if (error) {
          set.status = 500;
          return errorResponse(error, 500);
        }

        return manifest.versions.map((v) => {
          return {
            id: v.id,
            type: v.type,
            time: v.time,
            releaseTime: v.releaseTime,
          }
        });
      }, {
        response: {
          200: t.Array(
            t.Object({
              id: t.String(),
              type: t.String(),
              time: t.String(),
              releaseTime: t.String(),
            })
          ),
          500: errorResponseSchema,
        }
      })
      .get(
        "/latest/:type",
        async ({ params, set }) => {
          const [error, manifest] = await getVersionManifest();
          if (error) {
            set.status = 500;
            return errorResponse(error, 500);
          }

          const version = manifest.versions.find(
            (v) => v.id === manifest.latest[params.type]
          );

          if (!version) {
            set.status = 404;
            return errorResponse(new Error("Not found"), 404);
          }

          const [error2, versionDetails] = await getVersionDetails(version.id);

          if (error2) {
            set.status = 500;
            return errorResponse(error2, 500);
          }

          return redirect(versionDetails.downloads.server.url, 302);
        },
        {
          params: t.Object({
            type: t.Union([t.Literal("release"), t.Literal("snapshot")]),
          }),
          detail: {
            description:
              "Download the latest Minecraft server jar for release or snapshot",
          },
          response: {
            302: t.String(),
            404: errorResponseSchema,
            500: errorResponseSchema,
          }
        }
      )
      .get(
        "/latest/:type/details",
        async ({ set, params }) => {
          const [error, manifest] = await getVersionManifest();
          if (error) {
            set.status = 500;
            return errorResponse(error, 500);
          }

          const version = manifest.versions.find(
            (v) => v.id === manifest.latest[params.type]
          );

          if (!version) {
            set.status = 404;
            return errorResponse(new Error("Not found"), 404);
          }

          const [error2, versionDetails] = await getVersionDetails(version.id);

          if (error2) {
            set.status = 500;
            return errorResponse(error2, 500);
          }

          return {
            id: versionDetails.id,
            type: versionDetails.type,
            time: versionDetails.time,
            releaseTime: versionDetails.releaseTime,
            downloads: versionDetails.downloads,
          };
        },
        {
          params: t.Object({
            type: t.Union([t.Literal("release"), t.Literal("snapshot")]),
          }),
          detail: {
            description: "Get the details of the latest version of Minecraft",
          },
          response: {
            200: t.Object({
              id: t.String(),
              type: t.String(),
              time: t.String(),
              releaseTime: t.String(),
              downloads: t.Object({
                server: t.Object({
                  url: t.String(),
                  size: t.Number(),
                  sha1: t.String(),
                }),
              }),
            }),
            404: errorResponseSchema,
            500: errorResponseSchema,
          }
        }
      )
      .get(
        "/:version",
        async ({ params, set }) => {
          const [error, versionDetails] = await getVersionDetails(
            params.version
          );
          if (error) {
            set.status = 500;
            return errorResponse(error, 500);
          }

          return redirect(versionDetails.downloads.server.url, 302);
        },
        {
          params: t.Object({
            version: t.String(),
          }),
          detail: {
            description:
              "Download a specific version of the Minecraft server jar",
          },
          response: {
            302: t.String(),
            500: errorResponseSchema,
          }
        }
      )
      .get(
        "/:version/details",
        async ({ params }) => {
          const [error, versionDetails] = await getVersionDetails(
            params.version
          );
          if (error) {
            return errorResponse(error, 500);
          }

          return {
            id: versionDetails.id,
            type: versionDetails.type,
            time: versionDetails.time,
            releaseTime: versionDetails.releaseTime,
            downloads: versionDetails.downloads,
          };
        },
        {
          params: t.Object({
            version: t.String(),
          }),
          detail: {
            description: "Get the details of a specific version of Minecraft",
          },
          response: {
            200: t.Object({
              id: t.String(),
              type: t.String(),
              time: t.String(),
              releaseTime: t.String(),
              downloads: t.Object({
                server: t.Object({
                  url: t.String(),
                  size: t.Number(),
                  sha1: t.String(),
                }),
              }),
            }),
            500: errorResponseSchema,
          }
        }
      )
  )
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Minecraft Version API is running at ${app.server?.hostname}:${app.server?.port}`
);
