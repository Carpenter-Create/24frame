import { describe, expect, it } from "vitest";

import { educationHlsManifestKey, educationHlsPrefix, educationLessonSourceKey } from "./education";
import {
  EDUCATION_HLS_NAME_MODIFIER,
  buildEducationHlsJobSettings,
} from "./education-mediaconvert-settings";

const COURSE = "11111111-1111-4111-8111-111111111111";
const LESSON = "22222222-2222-4222-8222-222222222222";

describe("education HLS job settings", () => {
  it("writes HLS into the Education output prefix from the Education source key", () => {
    const sourceKey = educationLessonSourceKey(COURSE, LESSON, "video/mp4");
    const prefix = educationHlsPrefix(COURSE, LESSON);
    const settings = buildEducationHlsJobSettings({
      sourceKey,
      sourceBucket: "24frame-education-source-dev",
      outputBucket: "24frame-education-output-dev",
      destinationPrefix: prefix,
    }) as {
      Inputs: { FileInput: string }[];
      OutputGroups: {
        OutputGroupSettings: { Type: string; HlsGroupSettings: { Destination: string } };
        Outputs: { NameModifier?: string }[];
      }[];
    };

    expect(settings.Inputs[0]?.FileInput).toBe(`s3://24frame-education-source-dev/${sourceKey}`);
    expect(settings.OutputGroups[0]?.OutputGroupSettings.Type).toBe("HLS_GROUP_SETTINGS");
    expect(settings.OutputGroups[0]?.OutputGroupSettings.HlsGroupSettings.Destination).toBe(
      `s3://24frame-education-output-dev/${prefix}`,
    );
    expect(educationHlsManifestKey(COURSE, LESSON)).toBe(`${prefix}source.m3u8`);
    expect(JSON.stringify(settings)).not.toContain("gc-content-assets");
    expect(JSON.stringify(settings)).not.toContain("24frame-media");
    expect(JSON.stringify(settings)).not.toContain("24frame-finance");
  });

  it("sets NameModifier on every HLS output so MediaConvert will accept the job", () => {
    const settings = buildEducationHlsJobSettings({
      sourceKey: educationLessonSourceKey(COURSE, LESSON, "video/mp4"),
      sourceBucket: "24frame-education-source-dev",
      outputBucket: "24frame-education-output-dev",
      destinationPrefix: educationHlsPrefix(COURSE, LESSON),
    }) as {
      OutputGroups: { Outputs: { NameModifier?: string }[] }[];
    };

    const outputs = settings.OutputGroups.flatMap((group) => group.Outputs);
    expect(outputs.length).toBeGreaterThan(0);
    expect(EDUCATION_HLS_NAME_MODIFIER).toBe("_hls");
    for (const output of outputs) {
      expect(output.NameModifier).toBe(EDUCATION_HLS_NAME_MODIFIER);
    }
  });
});
