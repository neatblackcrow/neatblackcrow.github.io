import { isNonEmpty, match, type Brand, type NonEmptyArray } from './adt.ts';

export type IsoDate = Brand<string, 'IsoDate'>;
export type YearMonth = Brand<string, 'YearMonth'>;
export type EmailAddress = Brand<string, 'EmailAddress'>;
export type HttpsUrl = Brand<string, 'HttpsUrl'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type SkillTag = Brand<string, 'SkillTag'>;

export type SectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'education'
  | 'languages';

export const asIsoDate = (raw: string): IsoDate => raw as IsoDate;
export const asYearMonth = (raw: string): YearMonth => raw as YearMonth;
export const asEmailAddress = (raw: string): EmailAddress => raw as EmailAddress;
export const asHttpsUrl = (raw: string): HttpsUrl => raw as HttpsUrl;
export const asProjectId = (raw: string): ProjectId => raw as ProjectId;
export const asSkillTag = (raw: string): SkillTag => raw as SkillTag;

export type EmploymentSpan =
  | { readonly _tag: 'Ongoing'; readonly since: YearMonth; readonly display: string }
  | {
      readonly _tag: 'Completed';
      readonly from: YearMonth;
      readonly to: YearMonth;
      readonly display: string;
    };

export function toEmploymentSpan(input: {
  readonly startDate: string;
  readonly endDate?: string | undefined;
  readonly period: string;
}): EmploymentSpan {
  const since = asYearMonth(input.startDate);
  if (input.endDate) {
    return {
      _tag: 'Completed',
      from: since,
      to: asYearMonth(input.endDate),
      display: input.period,
    };
  }
  return {
    _tag: 'Ongoing',
    since,
    display: input.period,
  };
}

export function isCurrentRole(span: EmploymentSpan): boolean {
  return match(span, {
    Ongoing: () => true,
    Completed: () => false,
  });
}

export function employmentStartDate(span: EmploymentSpan): YearMonth {
  return match(span, {
    Ongoing: ({ since }) => since,
    Completed: ({ from }) => from,
  });
}

export type OrganizationTitle =
  | { readonly _tag: 'Plain'; readonly name: string }
  | { readonly _tag: 'Linked'; readonly name: string; readonly url: HttpsUrl };

export function toOrganizationTitle(
  name: string,
  organizationUrl?: string | undefined,
): OrganizationTitle {
  return organizationUrl
    ? { _tag: 'Linked', name, url: asHttpsUrl(organizationUrl) }
    : { _tag: 'Plain', name };
}

export type ReferenceDisplay =
  | { readonly _tag: 'SelfDescribing'; readonly label: string; readonly url: HttpsUrl }
  | { readonly _tag: 'WithPrintUrl'; readonly label: string; readonly url: HttpsUrl };

export function stripUrlSchemeAndTrailingSlash(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function classifyReference(label: string, url: string): ReferenceDisplay {
  const normalized = stripUrlSchemeAndTrailingSlash(url);
  const typedUrl = asHttpsUrl(url);
  return label.includes(normalized)
    ? { _tag: 'SelfDescribing', label, url: typedUrl }
    : { _tag: 'WithPrintUrl', label, url: typedUrl };
}

export type OptionalSectionKey = 'certifications' | 'publications' | 'talks' | 'open-source';

export interface OptionalSectionGroup<T> {
  readonly id: OptionalSectionKey;
  readonly title: string;
  readonly items: NonEmptyArray<T>;
}

export function collectOptionalSections<T>(
  candidates: ReadonlyArray<{
    readonly id: OptionalSectionKey;
    readonly title: string;
    readonly items: readonly T[] | undefined;
  }>,
): readonly OptionalSectionGroup<T>[] {
  const populated: OptionalSectionGroup<T>[] = [];
  for (const { id, title, items } of candidates) {
    if (items && isNonEmpty(items)) {
      populated.push({ id, title, items });
    }
  }
  return populated;
}
