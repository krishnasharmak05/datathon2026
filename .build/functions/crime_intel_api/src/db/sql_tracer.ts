// Standalone SQL Tracer for auditability and explainability
export class SqlTracer {
  private static queries: string[] = [];
  private static rowsCount: number = 0;

  static trace(sql: string, params?: any[]) {
    const formatted = params && params.length ? `${sql} [Params: ${params.join(', ')}]` : sql;
    this.queries.push(formatted);
  }

  static addRows(count: number) {
    this.rowsCount += count;
  }

  static getQueries(): string[] {
    return [...this.queries];
  }

  static getRowsProcessed(): number {
    return this.rowsCount;
  }

  static clear() {
    this.queries = [];
    this.rowsCount = 0;
  }
}
