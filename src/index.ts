import { Elysia, redirect, t } from "elysia";
import { getVersionDetails, getVersionManifest } from "./version";
import { rateLimit } from "elysia-rate-limit";

// /<version>
// /latest/<type>
const app = new Elysia()
  .use(rateLimit({ max: 10, duration: 60000 }))
  .get("/", () => "Hello Elysia")
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
    }
  )
  .get(
    "/:version",
    async ({ params, set }) => {
      const [error, versionDetails] = await getVersionDetails(params.version);
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
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
