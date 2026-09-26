export interface CancellationRule {
  days: string;
  refund: string;
  note: string;
}

export interface CancellationPolicyData {
  title: string;
  description: string;
  rules: CancellationRule[];
}
