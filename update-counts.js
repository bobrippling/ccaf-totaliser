#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage:');
  console.log('  update-counts --add-attempt  # bumps pendingTotal');
  console.log('  update-counts --add-pass     # decs pendingTotal, adds to passDates');
  console.log('  update-counts --add-fail     # decs pendingTotal, bumps failedTotal');
  process.exit(1);
}

function panic(msg) {
  throw new Error(`panic: ${msg}`);
}

const args = process.argv.slice(2);
if (args.length !== 1) usage();

const indexPath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const action = args[0];
switch (action) {
  case '--add-attempt': {
    // Increment pendingTotal
    const match = content.match(/const pendingTotal = (\d+);/);
    if (!match) panic("no match");

    const newValue = parseInt(match[1]) + 1;
    const newContent = content.replace(
      /const pendingTotal = \d+;/,
      `const pendingTotal = ${newValue};`
    );
    if (newContent === content) panic("failed to update pendingTotal");
    content = newContent;
    console.log(`pendingTotal++ -> ${newValue}`);
    break;
  }
  case '--add-pass': {
    // Decrement pendingTotal
    const pendMatch = content.match(/const pendingTotal = (\d+);/);
    if (!pendMatch) panic("no match");

    const newPending = Math.max(0, parseInt(pendMatch[1]) - 1);
    let newContent = content.replace(
      /const pendingTotal = \d+;/,
      `const pendingTotal = ${newPending};`
    );
    if (newContent === content) panic("failed to update pendingTotal");
    content = newContent;

    const passDateRegex = /const passDates = \[([\s\S]*?)\];/;
    const match = content.match(passDateRegex);
    if (!match) panic("no match");

    const today = new Date().toISOString().split('T')[0];
    const currentDates = match[1].trim();
    const newDates = currentDates + `,\n            "${today}"`;
    newContent = content.replace(passDateRegex, `const passDates = [${newDates},\n        ];`);
    if (newContent === content) panic("failed to update passDates");
    content = newContent;

    console.log(`pendingTotal-- -> ${newPending}`);
    console.log(`${today} -> pass dates`);
    break;
  }
  case '--add-fail': {
    // Decrement pendingTotal
    const pendMatch = content.match(/const pendingTotal = (\d+);/);
    if (!pendMatch) panic("no match");

    const newPending = Math.max(0, parseInt(pendMatch[1]) - 1);
    let newContent = content.replace(
      /const pendingTotal = \d+;/,
      `const pendingTotal = ${newPending};`
    );
    if (newContent === content) panic("failed to update pendingTotal");
    content = newContent;

    const failMatch = content.match(/const failedTotal = (\d+);/);
    if (!failMatch) panic("no match");

    const newFailed = parseInt(failMatch[1]) + 1;
    newContent = content.replace(
      /const failedTotal = \d+;/,
      `const failedTotal = ${newFailed};`
    );
    if (newContent === content) panic("failed to update failedTotal");
    content = newContent;

    console.log(`pendingTotal-- -> ${newPending}`);
    console.log(`failedTotal++  -> ${newFailed}`);
    break;
  }
  default:
    usage();
}

// Update og:description
function updateOgDescription(content) {
  // Extract passDates count
  const passDateRegex = /const passDates = \[([\s\S]*?)\];/;
  const passMatch = content.match(passDateRegex);
  if (!passMatch) panic("no match");
  const dates = passMatch[1].match(/"[\d-]+"/g)
  if (!dates) panic("no match");
  const passedCount = dates.length;

  const failMatch = content.match(/const failedTotal = (\d+);/);
  if(!failMatch?.[1]) panic("no match");
  const failedCount = parseInt(failMatch[1]);

  // Extract pendingTotal
  const pendMatch = content.match(/const pendingTotal = (\d+);/);
  if(!pendMatch?.[1]) panic("no match");
  const pendingCount = parseInt(pendMatch[1]);

  const attemptedCount = passedCount + failedCount;

  const newContent = content.replace(
    /content="CCA-F exam results: \d+\/\d+ passed, \d+ pending"/,
    `content="CCA-F exam results: ${passedCount}/${attemptedCount} passed, ${pendingCount} pending"`
  );

  if (newContent === content) panic("failed to update og:description");
  return newContent;
}

content = updateOgDescription(content);

fs.writeFileSync(indexPath, content, 'utf8');
