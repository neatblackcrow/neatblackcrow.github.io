import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { match } from '../domain/adt.ts';
import { asProjectId, asSkillTag, type SkillTag } from '../domain/cv.ts';
import {
  INITIAL_FILTER_CRITERIA,
  encodeFilterToUrl,
  evaluateFilter,
  isFilterActive,
  isTagSelected,
  reduceFilter,
  type FilterAction,
  type FilterCriteria,
  type FilterableProject,
} from '../domain/filter.ts';
import type { UiStrings } from '../i18n/ui';
import styles from './ProjectSkillFilter.module.css';

interface Props {
  readonly projects: readonly FilterableProject[];
  readonly tags: readonly SkillTag[];
  readonly strings: UiStrings['filter'];
}

export default function ProjectSkillFilter(props: Props) {
  const [criteria, setCriteria] = createSignal<FilterCriteria>(INITIAL_FILTER_CRITERIA);
  const [hydrated, setHydrated] = createSignal(false);

  const dispatch = (action: FilterAction): void => {
    setCriteria((prev) => reduceFilter(prev, action));
  };

  const outcome = createMemo(() => evaluateFilter(props.projects, criteria()));
  const active = createMemo(() => isFilterActive(criteria()));
  const isEmpty = createMemo(() =>
    match(outcome(), {
      Matches: () => false,
      Empty: () => true,
    }),
  );

  const statusText = createMemo(() =>
    match(outcome(), {
      Matches: ({ visibleCount, totalCount }) =>
        props.strings.showingCount
          .replace('{visible}', String(visibleCount))
          .replace('{total}', String(totalCount)),
      Empty: ({ totalCount }) =>
        props.strings.showingCount
          .replace('{visible}', '0')
          .replace('{total}', String(totalCount)),
    }),
  );

  onMount(() => {
    dispatch({
      _tag: 'HydrateFromUrl',
      params: new URLSearchParams(window.location.search),
      validTags: props.tags,
    });
    setHydrated(true);

    const skillsSection = document.getElementById('skills');
    if (!skillsSection) return;
    skillsSection.setAttribute('data-skills-enhanced', 'true');

    const skillTags = Array.from(
      skillsSection.querySelectorAll<HTMLElement>('[data-skill-tag]'),
    );

    const cleanups: Array<() => void> = [];
    for (const el of skillTags) {
      const rawTag = el.dataset.skillTag;
      if (!rawTag) continue;
      const targetTag = asSkillTag(rawTag);

      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');

      const activate = (): void => {
        dispatch({ _tag: 'ToggleTag', tag: targetTag });
        const projectsSection = document.getElementById('projects');
        if (projectsSection) {
          projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };

      const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      };

      el.addEventListener('click', activate);
      el.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        el.removeEventListener('click', activate);
        el.removeEventListener('keydown', onKeyDown);
      });
    }

    onCleanup(() => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    });
  });

  createEffect(() => {
    const currentCriteria = criteria();
    const currentOutcome = outcome();
    if (!hydrated()) return;

    const cards = document.querySelectorAll<HTMLElement>('[data-project-card]');
    for (const card of cards) {
      const rawId = card.dataset.projectId;
      if (!rawId) continue;
      const projectId = asProjectId(rawId);

      const isVisible = match(currentOutcome, {
        Matches: ({ visibleIds }) => visibleIds.has(projectId),
        Empty: () => false,
      });

      if (isVisible) {
        card.removeAttribute('hidden');
      } else {
        card.setAttribute('hidden', '');
      }
    }

    const skillChips = document.querySelectorAll<HTMLElement>('[data-skill-tag]');
    for (const chip of skillChips) {
      const rawTag = chip.dataset.skillTag;
      if (!rawTag) continue;
      const chipActive = isTagSelected(currentCriteria.tag, asSkillTag(rawTag));
      chip.setAttribute('aria-pressed', String(chipActive));
    }

    const nextUrl = encodeFilterToUrl(window.location.href, currentCriteria);
    window.history.replaceState(null, '', nextUrl);
  });

  const allPressed = createMemo(() =>
    match(criteria().tag, {
      AllTags: () => true,
      SelectedTag: () => false,
    }),
  );

  return (
    <div class={styles.filterPanel}>
      <div class={styles.controlsRow}>
        <label class={styles.searchField}>
          <span class="sr-only">{props.strings.searchLabel}</span>
          <input
            type="search"
            class={styles.searchInput}
            value={criteria().query}
            placeholder={props.strings.searchPlaceholder}
            onInput={(event) =>
              dispatch({ _tag: 'SetQuery', query: event.currentTarget.value })
            }
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                dispatch({ _tag: 'Reset' });
              }
            }}
          />
        </label>

        <div class={styles.statusGroup}>
          <span class={styles.statusText} aria-live="polite">
            {statusText()}
          </span>
          <Show when={active()}>
            <button
              type="button"
              class={styles.clearBtn}
              onClick={() => dispatch({ _tag: 'Reset' })}
            >
              {props.strings.clearFilters}
            </button>
          </Show>
        </div>
      </div>

      <div class={styles.tagRow} role="group" aria-label={props.strings.tagGroupLabel}>
        <button
          type="button"
          class={styles.tagBtn}
          aria-pressed={allPressed()}
          onClick={() => dispatch({ _tag: 'SelectAllTags' })}
        >
          {props.strings.allSkills}
        </button>

        <For each={props.tags}>
          {(tag) => (
            <button
              type="button"
              class={styles.tagBtn}
              aria-pressed={isTagSelected(criteria().tag, tag)}
              onClick={() => dispatch({ _tag: 'ToggleTag', tag })}
            >
              {tag}
            </button>
          )}
        </For>
      </div>

      <Show when={hydrated() && isEmpty()}>
        <div class={styles.emptyState} role="status">
          <p>{props.strings.emptyTitle}</p>
          <button
            type="button"
            class={styles.clearBtn}
            onClick={() => dispatch({ _tag: 'Reset' })}
          >
            {props.strings.emptyAction}
          </button>
        </div>
      </Show>
    </div>
  );
}
