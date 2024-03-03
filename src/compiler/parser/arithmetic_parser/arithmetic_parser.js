import Scanner from '../../scanner/token'
export default class ArithmeticParser {
    constructor(expression) {
        this.expression = expression
        //this scanner is used to get all tokens at once
        this.init_scanner = new Scanner(expression);
        this.scanner = new Scanner(expression);
        //save all tokens for given expression
        this.tokens = []
        this.getExprTokens()

        this.parseTrees = []
    }

    getExprTokens = () => {
        while (true) {
            const token_obj = this.init_scanner.scan()
            if (token_obj.token !== Scanner.EOF) {
                this.tokens.push(token_obj)
            } else {
                break
            }
        }

        //need to make sure expression end with semicolon
        const last_token = this.tokens[this.tokens.length - 1];
        if (last_token.token !== Scanner.SEMICOLON) {
            throw new Error("Expression not end with semicolon")
        }
    }

    matchToken = (token) => {
        //check the given token can match the current token or not
        const cur_token = this.scanner.scan()
        if (cur_token.token !== token) {
            throw new Error(`token mismatch, expected: ${token}, got: ${cur_token.token}`)
        }
        return cur_token
    }

    createParseTreeNode = (name) => {
        return {
            name: name,
            children: [],
        }
    }

    expr = (tokens, parentNode) => {

        const exprNode = this.createParseTreeNode("expr")
        parentNode.children.push(exprNode)
        /*
        1, if the input tokens has only one element, then choose expr -> NUM
        2, if the input tokens has more than one element, iterate over the input tokens, if there are PLUS terminator in it, use expr -> expr PLUS expr
        3, if the input tokens has more than one element, iterate over the input tokens, if there are MUL terminator in in it, use expr -> expr MUL expr
        4, throw error if none of above happened
        */
        if (tokens.length === 1) {
            //expr -> NUM
            const token_obj = this.matchToken(Scanner.NUMBER);

            const numNode = this.createParseTreeNode("NUM")
            numNode.attributes = {
                "value": token_obj.lexeme
            }
            exprNode.children.push(numNode)

            return parseInt(token_obj.lexeme)
        }

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token === Scanner.PLUS) {
                const pluseNode = this.createParseTreeNode("+")
                exprNode.children.push(pluseNode)
                //expr -> expr PLUS expr
                const left = this.expr(tokens.slice(0, i), pluseNode)
                this.matchToken(Scanner.PLUS)
                const right = this.expr(tokens.slice(i + 1, tokens.length), pluseNode)
                return left + right
            }
        }

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].token === Scanner.START) {
                const mulNode = this.createParseTreeNode("*")
                exprNode.children.push(mulNode)
                //expr -> expr MUL expr
                const left = this.expr(tokens.slice(0, i), mulNode)
                this.matchToken(Scanner.START)
                const right = this.expr(tokens.slice(i + 1, tokens.length), mulNode)
                return left * right
            }
        }

        //error here
        throw new Error("error for input expression")
    }

    stmt = () => {
        /*
        an semicolon indicate a end of expression, we iterate the tokens array,
        if we found one semicolon, then we take out tokens we collect now and
        send them to parse
        */

        //stmt -> expr SEMI
        let res = ""
        let tokens = []
        for (let i = 0; i < this.tokens.length; i++) {
            if (this.tokens[i].token !== Scanner.SEMICOLON) {
                tokens.push(this.tokens[i])
            } else {
                //send them to parse
                const stmtNode = {
                    name: "stmt",
                    children: [],
                }
                res += this.expr(tokens, stmtNode)
                this.matchToken(Scanner.SEMICOLON)
                tokens = []
                res += ";"

                this.parseTrees.push(stmtNode)
            }
        }


        return res
    }

    parse = () => {
        //clear the parsing tree
        const treeRoot = this.createParseTreeNode("root")
        this.parseTrees = []
        //execute the first rule
        const res = this.stmt()
        treeRoot.children = this.parseTrees
        return {
            parseResult: res,
            parseTree: treeRoot
        }
    }
}