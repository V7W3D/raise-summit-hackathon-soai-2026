import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Search, Sparkles, Users } from 'lucide-react';
import { useLeads } from '../discover/use-discover-api-queries';
import {
  SEARCH_UI_TIMEOUT_MS,
  useMissionSearchProgress,
  useRunMissionSearch,
  type MissionVM,
  type SearchProgressPhase,
  type SearchProgressVM,
} from './use-missions-api-queries';

const PHASE_LABELS: Record<SearchProgressPhase, string> = {
  idle: 'Starting agent…',
  planning: 'Planning search queries for your target market…',
  searching: 'Scanning the web for matching businesses…',
  extracting: 'Fetching websites and extracting contacts…',
  scoring: 'Scoring leads against your mission criteria…',
  done: 'Finalizing results…',
  failed: 'Search failed.',
};

const PHASE_STEP: Record<SearchProgressPhase, number> = {
  idle: 0,
  planning: 0,
  searching: 1,
  extracting: 2,
  scoring: 3,
  done: 3,
  failed: 3,
};

function progressTickers(progress: SearchProgressVM) {
  return [
    { label: 'Results found', value: progress.resultsFound },
    { label: 'Pages scanned', value: progress.pagesFetched },
    { label: 'Emails extracted', value: progress.emailsFound },
    { label: 'Leads scored', value: progress.leadsScored },
    { label: 'Skipped', value: progress.rejected },
  ];
}

type MissionSearchPanelProps = {
  mission: MissionVM;
  autoStart?: boolean;
};

