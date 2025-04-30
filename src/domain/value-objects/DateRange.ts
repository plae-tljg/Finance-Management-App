export class DateRange {
  private readonly startDate: Date;
  private readonly endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }
    this.startDate = startDate;
    this.endDate = endDate;
  }

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date {
    return this.endDate;
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  overlaps(dateRange: DateRange): boolean {
    return (
      this.contains(dateRange.startDate) ||
      this.contains(dateRange.endDate) ||
      dateRange.contains(this.startDate) ||
      dateRange.contains(this.endDate)
    );
  }

  getDurationInDays(): number {
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDurationInMonths(): number {
    const startYear = this.startDate.getFullYear();
    const startMonth = this.startDate.getMonth();
    const endYear = this.endDate.getFullYear();
    const endMonth = this.endDate.getMonth();
    return (endYear - startYear) * 12 + (endMonth - startMonth);
  }

  getDurationInYears(): number {
    const startYear = this.startDate.getFullYear();
    const endYear = this.endDate.getFullYear();
    return endYear - startYear;
  }

  toString(): string {
    return `${this.startDate.toISOString()} - ${this.endDate.toISOString()}`;
  }
} 