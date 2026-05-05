interface rendition {
  audioBitrate: string;
  crf: number;
  height: number;
  label: string;
}

export class VideoRendition implements rendition {
  constructor(
    public readonly audioBitrate: rendition['audioBitrate'],
    public readonly crf: rendition['crf'],
    public readonly height: rendition['height'],
    public readonly label: rendition['label']
  ) {}

  getAudioBitrate(): string {
    return this.audioBitrate;
  }

  getCRF() {
    return this.crf;
  }

  getHeight() {
    return this.height;
  }

  getLabel() {
    return this.label;
  }
}
