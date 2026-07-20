#!/usr/bin/env node
import assert from "node:assert/strict"
import { homedir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

const moduleUrl = pathToFileURL(path.join(homedir(), ".omp/plugins/node_modules/harvest-worklog/index.js"))
const { default: register } = await import(moduleUrl)
const schema = () => ({
  regex() { return this }, min() { return this }, trim() { return this }, int() { return this },
  positive() { return this }, finite() { return this }, optional() { return this },
})
const z = {
  string: schema, number: schema, boolean: schema, array: schema,
  object: shape => ({ shape, refine() { return this } }),
}
const commands = []
const messages = []
register({
  zod: { z },
  setLabel() {},
  registerTool() {},
  registerCommand(name, command) { commands.push({ name, command }) },
  sendMessage(message) { messages.push(message) },
}, {
  loadProjectTimeTransform: async () => ({
    groups: [
      { sourceKind: "human_active", milliseconds: 24_040_000 },
      { sourceKind: "agent_turn_elapsed", milliseconds: 1_789_000 },
    ],
  }),
})

const command = commands.find(entry => entry.name === "harvest-worklog")?.command
assert(command, "installed plugin did not register /harvest-worklog")
await command.handler("timesheet 2026-07-20 --project wrap", { cwd: process.cwd(), ui: { notify() {} } })
assert.equal(messages[0]?.content, "wrap · Mon, Jul 20\n\nHuman active · 6h 40m 40s\nAgent elapsed · 29m 49s")
console.log("Installed slash-command smoke passed.")