export function MissionSearchPanel({ mission, autoStart = false }: MissionSearchPanelProps) {
  const navigate = useNavigate();
  const runMissionSearch = useRunMissionSearch();
  const isSearching = mission.searchStatus === 'running';
  const isFailed = mission.searchStatus === 'failed';
  const [showComplete, setShowComplete] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const autoStartedRef = useRef(false);
  const wasRunningRef = useRef(isSearching);
  const completeTimerRef = useRef<number | null>(null);
  const searchStartedAtRef = useRef<number | null>(null);

  const shouldPoll = isSearching && !timedOut;

  const { data: leads = [] } = useLeads({
    missionId: mission.id,
    refetchInterval: shouldPoll ? 2000 : false,
  });

  const { data: progress } = useMissionSearchProgress(mission.id, {
    enabled: shouldPoll,
    poll: shouldPoll,
  });

  useEffect(() => {
    if (isSearching) {
      if (searchStartedAtRef.current === null) {
        searchStartedAtRef.current = Date.now();
      }
      setTimedOut(false);
      return;
    }
    searchStartedAtRef.current = null;
    setTimedOut(false);
    setElapsedSeconds(0);
  }, [isSearching]);

  useEffect(() => {
    if (!shouldPoll || searchStartedAtRef.current === null) return;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - (searchStartedAtRef.current ?? Date.now());
      setElapsedSeconds(Math.floor(elapsed / 1000));
      if (elapsed >= SEARCH_UI_TIMEOUT_MS) {
        setTimedOut(true);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [shouldPoll]);

  useEffect(() => {
    if (autoStart && !autoStartedRef.current && !isSearching && !mission.isArchived) {
      autoStartedRef.current = true;
      runMissionSearch.mutate(mission.id);
    }
  }, [autoStart, isSearching, mission.id, mission.isArchived, runMissionSearch]);

  useEffect(() => {
    const wasRunning = wasRunningRef.current;
    wasRunningRef.current = isSearching;

    if (wasRunning && !isSearching && mission.searchStatus === 'ready') {
      setShowComplete(true);
      completeTimerRef.current = window.setTimeout(() => {
        navigate(`/missions/${mission.id}/verdict`);
      }, 1600);
    }

    if (wasRunning && !isSearching && mission.searchStatus === 'failed') {
      setShowComplete(false);
    }
  }, [isSearching, mission.id, mission.searchStatus, navigate]);

  useEffect(
    () => () => {
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current);
      }
    },
    [],
  );

  const handleRunSearch = () => {
    setShowComplete(false);
    setTimedOut(false);
    setElapsedSeconds(0);
    searchStartedAtRef.current = null;
    runMissionSearch.mutate(mission.id);
  };

  const isStarting = runMissionSearch.isPending && runMissionSearch.variables === mission.id;
  const previewLeads = leads.slice(0, 3);
  const showProgress = (isSearching || isStarting) && !timedOut;

  const phase: SearchProgressPhase =
    progress && isSearching && progress.phase !== 'done' && progress.phase !== 'failed'
      ? progress.phase
      : 'idle';
  const activeStep = PHASE_STEP[phase];
  const phaseLabel =
    phase === 'searching' && progress && progress.queriesPlanned > 0
      ? `Scanning the web — query ${Math.min(progress.queriesRun + 1, progress.queriesPlanned)} of ${progress.queriesPlanned}…`
      : PHASE_LABELS[phase];
  const hasLiveCounts = progress !== undefined && phase !== 'idle';

  if (mission.isArchived) {
    return null;
  }

  return (
    <section className="mission-search-panel card" aria-live="polite">
      <div className="mission-search-panel-head">
        <span className="mission-search-panel-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <h2 className="mission-search-panel-title">Lead search agent</h2>
          <p className="mission-search-panel-subtitle">
            AI scans the web for {mission.target || 'matching businesses'} in{' '}
            {mission.location || 'your target area'}.
          </p>
        </div>
      </div>

      {showProgress ? (
        <div className="mission-search-progress">
          <div className="mission-search-progress-head">
            <Loader2 className="mission-search-spinner" size={18} aria-hidden />
            <span>{isStarting ? 'Starting agent…' : phaseLabel}</span>
            {elapsedSeconds > 0 ? (
              <span className="mission-search-elapsed">{elapsedSeconds}s</span>
            ) : null}
          </div>

          <div className="mission-search-steps">
            {['Plan', 'Search', 'Extract', 'Score'].map((label, index) => {
              const isDone = index < activeStep;
              const isActive = index === activeStep;
              return (
                <div
                  key={label}
                  className={`mission-search-step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}
                >
                  <span className="mission-search-step-dot" />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          {hasLiveCounts ? (
            <div className="mission-search-tickers">
              {progressTickers(progress).map((ticker) => (
                <div key={ticker.label} className="mission-search-ticker">
                  <span className="mission-search-ticker-value">{ticker.value}</span>
                  <span className="mission-search-ticker-label">{ticker.label}</span>
                </div>
              ))}
            </div>
          ) : previewLeads.length > 0 ? (
            <div className="mission-search-preview">
              <span className="mission-search-preview-label">
                <Users size={14} /> Previously found
              </span>
              <ul className="mission-search-preview-list">
                {previewLeads.map((lead) => (
                  <li key={lead.id}>{lead.name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mission-search-skeletons" aria-hidden>
              {[0, 1, 2].map((item) => (
                <div key={item} className="mission-search-skeleton" />
              ))}
            </div>
          )}
        </div>
      ) : timedOut && isSearching ? (
        <div className="mission-search-idle">
          <p className="mission-search-error" role="alert">
            Search is taking longer than expected or got stuck. You can retry — the previous run
            will be reset automatically.
          </p>
          <div className="mission-search-actions">
            <button type="button" className="btn btn-primary" onClick={handleRunSearch}>
              <Search size={16} /> Retry search
            </button>
          </div>
        </div>
      ) : showComplete ? (
        <div className="mission-search-complete">
          <CheckCircle2 size={22} />
          <div>
            <strong>Search complete</strong>
            <p>
              {leads.length > 0
                ? `${leads.length} lead${leads.length === 1 ? '' : 's'} ready — opening the agent's verdict…`
                : 'Opening the agent’s verdict…'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mission-search-idle">
          <p className="mission-search-idle-copy">
            Run the agent whenever you want fresh leads. Each run adds new businesses without
            duplicating ones you already have.
          </p>
          {isFailed ? (
            <p className="mission-search-error" role="alert">
              Last search did not finish successfully. Try again — Tavily searches usually take
              about 30 seconds.
            </p>
          ) : null}
          <div className="mission-search-actions">
            <button
              type="button"
              className="btn btn-primary mission-search-run-btn"
              onClick={handleRunSearch}
              disabled={isStarting}
            >
              {isFailed ? (
                <>
                  <Search size={16} /> Search again
                </>
              ) : leads.length > 0 ? (
                <>
                  <Sparkles size={16} /> Search again
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Find leads
                </>
              )}
            </button>
            {leads.length > 0 ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate(`/missions/${mission.id}/verdict`)}
                >
                  View verdict
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate(`/discover?mission=${mission.id}`)}
                >
                  View {leads.length} lead{leads.length === 1 ? '' : 's'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
