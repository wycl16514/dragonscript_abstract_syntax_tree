git clone the code , run "npm i" to install dependency, and "npm start" to start the project

In this section we will show what is abstract syntax tree. For a rule or production, it can be reprensented by a tree like struture, non-terminal in the left of arraw can be the parent node, non-terminals or terminals in the right of arraw can be the children of the parent node. We need to pay attention is that, any nonterminals will be a internal node for the tree,
any terminals in the tree would result in leafs.

let's see an example 1+2; when parsing this expression, we will first utilize the rule stmt -> expr SEMI, this will implicitly construct a tree with root as stmt, and two children expr and SEMI. Since expr is nonterminal, we can grow it further, because we can utilize the rule expr -> expr PLUS expr, here the expr will be a parent node for symbols in the right, but 
here we will use the terminal PLUS as the direct child of expr of the left, and two exprs in the right will be children of the plus node, and then the two expr will expand by using the 
rule expr -> NUM, that will result a tree like following:

<img width="845" alt="截屏2024-03-03 15 47 34" src="https://github.com/wycl16514/dragonscript_abstract_syntax_tree/assets/7506958/04c6d676-6c83-4da9-aa07-7d6f29f09fba">

Let's see how can we build such kind of tree, first we define the tree node as following:
```js
{
name: "NUM"
children: [],
attribute: "1",
}
```
the tree node structure has three fields, name contains the name for the node, childresn is an array will contains several tree node structure in it, and attribute will contains some notations about the node. Let's install a component to help use show the tree structure:
```js
npm i react-d3-tree
```
in arithmetic_parser.js, we add an array to save the root of each arithmetic express we type in the console:
```js
export default class ArithmeticParser {
    constructor(expression) {
        this.expression = expression
        //this scanner is used to get all tokens at once
        this.init_scanner = new Scanner(expression);
        this.scanner = new Scanner(expression);
        //save all tokens for given expression
        this.tokens = []
        this.getExprTokens()
        //contains root for each arithmetic express
        this.parseTrees = []
    }

    ...
     createParseTreeNode = (name) => {
        return {
            name: name,
            children: [],
            attributes: "",
        }
    }

}
```
we also add a helper function to create an empty node with only the name field setted. when the parse function is called, we will create a root node and root node for each 
```js
parse = () => {
        //clear the parsing tree
        const treeRoot = this.createParseTreeNode("root")
        //clear all
        this.parseTrees = []
        //execute the first rule
        const res = this.stmt()
        treeRoot.children = this.parseTrees
        return {
            parseResult: res,
            parseTree: treeRoot
        }
    }
```
in each parsing stage we will create a node for it and append it as children to their parent node:
```js
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

```
in expr, it will receive a parent node, it will create a node with name "expr" as a child for the parent , then create a "NUM" node as the child of the expr node, and set the 
attribute of the num node to its value. if we use the rule expr -> expr PLUS expr, then we create a PLUS node as the child of expr node, and expand the two expr as the children 
of PLUS, now we thurn into terminal.js, we will add a new command arithparsetree to create the abstract syntax tree:
```
import Terminal from 'react-console-emulator'
import Scanner from '../../compiler/scanner/token'
import ArithmeticParser from '../../compiler/parser/arithmetic_parser/arithmetic_parser'
import Tree from 'react-d3-tree'
import { useState } from 'react';

const TerminalEmulator = () => {
    const [parseTree, setParseTree] = useState(undefined)
    const [showTerminal, setShowTerminal] = useState(true)

    const printToken = (token) => {
        return `token object: \n{
            lexeme: "${token.lexeme}",
            token: ${token.token},
            line: ${token.line}
        }\n`
    }
    const commands = {
        arithparsetree: {
            description: 'creating a arithmetic parse tree with only + and *.',
            usage: "usage arithparsetree <string>",
            fn: (...args) => {
                const parser = new ArithmeticParser(args.join(' '))
                let res = ''
                try {
                    res = parser.parse()
                    setParseTree(res.parseTree)
                    setShowTerminal(false)
                }
                catch (err) {
                    res = err.message
                }
                return res.parseResult
            }
        },
        arithparse: {
            description: 'parsing a arithmetic expression with only + and *.',
            usage: 'arithparse <string>',
            fn: (...args) => {
                const parser = new ArithmeticParser(args.join(' '))
                let res = ''
                try {
                    res = parser.parse()
                    setParseTree(res.parseTree)
                }
                catch (err) {
                    res = err.message
                }
                return res.parseResult
            }
        },
        lexing: {
            description: 'lexing a passed string.',
            usage: 'lexing <string>',
            fn: (...args) => {
                const scanner = new Scanner(args.join(' '))
                let exe_result = ''
                while (true) {
                    const token_obj = scanner.scan()
                    if (token_obj.token !== Scanner.EOF) {
                        exe_result += printToken(token_obj)
                    }


                    if (token_obj.token === Scanner.EOF) {
                        break
                    }
                }

                return exe_result
            }
        }
    }

    return (
        <div split="horizontal">
            <div>
                {
                    showTerminal && <Terminal
                        commands={commands}
                        welcomeMessage={'Welcome to the dragon script terminal!'}
                        promptLabel={'me@dragon:~$'}
                    />
                }
            </div>
            {parseTree &&
                (
                    <div id="treeWrapper" style={{
                        paddingLeft: '20',
                        width: '100em', height: '100em'
                    }}>
                        <Tree data={parseTree} />
                    </div>

                )
            }
        </div>

    )
}
export default TerminalEmulator
```
if you are not familiar with react js, you can ignore useState here, this function is used to bind data in the code we UI shown on the web, initially we set parseTree to undefined and
showTerminal to false, if the arithparsetree command is executed, then we will set parseTree to the root of the syntax created by the parser, and set showTermial to false, this will 
cause react js hide the Terminal component, and now parseTree is not defiend any more, and this will cause react js to render the Tree component which will show us the abstract syntax
tree structure.

After completing all those code, let's type the following command in the console:
<img width="510" alt="截屏2024-03-03 16 25 58" src="https://github.com/wycl16514/dragonscript_abstract_syntax_tree/assets/7506958/39dc2aa2-1ce4-4b0c-9a7a-b132cf52b5dd">
when you hit return, you will see this tree:
<img width="729" alt="截屏2024-03-03 16 25 26" src="https://github.com/wycl16514/dragonscript_abstract_syntax_tree/assets/7506958/23c5f3f9-47bb-4858-a652-38a8ea2b9ddb">

we can see there are tree stmt nodes, each represent the parsing process of each expression
