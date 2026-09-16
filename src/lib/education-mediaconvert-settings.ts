// Pure Education HLS job Settings. No AWS SDK import — unit-tested
// without credentials. The thin wrapper in education-mediaconvert.ts
// is the only file that calls MediaConvert.

export function educationHlsDestination(prefix: string): string {
  if (!prefix.endsWith("/")) {
    throw new Error("Education HLS destination must be a trailing-slash prefix");
  }
  return prefix;
}

export function buildEducationHlsJobSettings(input: {
  sourceKey: string;
  sourceBucket: string;
  outputBucket: string;
  destinationPrefix: string;
}): Record<string, unknown> {
  const destination = educationHlsDestination(input.destinationPrefix);
  return {
    Inputs: [
      {
        FileInput: `s3://${input.sourceBucket}/${input.sourceKey}`,
        AudioSelectors: {
          "Audio Selector 1": { DefaultSelection: "DEFAULT" },
        },
        VideoSelector: {},
        TimecodeSource: "ZEROBASED",
      },
    ],
    OutputGroups: [
      {
        Name: "Apple HLS",
        OutputGroupSettings: {
          Type: "HLS_GROUP_SETTINGS",
          HlsGroupSettings: {
            Destination: `s3://${input.outputBucket}/${destination}`,
            SegmentLength: 6,
            MinSegmentLength: 0,
          },
        },
        Outputs: [
          {
            ContainerSettings: { Container: "M3U8" },
            VideoDescription: {
              CodecSettings: {
                Codec: "H_264",
                H264Settings: {
                  RateControlMode: "QVBR",
                  MaxBitrate: 2500000,
                  QvbrSettings: { QvbrQualityLevel: 7 },
                  QualityTuningLevel: "SINGLE_PASS",
                  CodecProfile: "MAIN",
                  CodecLevel: "AUTO",
                },
              },
            },
            AudioDescriptions: [
              {
                CodecSettings: {
                  Codec: "AAC",
                  AacSettings: {
                    Bitrate: 128000,
                    CodingMode: "CODING_MODE_2_0",
                    SampleRate: 48000,
                  },
                },
              },
            ],
          },
        ],
      },
    ],
  };
}
