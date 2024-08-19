import { Elysia, redirect, t } from "elysia";
import { getVersionDetails, getVersionManifest } from "./version";
import { rateLimit } from "elysia-rate-limit";
import swagger from "@elysiajs/swagger";

const app = new Elysia()
  .use(rateLimit({ max: 20, duration: 60000 }))
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Minecraft Version API",
          version: "1.0.0",
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
          return error;
        }

        return manifest.versions.map((v) => {
          return {
            id: v.id,
            type: v.type,
            time: v.time,
            releaseTime: v.releaseTime,
          }
        });
      })
      .get(
        "/latest/:type",
        async ({ params, set }) => {
          const [error, manifest] = await getVersionManifest();
          if (error) {
            set.status = 500;
            return error;
          }

          const version = manifest.versions.find(
            (v) => v.id === manifest.latest[params.type]
          );

          if (!version) {
            set.status = 404;
            return "Not found";
          }

          const [error2, versionDetails] = await getVersionDetails(version.id);

          if (error2) {
            set.status = 500;
            return error2;
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
        }
      )
      .get(
        "/latest/:type/details",
        async ({ set, params }) => {
          const [error, manifest] = await getVersionManifest();
          if (error) {
            set.status = 500;
            return error;
          }

          const version = manifest.versions.find(
            (v) => v.id === manifest.latest[params.type]
          );

          if (!version) {
            set.status = 404;
            return "Not found";
          }

          const [error2, versionDetails] = await getVersionDetails(version.id);

          if (error2) {
            set.status = 500;
            return error2;
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
            return error;
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
        }
      )
      .get(
        "/:version/details",
        async ({ params }) => {
          const [error, versionDetails] = await getVersionDetails(
            params.version
          );
          if (error) {
            return error;
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
        }
      )
  )
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Minecraft Version API is running at ${app.server?.hostname}:${app.server?.port}`
);
