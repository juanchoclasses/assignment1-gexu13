import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";



export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }

  /**
    * place holder for the evaluator.   I am not sure what the type of the formula is yet 
    * I do know that there will be a list of tokens so i will return the length of the array
    * 
    * I also need to test the error display in the front end so i will set the error message to
    * the error messages found In GlobalDefinitions.ts
    * 
    * according to this formula.
    * 
    7 tokens partial: "#ERR",
    8 tokens divideByZero: "#DIV/0!",
    9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
    * 
   */

  evaluate(formula: FormulaType) {

    // set the this._result to the length of the formula

    this._result = 0;
    this._errorMessage = ErrorMessages.emptyFormula;

    // if the formula is empty return 0
    if (formula.length === 0) {
      return;
    }
    this._errorMessage = "";


    // Define a stack for the results
    const resultStack: number[] = [];
    // Define a stack for the operators
    const operatorStack: string[] = [];

    // Define a dictionary for the operators and their precedence
    const precedence: { [key: string]: number } = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
    };

    // loop through the formula tokens
    for (const token of formula) {
      // if the token is a number push it on the result stack
      if (this.isNumber(token)) {
        resultStack.push(Number(token));
      } else if (this.isCellReference(token)) {
        // if the token is a cell reference get the value of the cell and push it on the result stack
        let [value, error] = this.getCellValue(token);
        if (error !== "") {
          this._errorOccured = true;
          this._errorMessage = error;
        } else {
          resultStack.push(Number(value));
        }
      } else if (token === '(') {
        // if the token is a left parenthesis push it on the operator stack
        operatorStack.push(token);
      }
      else if (token === ')') {
        // missing left parenthesis
        if (operatorStack.length === 0 
              || (operatorStack[operatorStack.length - 1] === '(' && resultStack.length === 0)) {
          this._result = 0;
          this._errorOccured = true;
          this._errorMessage = ErrorMessages.missingParentheses;
          return;
        }
        // if the token is a right parenthesis
        // while the operator stack is not empty and the top of the operator stack is not a left parenthesis
        // pop the top of the operator stack and push it on the result stack
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          const operator = operatorStack.pop() as string;
          const operand2 = resultStack.pop() as number;
          const operand1 = resultStack.pop() as number;
          const result = this.performOperation(operand1, operand2, operator);
          resultStack.push(result);
        }
        // if the operator stack is not empty and the top of the operator stack is a left parenthesis
        // pop the top of the operator stack
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === '(') {
          operatorStack.pop();
        } else {
          // if the operator stack is empty or the top of the operator stack is not a left parenthesis
          // set the error flag and error message
          this._errorOccured = true;
          this._errorMessage = ErrorMessages.missingParentheses;
          break;
        }
      }
      else {
        // if the token is an operator
        // while the operator stack is not empty and the top of the operator stack is not a left parenthesis
        // and the precedence of the token is less than or equal to the precedence of the top of the operator stack
        // pop the top of the operator stack and push it on the result stack
        // push the token on the operator stack
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "("
          && precedence[token] <= precedence[operatorStack[operatorStack.length - 1]]) {
          if (resultStack.length < 2) {
            this._errorOccured = true;
            this._errorMessage = ErrorMessages.invalidFormula;

            break;
          } else {
            const operator = operatorStack.pop() as string;
            const operand2 = resultStack.pop() as number;
            const operand1 = resultStack.pop() as number;
            const result = this.performOperation(operand1, operand2, operator);
            resultStack.push(result);
          }
        }
        operatorStack.push(token);
      }
    }


    // while the operator stack is not empty and the result stack has at least 2 operands
    // pop the top of the operator stack and push it on the result stack
    while (operatorStack.length > 0 && resultStack.length >= 2) {
      const operator = operatorStack.pop() as string;
      const operand2 = resultStack.pop() as number;
      const operand1 = resultStack.pop() as number;
      const result = this.performOperation(operand1, operand2, operator);
      resultStack.push(result);
    }

    
    if (resultStack.length === 1 && operatorStack.length === 0) {
      this._result = resultStack.pop() as number;
    }
    if (resultStack.length > 1 || operatorStack.length > 0) {
      this._result = resultStack.pop() as number;
      this._errorOccured = true;
      this._errorMessage = ErrorMessages.invalidFormula;
    }
  }


  /**
   * 
   * @param operand1  the first operand
   * @param operand2  the second operand
   * @param operator  the operator
   * @returns  the result of the operation
   */
  private performOperation(operand1: number, operand2: number, operator: string): number {
    switch (operator) {
      case '+':
        return operand1 + operand2;
      case '-':
        return operand1 - operand2;
      case '*':
        return operand1 * operand2;
      case '/':
        if (operand2 !== 0) {
          return operand1 / operand2;
        } else {
          this._errorOccured = true;
          this._errorMessage = ErrorMessages.divideByZero;
          return Infinity;
        }
      // this should never happen
      default:
        this._errorOccured = true;
        this._errorMessage = ErrorMessages.invalidOperator;
        return 0;
    }
  }

  public get error(): string {
    return this._errorMessage
  }

  public get result(): number {
    return this._result;
  }

  /**
   * 
   * @param token 
   * @returns true if the toke can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;