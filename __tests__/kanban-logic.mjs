const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

function resolveTargetStatus(overId, localTasks) {
  if (STATUS_ORDER.includes(overId)) return overId;
  const overTask = localTasks.find(t => t.id === overId);
  if (!overTask) return null;
  return overTask.status;
}

const tasks = [
  { id: 'task-1', status: 'TODO' },
  { id: 'task-2', status: 'IN_PROGRESS' },
  { id: 'task-3', status: 'DONE' },
];

let pass = 0;
let fail = 0;

function test(name, result, expected) {
  if (result === expected) {
    console.log(`  ✓ ${name}`);
    pass++;
  } else {
    console.log(`  ✗ ${name} — got "${result}", expected "${expected}"`);
    fail++;
  }
}

console.log('\nKanban drag logic:');
test('drag onto IN_PROGRESS column', resolveTargetStatus('IN_PROGRESS', tasks), 'IN_PROGRESS');
test('drag onto DONE column', resolveTargetStatus('DONE', tasks), 'DONE');
test('drag onto TODO column (empty)', resolveTargetStatus('TODO', tasks), 'TODO');
test('drag onto task-2 → inherits IN_PROGRESS', resolveTargetStatus('task-2', tasks), 'IN_PROGRESS');
test('drag onto task-3 → inherits DONE', resolveTargetStatus('task-3', tasks), 'DONE');
test('drag onto unknown id → null (ignored)', resolveTargetStatus('unknown-id', tasks), null);

console.log('\nOptimistic update + same-column guard:');
const sourceTask = tasks.find(t => t.id === 'task-1'); // status: TODO
const targetSameCol = resolveTargetStatus('TODO', tasks);
test('same column → no-op', !sourceTask || sourceTask.status === targetSameCol, true);
const targetDiff = resolveTargetStatus('DONE', tasks);
test('different column → triggers update', sourceTask.status !== targetDiff, true);

console.log('\nOptimistic rollback:');
let state = [...tasks];
// simulate move
state = state.map(t => t.id === 'task-1' ? { ...t, status: 'DONE' } : t);
test('after optimistic move task-1 is DONE', state.find(t => t.id === 'task-1').status, 'DONE');
// simulate rollback
state = state.map(t => t.id === 'task-1' ? { ...t, status: sourceTask.status } : t);
test('after rollback task-1 is back to TODO', state.find(t => t.id === 'task-1').status, 'TODO');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
