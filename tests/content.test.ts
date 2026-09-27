import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { C } from '../src/engine/registry'
import { formatProblems, validateContent } from './validate'

describe('content', () => {
  it('has no broken references', () => {
    const problems = validateContent(C)
    const filter = process.env.CONTENT_FILTER
    const reportPath = process.env.CONTENT_REPORT
    if (reportPath) writeFileSync(reportPath, JSON.stringify(problems, null, 2))
    const report = formatProblems(problems, filter)
    const relevant = filter ? problems.filter(p => p.file.includes(filter) || p.where.includes(filter)) : problems
    if (relevant.length) console.log(report)
    expect(relevant.filter(p => p.severity === 'error')).toEqual([])
  })
})
