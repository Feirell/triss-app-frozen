export abstract class Operator<From, To> {
  FROM!: From;
  TO!: To;

  abstract process(data: From): To;
}
