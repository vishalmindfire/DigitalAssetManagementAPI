type StatusValue = 'COMPLETED' | 'FAILED' | 'PENDING' | 'PROCESSING';

export class FileStatus {
  /* Allowe Status */
  static COMPLETED = new FileStatus('COMPLETED');
  static FAILED = new FileStatus('FAILED');
  static PENDING = new FileStatus('PENDING');
  static PROCESSING = new FileStatus('PROCESSING');

  private constructor(private readonly value: StatusValue) {}

  static from(value: StatusValue): FileStatus {
    const allowed = [FileStatus.COMPLETED, FileStatus.FAILED, FileStatus.PENDING, FileStatus.PROCESSING];

    const match = allowed.find((status) => status.value === value);

    if (!match) {
      throw new Error(`Invalid FileStatus: ${value}`);
    }
    return match;
  }

  canTransitionTo(next: FileStatus): boolean {
    const transition: Record<StatusValue, StatusValue[]> = {
      COMPLETED: [],
      FAILED: [],
      PENDING: ['PROCESSING'],
      PROCESSING: ['COMPLETED', 'FAILED'],
    };

    return transition[this.value].includes(next.value);
  }

  equals(other: FileStatus): boolean {
    return this.value === other.value;
  }

  getValue(): StatusValue {
    return this.value;
  }
}
