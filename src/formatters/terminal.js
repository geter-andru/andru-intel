/**
 * Terminal Formatter
 *
 * Rich terminal output for ICP and persona data.
 */

import chalk from 'chalk';
import Table from 'cli-table3';

const accent = chalk.hex('#3B82F6');
const dim = chalk.gray;
const bold = chalk.bold;
const warn = chalk.yellow;

/**
 * Format ICP score result for terminal.
 */
export function formatICP(result) {
  const lines = [];

  lines.push('');
  lines.push(accent.bold('  ANDRU'));
  lines.push(dim('  ─────────────────────────────────────────'));
  lines.push('');

  // Product
  lines.push(bold('  Product: ') + result.product);
  lines.push(bold('  Vertical: ') + result.vertical);
  if (result.segment) {
    lines.push(bold('  Matched Segment: ') + result.segment);
  }
  lines.push('');

  // Pain triggers
  if (result.painTriggers?.length) {
    lines.push(accent('  Pain Triggers'));
    result.painTriggers.forEach(t => lines.push('    ' + dim('•') + ' ' + t));
    lines.push('');
  }

  // Personas
  if (result.personas?.length) {
    lines.push(accent('  Target Personas'));
    lines.push('');

    result.personas.forEach(persona => {
      lines.push(bold(`    ${persona.title}`) + dim(` (${persona.name}) — ${persona.role}`));
      lines.push(dim('    ' + persona.dayInTheLife));
      lines.push('');

      if (persona.successMetrics?.length) {
        lines.push('    ' + accent('Success Metrics:'));
        persona.successMetrics.forEach(m => lines.push('      ' + dim('•') + ' ' + m));
      }

      if (persona.concerns?.length) {
        lines.push('    ' + warn('Concerns:'));
        persona.concerns.forEach(c => lines.push('      ' + dim('•') + ' ' + c));
      }

      if (persona.topQuestion) {
        lines.push('    ' + dim('Top question: ') + chalk.italic('"' + persona.topQuestion + '"'));
      }

      lines.push('');
    });
  }

  // Buying committee
  if (result.buyingCommittee?.length) {
    lines.push(accent('  Buying Committee'));

    const table = new Table({
      head: ['Role', 'Title', 'Name'],
      style: { head: ['cyan'], border: ['gray'] },
      colWidths: [22, 30, 12],
    });

    result.buyingCommittee.forEach(m => {
      table.push([m.role, m.title, m.name]);
    });

    lines.push(table.toString());
    lines.push('');
  }

  lines.push(dim('  Source: ' + result.source));
  lines.push(dim('  Powered by Andru — andru-ai.com'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Format a single persona for terminal.
 */
export function formatPersona(persona) {
  const lines = [];

  lines.push('');
  lines.push(accent.bold(`  ${persona.title}`) + dim(` (${persona.firstName})`));
  lines.push(dim('  ─────────────────────────────────────────'));
  lines.push('');

  lines.push(bold('  Background: ') + persona.demographics.background);
  lines.push(bold('  Age Range: ') + persona.demographics.typicalAge);
  lines.push(bold('  Decision Power: ') + persona.authority.decisionPower.replace('_', ' '));
  lines.push(bold('  Budget Control: ') + persona.authority.budgetControl);
  lines.push('');

  lines.push(accent('  Day in the Life'));
  lines.push('  ' + persona.dayInTheLife);
  lines.push('');

  lines.push(accent('  Success Metrics'));
  persona.successMetrics.forEach(m => lines.push('    ' + dim('•') + ' ' + m));
  lines.push('');

  lines.push(warn('  Key Concerns'));
  persona.concerns.forEach(c => lines.push('    ' + dim('•') + ' ' + c));
  lines.push('');

  lines.push(accent('  Questions They\'ll Ask'));
  persona.typicalQuestions.forEach(q => lines.push('    ' + dim('→') + ' ' + chalk.italic(q)));
  lines.push('');

  lines.push(dim('  Powered by Andru — andru-ai.com'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Format AI-powered ICP result for terminal.
 */
export function formatAIICP(result) {
  const lines = [];

  lines.push('');
  lines.push(accent.bold('  ANDRU') + chalk.green(' [AI-Powered]'));
  lines.push(dim('  ─────────────────────────────────────────'));
  lines.push('');

  const data = result.data || result;

  if (data.refinedProductDescription) {
    lines.push(bold('  Product: ') + data.refinedProductDescription);
    lines.push('');
  }

  if (data.coreCapability) {
    lines.push(accent('  Core Capability'));
    lines.push('  ' + data.coreCapability);
    lines.push('');
  }

  if (data.personas?.length) {
    data.personas.forEach(persona => {
      lines.push(bold(`  ${persona.role || 'Buyer'}: ${persona.title}`));
      lines.push(dim('  ' + (persona.narrative || '')));
      lines.push('');

      if (persona.whyThisPersona) {
        lines.push('  ' + accent('Why: ') + persona.whyThisPersona);
        lines.push('');
      }

      if (persona.goals?.length) {
        lines.push('  ' + accent('Goals:'));
        persona.goals.forEach(g => lines.push('    ' + dim('•') + ' ' + g));
      }

      if (persona.painPoints?.length) {
        lines.push('  ' + warn('Pain Points:'));
        persona.painPoints.forEach(p => lines.push('    ' + dim('•') + ' ' + p));
      }

      if (persona.compellingEvents?.length) {
        lines.push('  ' + accent('Buying Signals:'));
        persona.compellingEvents.forEach(e => {
          lines.push('    ' + bold(e.event));
          lines.push('    ' + dim('Signal: ') + e.signal + dim(' — ') + e.why);
        });
      }

      lines.push('');
    });
  }

  if (result.metadata) {
    lines.push(dim(`  Model: ${result.metadata.model || 'AI'} | Duration: ${result.metadata.duration || '?'}ms`));
  }
  lines.push(dim('  Powered by Andru — andru-ai.com'));
  lines.push('');

  return lines.join('\n');
}
