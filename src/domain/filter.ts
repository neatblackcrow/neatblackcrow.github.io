import { fromNullable, match, none, some, type Option } from './adt.ts';
import { asSkillTag, type ProjectId, type SkillTag } from './cv.ts';

export type SkillChipBinding =
  | { readonly _tag: 'Static'; readonly label: string }
  | { readonly _tag: 'Filterable'; readonly label: string; readonly targetTag: SkillTag };

/**
 * Boundary-aware matcher ensuring prefixes like `Java` never falsely match `JavaScript`.
 */
export function matchesSkillToken(skillLabel: string, candidateTag: string): boolean {
  const escaped = candidateTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?:^|[\\s/(,])${escaped}(?:$|[\\s/),])`, 'i');
  return pattern.test(skillLabel);
}

/**
 * Resolves a skill badge to either static text or a filterable project tag.
 * Candidates are checked longest-first so compound tags (e.g., `Swing GUI`) take precedence
 * over nested tokens (e.g., `Java`) in `Swing GUI (Java)`.
 */
export function resolveSkillChip(
  skillLabel: string,
  candidateTags: readonly SkillTag[],
): SkillChipBinding {
  const ordered = [...candidateTags].sort(
    (a, b) => b.length - a.length || a.localeCompare(b),
  );
  const matched = ordered.find((tag) => matchesSkillToken(skillLabel, tag));
  return matched !== undefined
    ? { _tag: 'Filterable', label: skillLabel, targetTag: matched }
    : { _tag: 'Static', label: skillLabel };
}

export interface FilterableProject {
  readonly id: ProjectId;
  readonly name: string;
  readonly tags: readonly SkillTag[];
  readonly searchText: string;
}

export type TagFilter =
  | { readonly _tag: 'AllTags' }
  | { readonly _tag: 'SelectedTag'; readonly tag: SkillTag };

export const allTags: TagFilter = { _tag: 'AllTags' };

export function selectedTag(tag: SkillTag): TagFilter {
  return { _tag: 'SelectedTag', tag };
}

export interface FilterCriteria {
  readonly tag: TagFilter;
  readonly query: string;
}

export const INITIAL_FILTER_CRITERIA: FilterCriteria = {
  tag: allTags,
  query: '',
};

export type FilterAction =
  | { readonly _tag: 'SelectAllTags' }
  | { readonly _tag: 'ToggleTag'; readonly tag: SkillTag }
  | { readonly _tag: 'SetQuery'; readonly query: string }
  | { readonly _tag: 'Reset' }
  | {
      readonly _tag: 'HydrateFromUrl';
      readonly params: URLSearchParams;
      readonly validTags: readonly SkillTag[];
    };

export type FilterOutcome =
  | {
      readonly _tag: 'Matches';
      readonly visibleIds: ReadonlySet<ProjectId>;
      readonly visibleCount: number;
      readonly totalCount: number;
    }
  | { readonly _tag: 'Empty'; readonly totalCount: number };

export function findMatchingTag(
  raw: string | null | undefined,
  validTags: readonly SkillTag[],
): Option<SkillTag> {
  if (!raw) return none;
  const target = raw.trim().toLowerCase();
  return fromNullable(validTags.find((tag) => tag.toLowerCase() === target));
}

export function decodeFilterFromUrl(
  params: URLSearchParams,
  validTags: readonly SkillTag[],
): FilterCriteria {
  const tagOpt = findMatchingTag(params.get('skill'), validTags);
  const tag = match(tagOpt, {
    Some: ({ value }) => selectedTag(value),
    None: () => allTags,
  });
  const query = params.get('q') ?? '';
  return { tag, query };
}

export function encodeFilterToUrl(currentHref: string, criteria: FilterCriteria): string {
  const url = new URL(currentHref);
  match(criteria.tag, {
    AllTags: () => {
      url.searchParams.delete('skill');
    },
    SelectedTag: ({ tag }) => {
      url.searchParams.set('skill', tag);
    },
  });

  const trimmed = criteria.query.trim();
  if (trimmed.length > 0) {
    url.searchParams.set('q', trimmed);
  } else {
    url.searchParams.delete('q');
  }
  return url.toString();
}

export function reduceFilter(state: FilterCriteria, action: FilterAction): FilterCriteria {
  return match(action, {
    SelectAllTags: () => ({
      ...state,
      tag: allTags,
    }),
    ToggleTag: ({ tag: nextTag }) =>
      match(state.tag, {
        AllTags: () => ({
          ...state,
          tag: selectedTag(nextTag),
        }),
        SelectedTag: ({ tag: currentTag }) => ({
          ...state,
          tag:
            currentTag.toLowerCase() === nextTag.toLowerCase()
              ? allTags
              : selectedTag(nextTag),
        }),
      }),
    SetQuery: ({ query }) => ({
      ...state,
      query,
    }),
    Reset: () => INITIAL_FILTER_CRITERIA,
    HydrateFromUrl: ({ params, validTags }) => decodeFilterFromUrl(params, validTags),
  });
}

export function isTagSelected(filter: TagFilter, candidate: SkillTag): boolean {
  return match(filter, {
    AllTags: () => false,
    SelectedTag: ({ tag }) => tag.toLowerCase() === candidate.toLowerCase(),
  });
}

export function isFilterActive(criteria: FilterCriteria): boolean {
  const hasTag = match(criteria.tag, {
    AllTags: () => false,
    SelectedTag: () => true,
  });
  return hasTag || criteria.query.trim().length > 0;
}

export function evaluateFilter(
  projects: readonly FilterableProject[],
  criteria: FilterCriteria,
): FilterOutcome {
  const normalizedQuery = criteria.query.trim().toLowerCase();
  const visibleIds = new Set<ProjectId>();

  for (const { id, tags, searchText } of projects) {
    const matchesTag = match(criteria.tag, {
      AllTags: () => true,
      SelectedTag: ({ tag }) =>
        tags.some((item) => item.toLowerCase() === tag.toLowerCase()),
    });
    const matchesQuery =
      normalizedQuery.length === 0 || searchText.includes(normalizedQuery);

    if (matchesTag && matchesQuery) {
      visibleIds.add(id);
    }
  }

  return visibleIds.size > 0
    ? {
        _tag: 'Matches',
        visibleIds,
        visibleCount: visibleIds.size,
        totalCount: projects.length,
      }
    : {
        _tag: 'Empty',
        totalCount: projects.length,
      };
}

export function toSkillTags(rawTags: readonly string[]): readonly SkillTag[] {
  return rawTags.map((tag) => asSkillTag(tag));
}

export function parseSkillTagArray(rawJson: string | undefined): Option<readonly SkillTag[]> {
  if (!rawJson) return none;
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return some(toSkillTags(parsed));
    }
    return none;
  } catch {
    return none;
  }
}
