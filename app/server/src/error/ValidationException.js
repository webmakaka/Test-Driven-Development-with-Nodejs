export class ValidationException {
  constructor(errors) {
    this.status = 400;
    this.errors = errors;
    this.message = 'validation_failure';
  }
}
