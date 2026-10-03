import { expect, test } from '@playwright/test';
import { createRouteResponse, routeScenarios } from '@krok/contracts/fixtures';
import { SimulationController } from '../src/features/simulation/controller';
import { InvalidSimulationPlan, prepareSimulation } from '../src/features/simulation/plan';

function clock() {
  let time = 0;
  return { now: () => time, set: (next: number) => { time = next; } };
}
function setup(routeId = 'A', rate = 1) {
  const timer = clock();
  return { timer, controller: new SimulationController(createRouteResponse(), routeId, timer.now, rate) };
}

test('timeline obeys contract ordering at tied offsets and namespaces identical IDs', () => {
  const response = createRouteResponse();
  const route = response.routes[0]!;
  route.events[0]!.offsetM = 0;
  route.events[1]!.offsetM = 0;
  route.events[0]!.id = route.steps[0]!.id;
  route.events[2]!.offsetM = route.metrics.distanceM;
  const plan = prepareSimulation(response, route.id);
  expect(plan.items.map((item) => item.kind === 'step' ? item.step.instructionKey : item.crossing.objectId)).toEqual([
    'route.start', route.events[0]!.objectId, route.events[1]!.objectId,
    'route.follow_segment', route.events[2]!.objectId, 'route.arrive',
  ]);
  expect(new Set(plan.items.map((item) => item.key)).size).toBe(plan.items.length);
});

test('pins an independent immutable response including facts, provenance and versions', () => {
  const response = createRouteResponse();
  const plan = prepareSimulation(response, 'A');
  const serialized = JSON.stringify(plan.response);
  response.dataContext.graphVersion = 'changed';
  response.routes[0]!.events[0]!.offsetM = 42;
  response.evidenceCatalog[0]!.fetchedAt = '2027-01-01T00:00:00Z';
  expect(JSON.stringify(plan.response)).toBe(serialized);
  expect(Object.isFrozen(plan.response.evidenceCatalog[0])).toBe(true);
  expect(Reflect.set(plan.items[0]!, 'offsetM', 50)).toBe(false);
  expect(Reflect.set(plan.response.dataContext, 'graphVersion', 'tampered')).toBe(false);
});

test('rejects untrusted input, absent route, unsupported mode and field eligibility', () => {
  const response = createRouteResponse();
  for (const value of [null, {}, { ...response, schemaVersion: 'future' }, { ...response, routes: [] },
    { ...response, mode: 'pilot' }, { ...response, navigationEligibility: 'foreground_experimental' }]) {
    expect(() => prepareSimulation(value, 'A')).toThrow(InvalidSimulationPlan);
  }
  expect(() => prepareSimulation(response, 'missing')).toThrow(InvalidSimulationPlan);
  for (const rate of [NaN, Infinity, 0, -1, 17]) expect(() => new SimulationController(response, 'A', () => 0, rate)).toThrow(RangeError);
});

test('one large tick emits every crossed item once and completes at exact route distance', () => {
  const { controller, timer } = setup();
  const first = controller.start();
  expect(first.state.mode).toBe('simulation');
  expect(first.state.navigationEligibility).toBe('preview_only');
  expect(first.emissions).toHaveLength(2);
  expect(controller.start().emissions).toEqual([]);
  timer.set(1_000_000);
  const final = controller.tick();
  expect(final.state.status).toBe('completed');
  expect(final.state.positionM).toBe(740);
  expect([...first.emissions, ...final.emissions].map(({ item }) => item.key)).toEqual(controller.plan.items.map((item) => item.key));
  expect(final.cancelSpeech).toBe(false); // Allow the final emitted description to finish.
  expect(controller.isCurrent(final.token)).toBe(true);
  expect(controller.tick().emissions).toEqual([]);
  expect(controller.start().emissions).toEqual([]);
});

test('fine and coarse tick schedules yield identical position and event sequence', () => {
  const fine = setup(); const coarse = setup();
  const fineEvents = fine.controller.start().emissions.map(({ item }) => item.key);
  const coarseEvents = coarse.controller.start().emissions.map(({ item }) => item.key);
  for (let time = 1; time <= 251_000; time += 997) {
    fine.timer.set(time); fineEvents.push(...fine.controller.tick().emissions.map(({ item }) => item.key));
  }
  fine.timer.set(251_000); fineEvents.push(...fine.controller.tick().emissions.map(({ item }) => item.key));
  coarse.timer.set(251_000); coarseEvents.push(...coarse.controller.tick().emissions.map(({ item }) => item.key));
  expect(fine.controller.state.positionM).toBe(coarse.controller.state.positionM);
  expect(fineEvents).toEqual(coarseEvents);
  expect(new Set(fineEvents).size).toBe(fineEvents.length);
});

test('pause cancels old callbacks and resume excludes paused time without repeating events', () => {
  const { controller, timer } = setup();
  const start = controller.start();
  timer.set(100_000); controller.tick();
  const paused = controller.pause();
  expect(paused.state.positionM).toBe(120);
  expect(paused.cancelSpeech).toBe(true);
  expect(controller.isCurrent(start.token)).toBe(false);
  timer.set(500_000);
  expect(controller.tick().emissions).toEqual([]);
  expect(controller.resume().emissions).toEqual([]);
  timer.set(510_000);
  expect(controller.tick().state.positionM).toBe(132);
});

