'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  Radio,
  Terminal,
} from 'lucide-react';
import { GUSTO_PROFILE } from '@/data/portfolioData';
import {
  NeoBadge,
  NeoButton,
  NeoCard,
} from '@/components/ui/NeoBrutalPrimitives';

export interface ClipboardWriterLike {
  writeText?: (text: string) => Promise<void>;
}

/**
 * Safely copies text via a Clipboard API writer without throwing on SSR or denied permissions.
 */
export async function copyTextSafely(
  text: string,
  clipboard?: ClipboardWriterLike | null
): Promise<boolean> {
  if (!text || !clipboard || typeof clipboard.writeText !== 'function') {
    return false;
  }

  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Section 05: Direct Contact & Communication Uplink (#contact).
 * Implements MWG copy-button rules: button is never disabled during feedback and
 * polite status live region stays outside the button for reliable announcements.
 */
export function ContactUplinkSection() {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle'
  );
  const [statusMessage, setStatusMessage] = useState('');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatToggleRef = useRef(false);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopyEmail = async () => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const clipboard =
      typeof navigator !== 'undefined' ? navigator.clipboard : null;
    const copied = await copyTextSafely(GUSTO_PROFILE.email, clipboard);

    repeatToggleRef.current = !repeatToggleRef.current;
    const nbspSuffix = repeatToggleRef.current ? '\u00A0' : '';

    if (copied) {
      setCopyStatus('copied');
      setStatusMessage(
        `Email address ${GUSTO_PROFILE.email} copied to clipboard.${nbspSuffix}`
      );
    } else {
      setCopyStatus('error');
      setStatusMessage(
        `Clipboard unavailable. Use ${GUSTO_PROFILE.email} via email client.${nbspSuffix}`
      );
    }

    resetTimerRef.current = setTimeout(() => {
      setCopyStatus('idle');
      setStatusMessage('');
      resetTimerRef.current = null;
    }, 3500);
  };

  return (
    <section
      id="contact"
      aria-labelledby="heading-contact"
      className="neo-section-deferred scroll-mt-24"
    >
      <NeoCard
        variant="white"
        headerVariant="coral"
        windowTitle="COMMS_UPLINK // DIRECT_CHANNELS"
        windowTag="ACTIVE_NODE"
        bodyClassName="space-y-6"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <NeoBadge variant="mint" pulseDot dotVariant="coral">
                UPLINK ONLINE
              </NeoBadge>
              <span className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                {GUSTO_PROFILE.location}
              </span>
            </div>

            <h2
              id="heading-contact"
              className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              READY FOR SYSTEM ENGINEERING &amp; AI ARCHITECTURE
            </h2>

            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
              Reach out directly for backend infrastructure, real-time AI pipelines,
              full-stack engineering internships/roles, or technical collaborations.
            </p>
          </div>

          <div className="neo-border bg-[var(--bg-canvas)] p-4 font-mono text-xs">
            <p className="flex items-center gap-2 font-bold uppercase text-[var(--text-muted)]">
              <Radio className="size-3.5 text-[#00A896]" aria-hidden="true" />
              <span>Endpoint Telemetry</span>
            </p>
            <p className="mt-1.5 font-bold text-[var(--text-primary)]">
              {GUSTO_PROFILE.email}
            </p>
            <p className="mt-1 text-[var(--text-secondary)]">
              {GUSTO_PROFILE.githubHandle} · {GUSTO_PROFILE.handle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t-2 border-[var(--ui-border-color)] pt-5">
          <NeoButton
            href={`mailto:${GUSTO_PROFILE.email}`}
            variant="yellow"
            size="md"
            leftIcon={<Mail className="size-4" />}
          >
            {GUSTO_PROFILE.email}
          </NeoButton>

          <NeoButton
            type="button"
            variant={copyStatus === 'copied' ? 'mint' : 'white'}
            size="md"
            onClick={() => {
              void handleCopyEmail();
            }}
            leftIcon={
              copyStatus === 'copied' ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )
            }
          >
            {copyStatus === 'copied'
              ? 'COPIED TO CLIPBOARD'
              : copyStatus === 'error'
                ? 'RETRY COPY EMAIL'
                : 'COPY EMAIL'}
          </NeoButton>

          <NeoButton
            href={GUSTO_PROFILE.githubUrl}
            external
            variant="dark"
            size="md"
            leftIcon={<Terminal className="size-4" />}
            rightIcon={<ExternalLink className="size-3.5" />}
          >
            GITHUB // MoLerSTH
          </NeoButton>

          <NeoButton
            href={GUSTO_PROFILE.linkedinUrl}
            external
            variant="cobalt"
            size="md"
            rightIcon={<ExternalLink className="size-3.5" />}
          >
            LINKEDIN // PROFILE
          </NeoButton>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="min-h-5 font-mono text-xs font-bold text-[var(--text-secondary)]"
        >
          {statusMessage}
        </div>
      </NeoCard>
    </section>
  );
}
