import { Body, Controller, Post } from '@nestjs/common';
import { DocumentService } from './document.service';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { memoryStorage } from 'multer';

@Controller('document')
export class DocumentController {
    constructor(private readonly documentService: DocumentService) { }

    @Post('ingest')
    async ingestDocument(@Body() body: { text: string }): Promise<{ documentId: string }> {
        const documentId = await this.documentService.ingestDocument(body.text);

        return { documentId: documentId };
    }

    @Post('query')
    async queryDocument(@Body() body: { question: string, documentId: string }): Promise<{ answer: string, sources: { content: string, similarity: number, rank: number, finalScore: number, chunk_index: number, char_count: number, section_heading: string | null }[] }> {
        const response = await this.documentService.queryDocument(body.question, body.documentId);

        return { answer: response.answer, sources: response.sources };
    }


    @Post('ingest-pdf')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async ingestPdf(@UploadedFile() file: any): Promise<{ documentId: string }> {
        const documentId = await this.documentService.ingestPdf(file.buffer);
        return { documentId: documentId };
    }
}
