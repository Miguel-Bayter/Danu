// Health Score algorithm test — mirrors task.repository.ts getHealthScore logic

let pass = 0
let fail = 0

function test(name, result, expected) {
  if (result === expected) {
    console.log(`  ✓ ${name}`)
    pass++
  } else {
    console.log(`  ✗ ${name} — got "${result}", expected "${expected}"`)
    fail++
  }
}

function computeHealthScore(total, done, overdue) {
  if (total === 0) return null
  const completionRate = (done / total) * 100
  const overduePenalty = (overdue / total) * 30
  return Math.round(Math.max(0, Math.min(100, completionRate - overduePenalty)))
}

function healthLabel(score) {
  if (score >= 75) return 'excellent'
  if (score >= 50) return 'good'
  if (score >= 25) return 'atRisk'
  return 'critical'
}

console.log('\nHealth Score algorithm:')
test('no tasks → null', computeHealthScore(0, 0, 0), null)
test('100% done, 0 overdue → 100', computeHealthScore(10, 10, 0), 100)
test('0% done, 0 overdue → 0', computeHealthScore(10, 0, 0), 0)
test('50% done, 0 overdue → 50', computeHealthScore(10, 5, 0), 50)
test('80% done, 0 overdue → 80', computeHealthScore(10, 8, 0), 80)
test('50% done, 10/10 overdue → 50 - 30 = 20', computeHealthScore(10, 5, 10), 20)
test('80% done, 3/10 overdue → 80 - 9 = 71', computeHealthScore(10, 8, 3), 71)
test('90% done, 0 overdue → 90', computeHealthScore(10, 9, 0), 90)

console.log('\nHealth Score thresholds:')
test('score 100 → excellent', healthLabel(100), 'excellent')
test('score 75 → excellent', healthLabel(75), 'excellent')
test('score 74 → good', healthLabel(74), 'good')
test('score 50 → good', healthLabel(50), 'good')
test('score 49 → atRisk', healthLabel(49), 'atRisk')
test('score 25 → atRisk', healthLabel(25), 'atRisk')
test('score 24 → critical', healthLabel(24), 'critical')
test('score 0 → critical', healthLabel(0), 'critical')

console.log('\nNotification creation rules:')
// Rule: notify assignee only when assigneeId != creatorId
function shouldNotify(assigneeId, creatorId) {
  return Boolean(assigneeId && assigneeId !== creatorId)
}
test('assignee == creator → no notify', shouldNotify('user-1', 'user-1'), false)
test('assignee != creator → notify', shouldNotify('user-2', 'user-1'), true)
test('no assignee → no notify', shouldNotify(null, 'user-1'), false)
test('assignee changed on update → notify', shouldNotify('user-3', 'user-1'), true)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
