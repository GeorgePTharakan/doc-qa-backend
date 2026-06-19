import { Injectable } from '@nestjs/common';
import { AiService } from 'src/ai/ai.service';
import { DocumentService } from 'src/document/document.service';

@Injectable()
export class AgentService {
    constructor(
        private readonly aiService: AiService,
        private readonly documentService: DocumentService,
    ) { }

    async run(question: string, documentId: string): Promise<string> {
        const systemPrompt = `You are a senior agent and a distinguished person with an experience
                            of more than 15 years in the field of agents.
                            There are 4 tools in total.
                            1.searchDocument , which checks the chunks the vector db. use when the question
                            .needs information from the document
                            2.directAnswer, which returns the direct answer. use when the question is simple,
                            conversational, or can be answered without retrieval
                            3.calculate, which performs calculations. use when the question requires 
                            a mathematical calculation
                            4.webSearch, which searches the web if the answer is not in the document. 
                            use when the question needs current information not in the document
                            You should choose from these set of tools and respond what to do , 
                            it should be in JSON with tool and argument fields.

                            these should be the shape for each tool respectively:
                            1.arguments: {"question": "..."}
                            2.arguments: {"answer":  "..."}
                            3.arguments: {"expression": "..."}
                            4.arguments: {"query": "..."}

                            the json shape must be { "tool": "toolName", "arguments": { ... } }
                            And its important that you only return  in JSON format, JSON object, 
                            that's it , nothing else should be there in the response, no preamble,
                             no explanation, just the object`;

        const calculateSystemPrompt = `You are a senior mathematician with more than 15 years of experience. 
                                        You solve any mathematical question that is send to you and strictly 
                                        return the answer in json format, in the format {answer: value}
                                        and nothing else`

        let results: { tool: string, result: string }[] = [];
        let iterations = 0;
        const maxIterations = 5;

        while (true) {
            if (iterations >= maxIterations) return "Could not complete the request";
            iterations++;
            const userMessage = `Question: ${question}\n\nHistory:\n${JSON.stringify(results)}`;
            const llmResponse = await this.aiService.generate(systemPrompt, userMessage);
            const parsedResponse = JSON.parse(llmResponse);
            if (parsedResponse.tool === 'directAnswer') {
                return parsedResponse.arguments.answer;
            }
            if (parsedResponse.tool === 'searchDocument') {
                const result = await this.documentService.queryDocument(parsedResponse.arguments.question, documentId);
                results.push({ tool: 'searchDocument', result: result.answer })
            } else if (parsedResponse.tool === 'calculate') {
                // use parsedResponse.arguments.expression
                const result = await this.aiService.generate(calculateSystemPrompt, parsedResponse.arguments.expression);
                results.push({ tool: 'calculate', result: JSON.parse(result).answer });
            } else if (parsedResponse.tool === 'webSearch') {
                // use parsedResponse.arguments.query
            }
        }
    }
}
