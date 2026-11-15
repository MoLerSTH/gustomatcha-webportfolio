'use client';

import { useState } from 'react';
import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { EXPERIENCE_TIMELINE } from '@/data/portfolioData';
import {
  computeExperienceTrackCounts,
  filterExperienceTimeline,
  type ExperienceFilterType,
} from '@/lib/portfolioSectionControllers';
import {
  NeoBadge,
  NeoCard,
  NeoSectionHeader,
} from '@/components/ui/NeoBrutalPrimitives';

const TRACK_FILTERS: readonly ExperienceFilterType[] = [
  'ALL',
  'INTERNSHIP',
  'HACKATHON',
  'COMPETITION',
];

/**
 * Section 03: Filterable Engineering Experience & Competitions Timeline (#experience).
 */
export function ExperienceTimelineSection() {
  const [activeTrack, setActiveTrack] = useState<ExperienceFilterType>('ALL');

  const trackCounts = computeExperienceTrackCounts(EXPERIENCE_TIMELINE);
  const visibleEntries = filterExperienceTimeline(
    EXPERIENCE_TIMELINE,
    activeTrack
  );

  return (
    <section
      id="experience"
      tabIndex={-1}
      aria-labelledby="heading-experience"
      className="neo-section-deferred scroll-mt-24 space-y-8"
    >
      <NeoSectionHeader
        indexCode="03 // EXPERIENCE & COMPETITIONS TIMELINE"
        title="ENGINEERING TRACK RECORD & HACKATHONS"
        subtitle="Verified industry internships, AI research deployments, and national security & algorithmic competitions."
        accent="mint"
        headingId="heading-experience"
      />

      <div
        role="group"
        aria-label="Filter experience timeline by track"
        className="flex flex-wrap items-center gap-2"
      >
        {TRACK_FILTERS.map((track) => {
          const isSelected = activeTrack === track;
          const count = trackCounts[track];

          return (
            <button
              key={track}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setActiveTrack(track)}
              className={`neo-btn-tactile cursor-pointer px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
                isSelected
                  ? 'bg-[#0A0A0A] text-[#FFFFFF]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-primary)]'
              }`}
            >
              {track} ({count})
            </button>
          );
        })}
      </div>

      <p
        role="status"
        aria-live="polite"
        className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
      >
        SHOWING {visibleEntries.length} OF {EXPERIENCE_TIMELINE.length} VERIFIED
        MILESTONES
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {visibleEntries.map((item) => (
          <NeoCard
            key={item.id}
            as="article"
            variant="white"
            headerVariant={item.accent}
            windowTitle={item.type}
            windowTag={item.period}
            className="flex h-full flex-col"
            bodyClassName="flex flex-1 flex-col justify-between gap-4"
          >
            <div className="space-y-4">
              <header className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <NeoBadge variant={item.accent}>{item.type}</NeoBadge>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--text-muted)]">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {item.location}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs font-bold text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="size-3.5" aria-hidden="true" />
                    {item.organization}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" aria-hidden="true" />
                    {item.period}
                  </span>
                </div>
              </header>

              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.summary}
              </p>

              <ul className="space-y-1.5 border-t border-[var(--ui-border-color)] pt-3">
                {item.achievements.map((achievement) => (
                  <li
                    key={achievement}
                    className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-mono font-bold text-[var(--text-primary)]"
                    >
                      ▸
                    </span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="flex flex-wrap gap-1.5 border-t-2 border-[var(--ui-border-color)] pt-3">
              {item.techTags.map((tag) => (
                <span
                  key={tag}
                  className="border border-[var(--ui-border-color)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-primary)]"
                >
                  {tag}
                </span>
              ))}
            </footer>
          </NeoCard>
        ))}
      </div>
    </section>
  );
}
