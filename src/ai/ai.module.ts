import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
  imports: [SupabaseModule],
})
export class AiModule { }
