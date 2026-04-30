import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';

interface fileDetail {
  ext: FileExtension;
  id: FileId;
  name: string;
  path: string;
  status: FileStatus;
  uploadDate: Date | null;
}

export class File implements fileDetail {
  constructor(
    public readonly id: fileDetail['id'],
    public readonly name: fileDetail['name'],
    public readonly ext: fileDetail['ext'],
    public readonly path: fileDetail['path'],
    public status: fileDetail['status'],
    public uploadDate: fileDetail['uploadDate']
  ) {}

  getExtension(): string {
    return this.ext.getValue();
  }

  getName() {
    return this.name;
  }

  getStatus() {
    return this.status.getValue();
  }

  markCompleted() {
    this.transition(FileStatus.COMPLETED);
  }

  markFailed() {
    this.transition(FileStatus.FAILED);
  }

  markProcessing() {
    this.transition(FileStatus.PROCESSING);
  }

  private transition(next: FileStatus) {
    if (!this.status.canTransitionTo(next)) {
      throw new Error(`Invalid transition: ${this.status.getValue()} → ${next.getValue()}`);
    }

    this.status = next;
  }
}