test('background stops progress and speech; foreground alone does not resume', () => {
  const { controller, timer } = setup();
  const token = controller.start().token;
  timer.set(10_000); controller.tick();
  const hidden = controller.setActive(false);
  expect(hidden.state).toMatchObject({ status: 'paused', active: false, pauseReason: 'background', positionM: 12 });
  expect(hidden.cancelSpeech).toBe(true);
  expect(controller.isCurrent(token)).toBe(false);
  timer.set(1_000_000);
  expect(controller.resume().state.status).toBe('paused');
  expect(controller.repeat().emissions).toEqual([]);
  expect(controller.setActive(true).state.status).toBe('paused');
  expect(controller.tick().state.positionM).toBe(12);
  controller.resume(); timer.set(1_010_000);
  expect(controller.tick().state.positionM).toBe(24);
});

test('a session loaded while hidden cannot start or auto-start on foreground', () => {
  const { controller } = setup();
  controller.setActive(false);
  expect(controller.start().state.status).toBe('ready');
  expect(controller.setActive(true).emissions).toEqual([]);
  expect(controller.state.status).toBe('ready');
  expect(controller.start().emissions).toHaveLength(2);
});

test('explicit repeat is valid while paused, does not move cursor, and can be stopped', () => {
  const { controller, timer } = setup();
  expect(controller.repeat().emissions).toEqual([]);
  controller.start(); timer.set(100_000);
  const crossed = controller.tick().emissions.at(-1)!.item;
  controller.pause();
  const repeat = controller.repeat();
  expect(repeat.emissions).toEqual([{ item: crossed, reason: 'repeat' }]);
  expect(repeat.state).toMatchObject({ status: 'paused', positionM: 120 });
  expect(controller.isCurrent(repeat.token)).toBe(true);
  expect(controller.pause().cancelSpeech).toBe(true);
  expect(controller.isCurrent(repeat.token)).toBe(false);
  expect(controller.resume().emissions).toEqual([]);
  timer.set(200_000);
  expect(controller.tick().emissions.map(({ item }) => item.offsetM)).toEqual([200]);
});

test('reset explicitly enables replay from zero and invalidates previous tokens', () => {
  const { controller, timer } = setup();
  controller.start(); timer.set(1_000_000);
  const completed = controller.tick();
  const reset = controller.reset();
  expect(reset.state).toMatchObject({ status: 'ready', positionM: 0, lastItem: null });
  expect(reset.cancelSpeech).toBe(true);
  expect(controller.isCurrent(completed.token)).toBe(false);
  const replay = controller.start();
  expect(replay.emissions).toHaveLength(2);
  expect(replay.emissions.every(({ item }) => item.offsetM === 0)).toBe(true);
});

test('route/data changes and unmount permanently invalidate the old session', () => {
  for (const reason of ['route_changed', 'data_changed', 'unmounted'] as const) {
    const { controller, timer } = setup();
    const token = controller.start().token;
    const invalid = controller.invalidate(reason);
    expect(invalid.cancelSpeech).toBe(true);
    expect(invalid.state.invalidationReason).toBe(reason);
    timer.set(1_000_000);
    for (const transition of [controller.start(), controller.resume(), controller.reset(), controller.tick(), controller.repeat(), controller.setActive(true)]) {
      expect(transition.state.status).toBe('invalidated'); expect(transition.emissions).toEqual([]);
    }
    expect(controller.isCurrent(token)).toBe(false);
  }
});

test('tokens cannot be reused across instances with identical route and generation', () => {
  const old = setup(); const next = setup();
  const oldToken = old.controller.start().token;
  const newToken = next.controller.start().token;
  expect(oldToken.generation).toBe(newToken.generation);
  expect(next.controller.isCurrent(oldToken)).toBe(false);
  expect(next.controller.isCurrent(newToken)).toBe(true);
  expect(next.controller.isCurrent({ ...newToken })).toBe(false);
});

test('bad, backwards or throwing clocks pause without progress or new events', () => {
  for (const bad of [-1, NaN, Infinity, 99]) {
    const { controller, timer } = setup();
    timer.set(100); const token = controller.start().token;
    timer.set(bad); const result = controller.tick();
    expect(result.state).toMatchObject({ status: 'paused', pauseReason: 'clock_invalid', positionM: 0 });
    expect(result.emissions).toEqual([]); expect(result.cancelSpeech).toBe(true);
    expect(controller.isCurrent(token)).toBe(false);
    timer.set(100); expect(controller.resume().state.status).toBe('running');
  }
  const throwing = new SimulationController(createRouteResponse(), 'A', () => { throw new Error('Clock failed'); });
  expect(throwing.start().state.pauseReason).toBe('clock_invalid');
});

test('playback rate scales replay only, without changing DTO metrics or timestamp', () => {
  const { controller, timer } = setup('B', 4);
  const before = JSON.stringify(controller.plan.response);
  controller.start(); timer.set(10_000);
  expect(controller.tick().state.positionM).toBe(48);
  expect(JSON.stringify(controller.plan.response)).toBe(before);
});

test('all shared scenarios replay without losing conflicts, unknowns or stale facts', () => {
  for (const scenario of routeScenarios) for (const route of scenario.response.routes) {
    const timer = clock(); const controller = new SimulationController(scenario.response, route.id, timer.now);
    const emitted = [...controller.start().emissions];
    timer.set(10_000_000); emitted.push(...controller.tick().emissions);
    expect(emitted.map(({ item }) => item.key)).toEqual(controller.plan.items.map((item) => item.key));
    const crossings = emitted.flatMap(({ item }) => item.kind === 'crossing' ? [item.crossing] : []);
    expect(crossings).toEqual(route.events);
    expect(controller.plan.response.evidenceCatalog).toEqual(scenario.response.evidenceCatalog);
    expect(controller.state.status).toBe('completed');
  }
});
