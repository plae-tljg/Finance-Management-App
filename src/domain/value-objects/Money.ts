export class Money {
  private readonly amount: number;
  private readonly currency: string = 'HKD';

  constructor(amount: number, currency: string = 'HKD') {
    this.amount = amount;
    this.currency = currency;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(money: Money): Money {
    if (this.currency !== money.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + money.amount, this.currency);
  }

  subtract(money: Money): Money {
    if (this.currency !== money.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return new Money(this.amount - money.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  divide(factor: number): Money {
    if (factor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this.amount / factor, this.currency);
  }

  equals(money: Money): boolean {
    return this.amount === money.amount && this.currency === money.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
} 