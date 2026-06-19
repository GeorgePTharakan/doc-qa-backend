import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Post()
    async run(@Body() body: { question: string, documentId: string }): Promise<string> {
        const response = await this.agentService.run(body.question, body.documentId);
        return response;
    }
}
