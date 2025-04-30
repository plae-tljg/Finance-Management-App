import { AccountType } from '../enums/enum';
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  closingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AccountEntity implements Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  closingBalance: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Account) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.openingBalance = data.openingBalance;
    this.closingBalance = data.closingBalance;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static create(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): AccountEntity {
    return new AccountEntity({
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  update(data: Partial<Omit<Account, 'id' | 'createdAt' | 'updatedAt'>>): void {
    Object.assign(this, {
      ...data,
      updatedAt: new Date(),
    });
  }

  updateBalance(amount: number): void {
    this.closingBalance += amount;
    this.updatedAt = new Date();
  }

  resetOpeningBalance(): void {
    this.openingBalance = this.closingBalance;
    this.updatedAt = new Date();
  }

}