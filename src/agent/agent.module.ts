import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AiModule } from 'src/ai/ai.module';
import { DocumentModule } from 'src/document/document.module';
import { AgentController } from './agent.controller';

@Module({
    providers: [AgentService],
    imports: [AiModule, DocumentModule],
    controllers: [AgentController],
})
export class AgentModule { }
