import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';

interface fileDetail {
  bucket: string;
  createdDate: Date;
  ext: FileExtension;
  id: FileId;
  mimeType: string;
  objectKey: string;
  progress: number;
  status: FileStatus;
  topId: FileId;
  size: number;
  updatedDate: Date | null;
  userId: string;
  url: string | null;
}

export interface FilesResponse {
  files: File[] | null;
  nextCursor: {
    fileId: string | null;
    createDate: Date | null;
  } | null;
}

export class File implements fileDetail {
  constructor(
    public readonly id: fileDetail['id'],
    public readonly topId: fileDetail['topId'],
    public readonly ext: fileDetail['ext'],
    public readonly mimeType: fileDetail['mimeType'],
    public readonly bucket: fileDetail['bucket'],
    public readonly objectKey: fileDetail['objectKey'],
    public readonly size: fileDetail['size'],
    public readonly userId: fileDetail['userId'],
    public progress: fileDetail['progress'],
    public status: fileDetail['status'],
    public createdDate: fileDetail['createdDate'],
    public updatedDate: fileDetail['updatedDate'],
    public url: fileDetail['url'] = null
  ) {}

  public generateFileTags(): string[] {
    const fileName: string = this.objectKey.split('/').pop() ?? '';
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    const words: string[] = baseName.split(/[\s | _]+/);
    return words;
  }

  public getBucket() {
    return this.bucket;
  }

  public getCreatedDate() {
    return this.createdDate;
  }

  public getExtension() {
    return this.ext.getValue();
  }

  public getId(): string {
    return this.id.value;
  }

  public getMimeType() {
    return this.mimeType;
  }

  public getObjectKey(): string {
    return this.objectKey;
  }

  public getProgress() {
    return this.progress;
  }

  public getStatus() {
    return this.status.getValue();
  }

  public getTopId(): string {
    return this.topId.value;
  }

  public getUpdatedDate() {
    return this.updatedDate;
  }

  public getSize() {
    return this.size;
  }

  public getUserId() {
    return this.userId;
  }

  public getUpdateDate() {
    return this.updatedDate;
  }

  markCompleted() {
    this.transition(FileStatus.COMPLETED);
    this.setProgress(100);
  }

  markFailed() {
    this.transition(FileStatus.FAILED);
  }

  markProcessing() {
    this.transition(FileStatus.PROCESSING);
  }

  setProgress(progress: number) {
    this.progress = progress;
  }

  setUrl(url: string) {
    this.url = url;
  }

  private transition(next: FileStatus) {
    if (!this.status.canTransitionTo(next)) {
      throw new Error(`Invalid transition: ${this.status.getValue()} → ${next.getValue()}`);
    }

    this.status = next;
  }

  fileDetail() {
    return {
      bucket: this.getBucket(),
      createdDate: this.getCreatedDate(),
      ext: this.getExtension(),
      id: this.getId(),
      mimeType: this.getMimeType(),
      objectKey: this.objectKey,
      progress: this.getProgress(),
      status: this.status,
      topId: this.getTopId(),
      size: this.getSize(),
      updatedDate: this.getUpdatedDate(),
      userId: this.getUserId(),
    };
  }
}
