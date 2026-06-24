export class UserRegistrationEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly ipAddress: string,
  ) {}
}

export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly ipAddress: string,
  ) {}
}

export class CustomerForgetPasswordEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly resetPasswordToken: string,
    public readonly ipAddress: string,
  ) {}
}

export class CustomerPasswordResetSuccessfulEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly ipAddress: string,
  ) {}
}

export class VendorRegistrationEvent {
  constructor(
    public readonly email: string,
    public readonly businessName: string,
  ) {}
}
