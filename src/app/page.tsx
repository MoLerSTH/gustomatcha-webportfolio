import { GUSTO_PROFILE } from '@/data/portfolioData';
import { NeoNavbar } from '@/components/ui/NeoNavbar';
import { HeroSection } from '@/components/hero/HeroSection';
import { AboutArchitectureSection } from '@/components/sections/AboutArchitectureSection';
import { ProjectsVaultSection } from '@/components/projects/ProjectsVaultSection';
import { ExperienceTimelineSection } from '@/components/sections/ExperienceTimelineSection';
import { TechStackMatrixSection } from '@/components/sections/TechStackMatrixSection';
import { ContactUplinkSection } from '@/components/sections/ContactUplinkSection';

export default function HomePage() {
  return (
    <>
      <NeoNavbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 space-y-20">
        {/* PHASE 3: <= 3.0s TERMINAL INTRO & SYNCHRONIZED HERO */}
        <HeroSection />

        {/* SECTION 01: SYSTEM ARCHITECT DOSSIER & SEARCHABLE DESIGN LAB */}
        <AboutArchitectureSection />

        {/* SECTION 02: 3D-TILT FEATURED SYSTEMS & FILTERABLE 6-PROJECT VAULT */}
        <ProjectsVaultSection />

        {/* SECTION 03: FILTERABLE EXPERIENCE & COMPETITIONS TIMELINE */}
        <ExperienceTimelineSection />

        {/* SECTION 04: TECH STACK MATRIX & SKILL CROSS-REFERENCES */}
        <TechStackMatrixSection />

        {/* SECTION 05: DIRECT CONTACT UPLINK */}
        <ContactUplinkSection />
      </main>

      <footer className="border-t-[3px] border-[var(--ui-border-color)] bg-[var(--bg-surface)] mt-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 font-mono text-xs">
          <div className="font-bold">
            GUSTO_OS v2.6 // {GUSTO_PROFILE.fullName} ({GUSTO_PROFILE.githubHandle})
          </div>
          <div className="text-[var(--ink-muted)]">
            {GUSTO_PROFILE.program} • {GUSTO_PROFILE.university}
          </div>
        </div>
      </footer>
    </>
  );
}
