import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ id: false })
export class History extends Document {
  @Prop() id: string;
  @Prop() url: string;
  @Prop() mobileScore: number;
  @Prop() desktopScore: number;
  @Prop() createdAt: string;
}
export const HistorySchema = SchemaFactory.createForClass(History);
