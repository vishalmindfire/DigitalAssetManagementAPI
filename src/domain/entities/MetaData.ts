interface metaData {
  ext: string;
  height: number;
  size?: number;
  width: number;
}

export class MetaData implements metaData {
  constructor(
    public readonly ext: metaData['ext'],
    public readonly height: metaData['height'],
    public readonly width: metaData['width'],
    public readonly size: metaData['size']
  ) {}

  getExtension(): string {
    return this.ext;
  }

  getHeight() {
    return this.height;
  }

  getSize() {
    return this.size;
  }

  getWidth() {
    return this.width;
  }
}
