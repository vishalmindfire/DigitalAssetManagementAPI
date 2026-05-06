const IMAGE_EXTENSIONS = ['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'];
type extensions = imageExtensions | videoExtensions;
type imageExtensions = 'gif' | 'jpeg' | 'jpg' | 'png' | 'svg' | 'webp';
type videoExtensions = 'avi' | 'flv' | 'mkv' | 'mov' | 'mp4' | 'mpeg' | 'mpg' | 'webm';

export class FileExtension {
  /* Allowed extensions */

  static avi = new FileExtension('avi');
  static flv = new FileExtension('flv');
  static gif = new FileExtension('gif');
  static jpeg = new FileExtension('jpeg');
  static jpg = new FileExtension('jpg');
  static mkv = new FileExtension('mkv');
  static mov = new FileExtension('mov');
  static mp4 = new FileExtension('mp4');
  static mpeg = new FileExtension('mpeg');
  static mpg = new FileExtension('mpg');
  static png = new FileExtension('png');
  static svg = new FileExtension('svg');
  static webm = new FileExtension('webm');
  static webp = new FileExtension('webp');

  constructor(private readonly value: extensions) {}

  static from(value: extensions): FileExtension {
    const allowed = [
      FileExtension.avi,
      FileExtension.flv,
      FileExtension.gif,
      FileExtension.jpeg,
      FileExtension.jpg,
      FileExtension.mkv,
      FileExtension.mov,
      FileExtension.mp4,
      FileExtension.mpeg,
      FileExtension.mpg,
      FileExtension.png,
      FileExtension.svg,
      FileExtension.webm,
      FileExtension.webp,
    ];

    const match = allowed.find((ext) => ext.value === value);

    if (!match) {
      throw new Error(`Invalid File Type: ${value}`);
    }
    return match;
  }

  getFileType(): 'image' | 'video' {
    return IMAGE_EXTENSIONS.includes(this.value) ? 'image' : 'video';
  }

  getValue(): extensions {
    return this.value;
  }
}
