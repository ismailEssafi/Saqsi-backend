import bcrypt from 'bcrypt';

export class Crypto {
  public hash(value) {
    return bcrypt.hash(value, 10);
  }

  public compare(simpleValue, hashedValue) {
    return bcrypt.compare(simpleValue, hashedValue);
  }
}
