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