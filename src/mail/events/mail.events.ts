export class UserRegistrationEvent {
  constructor(
    public readonly email: string,
    public readonly username: string,
  ) {}
}

export class VendorRegistrationEvent {
  constructor(
    public readonly email: string,
    public readonly businessName: string,
  ) {}
}

export class ForgetPasswordEvent {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly resetPasswordToken: string,
  ) {}
}

export class PasswordResetSuccessful {
  constructor(
    public readonly email,
    public readonly username: string,
  ) {}
}
