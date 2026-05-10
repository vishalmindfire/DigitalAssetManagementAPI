export type UserRole = 'admin' | 'guest' | 'user';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly firstName: string,
    public readonly lastName: string | null,
    public readonly role: UserRole,
    public readonly createdAt: Date
  ) {}

  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string | null {
    return this.lastName;
  }

  getRole(): UserRole {
    return this.role;
  }

  toProfile() {
    return {
      email: this.email,
      firstName: this.firstName,
      id: this.id,
      lastName: this.lastName,
      role: this.role,
    };
  }
}
