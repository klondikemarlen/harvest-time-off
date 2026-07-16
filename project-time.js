import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"

const HOUR_MS = 60 * 60 * 1000

export function defaultProjectTimeLogPath() {
  return path.join(homedir(), ".omp", "project-time", "time-log.json")
}

export function parseProjectTimeMappings(value) {
  const mappings = typeof value === "string" ? JSON.parse(value || "{}") : value
  if (typeof mappings !== "object" || mappings === null || Array.isArray(mappings)) {
    throw new Error("projectTimeMappings must be a JSON object")
  }

  return new Map(Object.entries(mappings).map(([project, mapping]) => {
    if (
      typeof mapping !== "object" ||
      mapping === null ||
      Array.isArray(mapping) ||
      typeof mapping.project !== "string" ||
      mapping.project.length === 0 ||
      typeof mapping.task !== "string" ||
      mapping.task.length === 0
    ) {
      throw new Error(`projectTimeMappings.${project} requires project and task names`)
    }
    return [project, mapping]
  }))
}

export function projectTimeEntries(state, mappings, { from, to }) {
  if (!state || !Array.isArray(state.entries)) {
    throw new Error("OMP Project Time log is missing an entries array")
  }

  const grouped = new Map()
  let unmapped = 0

  for (const session of state.entries) {
    const mapping = mappings.get(session.project)
    if (!mapping) {
      unmapped += 1
      continue
    }
    if (!Number.isFinite(session.startAtMs) || !Number.isFinite(session.endAtMs) || session.startAtMs >= session.endAtMs) {
      throw new Error("OMP Project Time log contains an invalid session interval")
    }

    let cursor = session.startAtMs
    while (cursor < session.endAtMs) {
      const date = new Date(cursor)
      const spentDate = localDate(date)
      const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
      const segmentEnd = Math.min(session.endAtMs, nextDay)

      if (spentDate >= from && spentDate <= to) {
        const key = [spentDate, mapping.project, mapping.task, session.project, session.repositoryId].join("\u0000")
        const entry = grouped.get(key) ?? {
          spentDate,
          project: mapping.project,
          task: mapping.task,
          notes: `OMP Project Time: ${session.project} (${session.repositoryId})`,
          milliseconds: 0,
        }
        entry.milliseconds += segmentEnd - cursor
        grouped.set(key, entry)
      }
      cursor = segmentEnd
    }
  }

  return {
    entries: [...grouped.values()]
      .map(entry => ({ ...entry, hours: Math.round((entry.milliseconds / HOUR_MS) * 100) / 100 }))
      .filter(entry => entry.hours > 0)
      .sort((left, right) => left.spentDate.localeCompare(right.spentDate) || left.notes.localeCompare(right.notes)),
    unmapped,
  }
}

export async function loadProjectTimeEntries({ from, to, mappings, logPath = defaultProjectTimeLogPath(), read = readFile }) {
  const state = JSON.parse(await read(logPath, "utf8"))
  return projectTimeEntries(state, mappings, { from, to })
}

function localDate(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(value => String(value).padStart(2, "0")).join("-")
}
