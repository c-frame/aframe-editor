import { Command } from '../command.js';
import { commandsByType } from './index.js';

/**
 * @param editor Editor
 * @param commands
 * @param callback Optional callback to call after all commands are executed,
 *                 get as argument the created entity or null if last command is entityremove.
 * @constructor
 */
export class MultiCommand extends Command {
  constructor(editor, jsonCommands = null, callback = undefined) {
    super(editor);

    this.type = 'multi';
    this.name = 'Multiple changes';
    this.updatable = false;
    this.callback = callback;
    if (jsonCommands !== null) {
      this.jsonCommands = jsonCommands;
      this.commands = this.createCommands(jsonCommands);
    }
  }

  createCommands(jsonCommands) {
    return jsonCommands
      .map((cmdTuple) => {
        const Cmd = commandsByType.get(cmdTuple[0]);
        if (!Cmd) {
          console.error(`Command ${cmdTuple[0]} not found`);
          return null;
        }
        const command = new Cmd(this.editor, cmdTuple[1], cmdTuple[2]);
        return command;
      })
      .filter(Boolean);
  }

  execute() {
    const run = this.commands
      .toReversed()
      .reduce((nextCommandCallback, command) => {
        return (entityIgnored) => {
          return command.execute(nextCommandCallback);
        };
      }, this.callback); // latest callback uses the entity as parameter
    return run();
  }

  undo() {
    const run = this.commands.reduce((nextCommandCallback, command) => {
      return (entityIgnored) => {
        return command.undo(nextCommandCallback);
      };
    }, this.callback); // latest callback uses the entity as parameter
    return run();
  }

  toJSON() {
    const output = super.toJSON(this);
    output.commands = this.jsonCommands;
    return output;
  }

  fromJSON(json) {
    super.fromJSON(json);
    this.commands = this.createCommands(json.commands);
  }
}
