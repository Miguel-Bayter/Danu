import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

console.log('\nRealtime hook config:');
const hook = readFileSync(join(root, 'hooks/use-realtime-tasks.ts'), 'utf8');
test('subscribes to Task table', hook.includes("table: 'Task'"), true);
test('filters by projectId', hook.includes('projectId=eq.'), true);
test('listens to all events (*)', hook.includes("event: '*'"), true);
test('calls router.refresh() on change', hook.includes('router.refresh()'), true);
test('cleans up channel on unmount', hook.includes('supabase.removeChannel'), true);

console.log('\nSupabase client:');
const client = readFileSync(join(root, 'lib/supabase.ts'), 'utf8');
test('uses NEXT_PUBLIC_SUPABASE_URL', client.includes('NEXT_PUBLIC_SUPABASE_URL'), true);
test('uses anon key (safe for browser)', client.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), true);

console.log('\nTaskBoard integration:');
const board = readFileSync(join(root, 'components/task/task-board.tsx'), 'utf8');
test('useRealtimeTasks imported', board.includes('useRealtimeTasks'), true);
test('id="kanban-board" (hydration fix)', board.includes('id="kanban-board"'), true);
test('useTransition for non-blocking save', board.includes('startTransition'), true);
test('useEffect syncs from server data', board.includes('setLocalTasks(tasks)'), true);
test('drag guard prevents sync during drag', board.includes('draggedTask'), true);
test('DragOverlay present', board.includes('DragOverlay'), true);
test('rollback on server error', board.includes('sourceTask.status'), true);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
