export class InvalidTokenException {
  constructor() {
    this.status = 400;
    this.message = 'account_activation_failure';
  }
}
