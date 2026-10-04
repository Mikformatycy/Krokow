import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { RouteResponse } from '@krok/contracts';
import { announce } from '../../adapters/accessibility/announce';
import { SpeechCoordinator } from '../../adapters/speech/coordinator';
import type { SpeechStatus } from '../../adapters/speech/coordinator';
import { createSpeechPort, watchSpeechEnvironment } from '../../adapters/speech/platform';
import { SimulationSession } from '../simulation/session';
import type { InvalidationReason, SimulationState, SimulationTransition } from '../simulation/controller';
import type { SimulationItem } from '../simulation/plan';
import { speechText } from './speechText';

// UI owns lifecycle and ticks only. All progress, ordering and speech queues stay in the existing core.
export function useRoutePlayback(response: RouteResponse) {
  const [selected, setSelected] = useState(response.recommendation.routeId);
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [reader, setReader] = useState<boolean | null>(null);
  const [manualReader, setManualReader] = useState(false);
  const [active, setActive] = useState(true);
  const [voice, setVoice] = useState(false);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [events, setEvents] = useState<readonly SimulationItem[]>([]);
  const [ended, setEnded] = useState(false);
  const owner = useRef<SpeechCoordinator | null>(null);
  const session = useRef<SimulationSession | null>(null);
  const environment = useRef({ reader: null as boolean | null, manual: false, active: true, focused: true });

  const publish = useCallback((current: SimulationSession, transition: SimulationTransition) => {
    if (session.current !== current) return;
    setSimulation(transition.state); setText(current.text);
    const additions = transition.emissions.filter((emission) => emission.reason === 'progress').map(({ item }) => item);
    if (additions.length) setEvents((previous) => [...previous, ...additions]);
  }, []);
  const end = useCallback((reason: InvalidationReason) => {
    const current = session.current;
    session.current = null;
    if (current) { current.invalidate(reason); setEnded(true); }
    owner.current?.stop();
    setSimulation(null); setText(null); setEvents([]);
  }, []);
  const syncEnvironment = useCallback(() => {
    const env = environment.current;
    const isActive = env.active && env.focused;
    setActive(isActive);
    if (session.current) {
      const current = session.current;
      current.setReader(env.manual ? true : env.reader);
      publish(current, current.setActive(isActive));
    } else {
      // Inactivity cancels playback but must not be announced as a detected screen reader.
      if (!isActive) owner.current?.stop();
      owner.current?.setBlocked(env.manual || env.reader !== false);
    }
  }, [publish]);

  useEffect(() => {
    const coordinator = new SpeechCoordinator(createSpeechPort(), setStatus);
    owner.current = coordinator; coordinator.setBlocked(true);
    setSelected(response.recommendation.routeId); setVoice(false); setEnded(false);
    const unwatch = watchSpeechEnvironment((enabled) => {
      environment.current.reader = enabled; setReader(enabled); syncEnvironment();
    }, (isActive) => { environment.current.active = isActive; syncEnvironment(); });
    return () => {
      unwatch(); end('data_changed'); coordinator.dispose(); owner.current = null;
    };
  }, [response, end, syncEnvironment]);

  useFocusEffect(useCallback(() => {
    environment.current.focused = true; syncEnvironment();
    return () => {
      environment.current.focused = false; end('unmounted'); syncEnvironment();
    };
  }, [end, syncEnvironment]));

  useEffect(() => {
    const current = session.current;
    if (!current || simulation?.status !== 'running' || !active) return;
    const timer = setInterval(() => {
      if (session.current === current) publish(current, current.tick());
    }, 250);
    return () => clearInterval(timer);
  }, [simulation?.status, active, publish]);

  const blocked = reader !== false || manualReader;
  const route = response.routes.find((option) => option.id === selected) ?? response.routes.find((option) => option.id === response.recommendation.routeId)!;
  const parts = speechText(route, response);
  function playPlan() {
    if (blocked || !active || !owner.current) return;
    end('route_changed'); syncEnvironment();
    void owner.current.play(parts);
  }
  function start() {
    if (response.mode !== 'synthetic' || response.navigationEligibility !== 'preview_only' || !active || session.current || !owner.current) return;
    const current = new SimulationSession(response, route.id, () => performance.now(), owner.current, 16,
      { announce: (message, interrupt) => announce(message, { interrupt }) });
    session.current = current; setEnded(false); setEvents([]);
    current.setReader(environment.current.manual ? true : environment.current.reader);
    current.setSpeechEnabled(voice);
    publish(current, current.start());
  }
  function control(action: 'pause' | 'resume' | 'repeat' | 'reset') {
    const current = session.current;
    if (!current) return;
    if (action === 'reset') setEvents([]);
    publish(current, current[action]());
  }
  return {
    selected: route.id, status, reader, manualReader, blocked, active, voice, simulation, text, events, ended, parts,
    select: (id: string) => { end('route_changed'); setSelected(id); setVoice(false); setEnded(false); syncEnvironment(); },
    toggleReader: () => {
      environment.current.manual = !environment.current.manual;
      setManualReader(environment.current.manual); syncEnvironment();
    },
    toggleVoice: () => { setVoice(!voice); session.current?.setSpeechEnabled(!voice); },
    playPlan,
    stopSpeech: () => {
      if (session.current) { session.current.setSpeechEnabled(false); setVoice(false); }
      owner.current?.stop();
    },
    start: () => {
      if (session.current?.state.status === 'ready') publish(session.current, session.current.start());
      else start();
    },
    control,
    end: () => { end('unmounted'); syncEnvironment(); },
  };
}
