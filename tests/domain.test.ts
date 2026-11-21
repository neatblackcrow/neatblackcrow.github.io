import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  err,
  flatMapOption,
  fromNullable,
  getOrElse,
  head,
  isNonEmpty,
  mapOption,
  mapResult,
  match,
  none,
  ok,
  some,
} from '../src/domain/adt.ts';
import {
  asProjectId,
  asSkillTag,
  classifyReference,
  collectOptionalSections,
  isCurrentRole,
  toEmploymentSpan,
  toOrganizationTitle,
} from '../src/domain/cv.ts';
import {
  INITIAL_FILTER_CRITERIA,
  decodeFilterFromUrl,
  encodeFilterToUrl,
  evaluateFilter,
  isFilterActive,
  reduceFilter,
  resolveSkillChip,
  toSkillTags,
  type FilterableProject,
} from '../src/domain/filter.ts';
import {
  extractTheme,
  invertTheme,
  resolveThemePreference,
} from '../src/domain/theme.ts';

describe('ADT primitives', () => {
  it('supports exhaustive match, Option, Result, and NonEmptyArray', () => {
    const present = fromNullable('astro');
    const missing = fromNullable<string>(undefined);

    assert.equal(
      getOrElse(mapOption(present, (s) => s.toUpperCase()), () => 'NONE'),
      'ASTRO',
    );
    assert.equal(
      getOrElse(
        flatMapOption(missing, (s) => some(s.length)),
        () => 0,
      ),
      0,
    );
    assert.deepEqual(mapResult(ok(21), (n) => n * 2), ok(42));
    assert.deepEqual(mapResult(err('bad'), (n: number) => n * 2), err('bad'));

    const arr = ['first', 'second'];
    assert.equal(isNonEmpty(arr), true);
    if (isNonEmpty(arr)) {
      assert.equal(head(arr), 'first');
    }
    assert.equal(isNonEmpty([]), false);
    assert.deepEqual(none, { _tag: 'None' });
  });
});

describe('CV domain ADTs', () => {
  it('distinguishes Ongoing vs Completed employment spans', () => {
    const ongoing = toEmploymentSpan({ startDate: '2023-08', period: 'Aug 2023 – Present' });
    const completed = toEmploymentSpan({
      startDate: '2023-12',
      endDate: '2025-04',
      period: 'Dec 2023 – Apr 2025',
    });

    assert.equal(ongoing._tag, 'Ongoing');
    assert.equal(isCurrentRole(ongoing), true);
    assert.equal(completed._tag, 'Completed');
    assert.equal(isCurrentRole(completed), false);
  });

  it('models OrganizationTitle and ReferenceDisplay cleanly', () => {
    const plain = toOrganizationTitle('Office of the Attorney General');
    const linked = toOrganizationTitle('Example', 'https://example.com');
    assert.equal(plain._tag, 'Plain');
    assert.equal(linked._tag, 'Linked');

    const selfDesc = classifyReference(
      'stathub.nso.go.th (SIS-CC .Stat Suite)',
      'https://stathub.nso.go.th',
    );
    const withPrint = classifyReference('SIS-CC Project', 'https://siscc.org/');
    assert.equal(selfDesc._tag, 'SelfDescribing');
    assert.equal(withPrint._tag, 'WithPrintUrl');
  });

  it('collects only populated optional sections', () => {
    const groups = collectOptionalSections([
      { id: 'certifications', title: 'Certifications', items: [] },
      { id: 'publications', title: 'Publications', items: ['Paper 1'] },
      { id: 'talks', title: 'Talks', items: undefined },
    ]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.id, 'publications');
    assert.equal(head(groups[0]!.items), 'Paper 1');
  });
});

