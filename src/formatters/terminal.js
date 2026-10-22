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
      lines.push(bold(`    ${persona.title}`) + dim(` — ${persona.role}`));
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
      head: ['Role', 'Title'],
      style: { head: ['cyan'], border: ['gray'] },
      colWidths: [22, 30],
    });

    result.buyingCommittee.forEach(m => {
      table.push([m.role, m.title]);
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
  lines.push(accent.bold(`  ${persona.title}`));
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
/**
 * Format the account's ICP (the get_icp_profile tool) for terminal. People are shown by title and
 * role only, never by name.
 */
export function formatAccountICP(profile) {
  const lines = [];
  const list = (label, items, style = accent) => {
    if (!items?.length) return;
    lines.push('  ' + style(label));
    items.forEach((x) => lines.push('    ' + dim('•') + ' ' + x));
    lines.push('');
  };

  lines.push('');
  lines.push(accent.bold('  ANDRU') + chalk.green(' [Your ICP]'));
  lines.push(dim('  ─────────────────────────────────────────'));
  lines.push('');

  if (profile.product?.description) {
    lines.push(bold('  Product: ') + profile.product.description);
    lines.push('');
  }

  const company = profile.layer1?.companyIntelligence || {};
  for (const [label, value] of [['Industry', company.industry], ['Company size', company.companySize], ['Geography', company.geography]]) {
    if (value) lines.push(bold(`  ${label}: `) + value);
  }
  if (company.industry || company.companySize || company.geography) lines.push('');
  list('Pain Triggers', company.painTriggers, warn);
  list('Timing Signals', company.timingSignals);

  for (const persona of profile.layer2?.personas || []) {
    lines.push(bold(`  ${persona.title}`));
    if (persona.dayInTheLife) lines.push(dim('  ' + persona.dayInTheLife));
    lines.push('');
    list('Success Metrics:', persona.successMetrics);
  }

  const committee = profile.layer2?.buyingCommittee || [];
  if (committee.length) {
    lines.push(accent('  Buying Committee'));
    const table = new Table({ head: ['Role', 'Title'], style: { head: ['cyan'] } });
    committee.forEach((m) => table.push([m.role || '', m.title || '']));
    lines.push(table.toString());
    lines.push('');
  }

  for (const m of profile.layer3?.messaging || []) {
    if (m.coreMessage) {
      lines.push('  ' + accent(`Message for ${m.persona}: `) + m.coreMessage);
      lines.push('');
    }
  }

  lines.push(dim('  Powered by Andru — andru-ai.com'));
  lines.push('');

  return lines.join('\n');
}
