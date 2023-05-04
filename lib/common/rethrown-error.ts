// https://stackoverflow.com/a/42755876
export class RethrownError extends Error {
  public readonly originalError: Error;
  public readonly stackBeforeRethrow: string | undefined;

  constructor(message: string, error: Error){
    super(message);
    this.name = this.constructor.name;
    if (!error)
        throw new Error('RethrownError requires a message and error');
    
    this.originalError = error;
    this.stackBeforeRethrow = this.stack;
    const messageLines =  (this.message.match(/\n/g)||[]).length + 1;
    this.stack = (this.stack ?? '').split('\n').slice(0, messageLines + 1).join('\n') + '\n' +
                 error.stack
  }
}