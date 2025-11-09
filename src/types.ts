export interface Issue {
  category: string;
  description: string;
  severity: string;
}

export interface ScanResult {
  file: string;
  issues: Issue[];
}
