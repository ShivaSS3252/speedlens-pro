import { Module } from '@nestjs/common';
import { StackDetectorService } from './stack-detector.service';
import { FixGeneratorService } from './fix-generator.service';

@Module({
  providers: [StackDetectorService, FixGeneratorService],
  exports: [StackDetectorService, FixGeneratorService],
})
export class AiModule {}