describe('Skill & Project filter algebra', () => {
  const tags = toSkillTags(['Java', 'Swing GUI', 'React', 'Flutter', 'Linux']);
  const projects: readonly FilterableProject[] = [
    {
      id: asProjectId('clear-weather'),
      name: 'Clear Weather',
      tags: toSkillTags(['Dart', 'Flutter']),
      searchText: 'clear weather dart flutter bloc cubit',
    },
    {
      id: asProjectId('robotz'),
      name: 'Robotz Language Interpreter',
      tags: toSkillTags(['Java', 'Swing GUI']),
      searchText: 'robotz language interpreter java swing gui automata',
    },
    {
      id: asProjectId('myirc'),
      name: 'MyIRC',
      tags: toSkillTags(['Java', 'Swing GUI', 'TCP']),
      searchText: 'myirc msnclone java swing gui tcp networking',
    },
  ];

  it('resolves skill chips with delimiter boundaries and longest-tag specificity', () => {
    assert.deepEqual(resolveSkillChip('JavaScript', tags), {
      _tag: 'Static',
      label: 'JavaScript',
    });
    assert.deepEqual(resolveSkillChip('Java', tags), {
      _tag: 'Filterable',
      label: 'Java',
      targetTag: asSkillTag('Java'),
    });
    assert.deepEqual(resolveSkillChip('Swing GUI (Java)', tags), {
      _tag: 'Filterable',
      label: 'Swing GUI (Java)',
      targetTag: asSkillTag('Swing GUI'),
    });
    assert.deepEqual(resolveSkillChip('React / Redux', tags), {
      _tag: 'Filterable',
      label: 'React / Redux',
      targetTag: asSkillTag('React'),
    });
    assert.deepEqual(resolveSkillChip('Linux (Ubuntu, Red Hat / RHEL)', tags), {
      _tag: 'Filterable',
      label: 'Linux (Ubuntu, Red Hat / RHEL)',
      targetTag: asSkillTag('Linux'),
    });
  });

  it('reduces filter actions and evaluates outcomes cleanly', () => {
    let state = reduceFilter(INITIAL_FILTER_CRITERIA, {
      _tag: 'ToggleTag',
      tag: asSkillTag('Java'),
    });
    assert.equal(isFilterActive(state), true);

    const javaOutcome = evaluateFilter(projects, state);
    match(javaOutcome, {
      Matches: ({ visibleCount, visibleIds }) => {
        assert.equal(visibleCount, 2);
        assert.equal(visibleIds.has(asProjectId('robotz')), true);
        assert.equal(visibleIds.has(asProjectId('myirc')), true);
      },
      Empty: () => assert.fail('Expected matching Java projects'),
    });
    assert.equal(javaOutcome._tag, 'Matches');

    state = reduceFilter(state, { _tag: 'SetQuery', query: 'nonexistent-xyz' });
    const emptyOutcome = evaluateFilter(projects, state);
    assert.deepEqual(emptyOutcome, { _tag: 'Empty', totalCount: 3 });

    state = reduceFilter(state, { _tag: 'Reset' });
    assert.deepEqual(state, INITIAL_FILTER_CRITERIA);
    assert.equal(isFilterActive(state), false);
  });

  it('round-trips URL query parameters cleanly', () => {
    const hydrated = decodeFilterFromUrl(
      new URLSearchParams('skill=flutter&q=cubit'),
      tags,
    );
    assert.deepEqual(hydrated, {
      tag: { _tag: 'SelectedTag', tag: asSkillTag('Flutter') },
      query: 'cubit',
    });

    const encoded = encodeFilterToUrl('https://neatblackcrow.github.io/', hydrated);
    assert.equal(encoded, 'https://neatblackcrow.github.io/?skill=Flutter&q=cubit');

    const cleared = encodeFilterToUrl(encoded, INITIAL_FILTER_CRITERIA);
    assert.equal(cleared, 'https://neatblackcrow.github.io/');
  });
});

describe('Theme preference ADT', () => {
  it('distinguishes stored override from system fallback', () => {
    const storedLight = resolveThemePreference('light', true);
    assert.deepEqual(storedLight, { _tag: 'Stored', theme: 'light' });
    assert.equal(extractTheme(storedLight), 'light');

    const systemDark = resolveThemePreference(null, true);
    assert.deepEqual(systemDark, { _tag: 'System', theme: 'dark' });
    assert.equal(invertTheme(extractTheme(systemDark)), 'light');
  });
});
