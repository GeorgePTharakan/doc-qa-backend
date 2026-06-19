import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { AiModule } from 'src/ai/ai.module';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { DocumentController } from './document.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  providers: [DocumentService],
  imports: [AiModule, SupabaseModule,],
  exports: [DocumentService],
  controllers: [DocumentController]
})
export class DocumentModule { }
