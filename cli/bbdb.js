#! /usr/bin/env node

import { listDatabases, addDatabase } from './actions.js';

// Command handlers
const commandHandlers = {
  'list': {
    description: 'List all defined databases',
    usage: 'bbdb',
    action: async () => {
      await listDatabases();
    }
  },
  'new-db': {
    description: 'Add a new database definition',
    usage: 'bbdb new-db <database-name>',
    action: async (args) => {
      if (args.length !== 1) {
        console.error(`Usage: ${commandHandlers['new-db'].usage}`);
        return;
      }
      const dbName = args[0];
      await addDatabase(dbName);
    }
  },
  // Future commands can easily be added here.
  
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default action or help message
    if ('list' in commandHandlers) {
      await commandHandlers['list'].action();
    } else {
      console.log('No default action specified. Please provide a command.');
    }
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  if (command in commandHandlers) {
    await commandHandlers[command].action(commandArgs);
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('Available commands:');
    for (const cmd in commandHandlers) {
      console.log(`- ${cmd}: ${commandHandlers[cmd].description}`);
      console.log(`  Usage: ${commandHandlers[cmd].usage}`);
    }
  }
};

main();