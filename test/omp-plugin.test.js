import assert from "node:assert/strict"
import test from "node:test"

import { createTimeOffTool, timeOffArguments } from "../index.js"

const schema = () => ({
  regex() { return this },
  min() { return this },
  positive() { return this },
  finite() { return this },
  optional() { return this },
})
const z = {
  string: schema,
  number: schema,
  boolean: schema,
  object: shape => shape,
}

test("builds a safe CLI argument vector", () => {
  assert.deepEqual(
    timeOffArguments({
      from: "2026-07-17",
      to: "2026-07-20",
      project: "Time Off - Marlen",
      task: "Vacation / PTO",
      hours: 7.5,
      notes: "Vacation",
      includeWeekends: true,
      dryRun: true,
    }),
    [
      "2026-07-17", "2026-07-20", "--project", "Time Off - Marlen", "--task", "Vacation / PTO",
      "--hours", "7.5", "--notes", "Vacation", "--include-weekends", "--dry-run",
    ],
  )
})

test("registers an approval-gated OMP write tool", async () => {
  const calls = []
  const tool = createTimeOffTool(z, {
    command: "harvest-time-off",
    run: async (...args) => {
      calls.push(args)
      return { code: 0, stdout: "Created 2026-07-17", stderr: "" }
    },
  })

  const result = await tool.execute(
    "call-1",
    { from: "2026-07-17", to: "2026-07-17", project: "Time Off - Marlen", task: "Vacation / PTO" },
    undefined,
    undefined,
    { cwd: "/tmp" },
  )

  assert.equal(tool.approval, "write")
  assert.deepEqual(calls, [[
    "harvest-time-off",
    ["2026-07-17", "2026-07-17", "--project", "Time Off - Marlen", "--task", "Vacation / PTO", "--hours", "8"],
    { cwd: "/tmp", signal: undefined },
  ]])
  assert.equal(result.content[0].text, "Created 2026-07-17")
})
