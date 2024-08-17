import { Value } from "@sinclair/typebox/value";
import { Static, t } from "elysia";
import { FetchError } from "./error";

const versionManifestSchema = t.Object({
  latest: t.Object({
    release: t.String(),
    snapshot: t.String(),
  }),
  versions: t.Array(
    t.Object({
      id: t.String(),
      type: t.String(),
      url: t.String(),
      time: t.String(),
      releaseTime: t.String(),
    })
  ),
});

const versionSchema = t.Object({
  downloads: t.Object({
    client: t.Object({
      sha1: t.String(),
      size: t.Number(),
      url: t.String(),
    }),
    server: t.Object({
      sha1: t.String(),
      size: t.Number(),
      url: t.String(),
    }),
  }),
});

export type VersionManifest = Static<typeof versionManifestSchema>;
export type Version = Static<typeof versionSchema>;

export async function getVersionManifest(): Promise<
  [Error, null] | [null, VersionManifest]
> {
  // add cache
  const result = await fetch(
    "https://launchermeta.mojang.com/mc/game/version_manifest.json"
  );
  if (!result.ok) {
    return [
      new FetchError(result.status, result.statusText, await result.text()),
      null,
    ];
  }

  const rawJson = await result.json();
  const valid = Value.Check(versionManifestSchema, rawJson);

  if (!valid) {
    return [new Error("Invalid JSON"), null];
  }

  return [null, rawJson as VersionManifest];
}

export async function getVersionDetails(
  version: string
): Promise<[Error, null] | [null, Version]> {
  const [error, manifest] = await getVersionManifest();
  if (error) {
    return [error, null];
  }

  const versionInfo = manifest.versions.find((v) => v.id === version);
  if (!versionInfo) {
    return [new Error("Version not found"), null];
  }

  const result = await fetch(versionInfo.url);
  if (!result.ok) {
    return [
      new FetchError(result.status, result.statusText, await result.text()),
      null,
    ];
  }

  const rawJson = await result.json();
  const valid = Value.Check(versionSchema, rawJson);

  if (!valid) {
    return [new Error("Invalid JSON"), null];
  }

  return [null, rawJson as Version];
}
