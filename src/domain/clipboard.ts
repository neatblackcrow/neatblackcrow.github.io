export type CopyMethod = 'clipboard-api' | 'legacy-fallback';

export type CopyFailureReason = 'empty' | 'unsupported';

export type CopyOutcome =
  | { readonly _tag: 'Copied'; readonly method: CopyMethod; readonly value: string }
  | {
      readonly _tag: 'Failed';
      readonly value: string;
      readonly reason: CopyFailureReason;
    };
